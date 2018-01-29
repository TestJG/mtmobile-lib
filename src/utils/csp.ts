import { Observable, Observer } from 'rxjs';
const {
    chan,
    go,
    spawn,
    timeout,
    alts,
    put,
    take,
    putAsync
} = require('js-csp');

/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
export const firstToChannel = (
    obs: Observable<any>,
    autoClose: boolean = true
): any => {
    const ch = chan();
    obs.take(1).subscribe({
        next: value => {
            go(function*() {
                yield put(ch, { value });
            });
        },
        error: error => {
            go(function*() {
                yield put(ch, { error });
                if (autoClose) {
                    ch.close();
                }
            });
        },
        complete: () => {
            if (autoClose && !ch.isClosed()) {
                ch.close();
            }
        }
    });
    return ch;
};

export const startLeasing = (
    leaseFn: (leaseTimeSecs: number) => Observable<boolean>,
    releaseFn: () => Observable<void>,
    options?: Partial<{
        timeoutSecs: number;
        leaseMarginSecs: number;
        autoClose: boolean;
    }>
) => {
    const { timeoutSecs, leaseMarginSecs, autoClose } = Object.assign({
        timeoutSecs: 60,
        leaseMarginSecs: 15,
        autoClose: true,
    }, options);

    const leaseCh = chan();
    const pingCh = chan();
    const releaseCh = chan();
    const leaseTimeSecs = timeoutSecs + leaseMarginSecs;

    go(function*() {
        let firstTime = true;
        while (true) {
            const leaseResult = yield take(
                firstToChannel(leaseFn(leaseTimeSecs), false)
            );

            if (!leaseResult || leaseResult.error || !leaseResult.value) {
                // Signal a lease lost, and stop trying to further lease resource
                if (firstTime) {
                    putAsync(leaseCh, false);
                }
                break;
            } else {
                if (firstTime) {
                    putAsync(leaseCh, true);
                }
            }
            firstTime = false;

            const endTime = new Date().getTime() + timeoutSecs * 1000;
            let pingCalled = false;
            let releaseCalled = false;
            let timeoutCalled = false;
            // Now we have leaseTimeSecs plus a margin to wait before issuing a new lease request
            while (!releaseCalled && !timeoutCalled) {
                const toWait = endTime - new Date().getTime();
                if (toWait <= 0) {
                    timeoutCalled = true;
                    break;
                }
                const tout = timeout(toWait);
                const waitResult = yield alts([pingCh, releaseCh, tout], {
                    priority: true
                });
                pingCalled = pingCalled || waitResult.channel === pingCh;
                releaseCalled =
                    releaseCalled || waitResult.channel === releaseCh;
                timeoutCalled = timeoutCalled || waitResult.channel === tout;
            }

            if (releaseCalled || (timeoutCalled && !pingCalled)) {
                putAsync(leaseCh, false);
                break;
            }
        }

        releaseFn().subscribe();
        if (autoClose) {
            leaseCh.close();
            pingCh.close();
            releaseCh.close();
        }
    });

    return { leaseCh, pingCh, releaseCh };
};
