import { Observable, Observer } from 'rxjs';
import {
    chan,
    go,
    spawn,
    timeout,
    alts,
    put,
    take,
    putAsync,
    mult,
    removeInto,
    mapInto
} from 'js-csp';
import {
    conditionalLog,
    ValueOrFunc,
    getAsValue,
    capString,
    id
} from './common';
import { ObsOrFunc, getAsObs } from './rxutils';

/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
export const firstToChannel = (
    obs: Observable<any>,
    channel?: any,
    autoClose?: boolean,
    finishCh?: any
): any => observableToChannel(obs.take(1), channel, autoClose);

export const observableToChannel = (
    obs: Observable<any>,
    channel?: any,
    autoClose?: boolean,
    finishCh?: any
): any => {
    autoClose = typeof autoClose === 'boolean' ? autoClose : !channel;
    const ch = channel || chan();
    obs.subscribe({
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
            if (autoClose) {
                ch.close();
            }
        }
    });
    return ch;
};

export function* startPinging(req: {
    pingCh: any;
    pingValue: any;
    pingTimeMilliseconds: number;
    cancelCh: any;
    pingAsync?: boolean;
    logToConsole?: boolean;
    onFinish?: (error: any) => void;
}) {
    const log = conditionalLog(req.logToConsole, { prefix: 'PING: ' });
    log('Start');

    let error: any;
    try {
        while (true) {
            const result = alts([
                req.cancelCh,
                timeout(req.pingTimeMilliseconds)
            ]);
            if (result.channel === req.cancelCh) {
                log('canceling');
                break;
            }
            if (req.pingAsync) {
                log('pinging (async)');
                putAsync(req.pingCh, req.pingValue);
            } else {
                log('pinging');
                yield put(req.pingCh, req.pingValue);
            }
        }
    } catch (e) {
        error = e;
        log('ERROR', e);
    }
    if (req.onFinish) {
        req.onFinish(error);
    }
    log('End');
}

export interface LeaseChannels {
    leaseCh: any;
    pingCh: any;
    releaseCh: any;
}

/**
 * Starts a leasing process that works like so:
 * - A leaseFn is used to borrow a lease for a given duration in seconds.
 *   Upon failure to get the lease the process stops.
 * - Every timeout seconds, a ping is expected from outside the leasing process,
 *   through the channel pingCh. If at least one ping arrives by that time,
 *   the lease is tried to be renewed, otherwise the lease is released and the
 *   process stops.
 * -
 * @param leaseFn   A leasing function to perform a lease for a given amount of
 *                  time. This is a client defined operation. It should accept a
 *                  duration in seconds and return an observable that returns
 *                  true or false whether the lease is acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease is reserved, to ensure
 *                  release.
 * @param options   - timeoutSecs: Represents maximum time in seconds when the
 *                  client is expected to use the ping channel to communicate
 *                  it's interest in keeping the lease. If that time elapses and
 *                  no ping is received the lease will be released.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  add to timeoutSecs to reserve the lease. After that time the
 *                  underlying lease mechanism could decide to automatically
 *                  release the lease for other processes.
 *                  - autoClose: Indicates whether the lease channels will be
 *                  closed after the process has stopped.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 * @returns A lease channels to communicate with the client code, with channels:
 *          - leaseCh:  To communicate lease status. true to indicate the first
 *                      lease acquisition, before that the lease cannot be
 *                      considered taken. false to indicate that the lease was
 *                      not taken or that it was released, due to timeout or
 *                      explicit request.
 */
export const startLeasing = (
    leaseFn: (leaseTimeSecs: number) => Observable<boolean>,
    releaseFn: () => Observable<void>,
    options?: Partial<{
        timeoutSecs: number;
        leaseMarginSecs: number;
        autoClose: boolean;
        logToConsole: boolean;
    }>
): LeaseChannels => {
    const {
        timeoutSecs,
        leaseMarginSecs,
        autoClose,
        logToConsole
    } = Object.assign(
        {
            timeoutSecs: 60,
            leaseMarginSecs: 15,
            autoClose: true,
            logToConsole: false
        },
        options
    );

    const log = conditionalLog(logToConsole, {
        prefix: () => `LEASING: `
    });
    log('Start');

    const leaseCh = chan();
    const pingCh = chan();
    const releaseCh = chan();
    const leaseTimeSecs = timeoutSecs + leaseMarginSecs;

    go(function*() {
        let firstTime = 0;
        while (true) {
            log('MAIN loop #', firstTime);
            const leaseResult = yield take(
                firstToChannel(leaseFn(leaseTimeSecs), undefined, false)
            );

            if (!leaseResult || leaseResult.error || !leaseResult.value) {
                // Signal a lease lost, and stop trying to further lease resource
                if (firstTime === 0) {
                    putAsync(leaseCh, false);
                }
                break;
            } else {
                if (firstTime === 0) {
                    putAsync(leaseCh, true);
                }
            }
            firstTime++;

            const endTime = new Date().getTime() + timeoutSecs * 1000;
            let pingCalled = 0;
            let releaseCalled = false;
            let timeoutCalled = false;
            // Now we have leaseTimeSecs plus a margin to wait before issuing a new lease request
            while (!releaseCalled && !timeoutCalled) {
                log('PING loop #', pingCalled);
                const toWait = endTime - new Date().getTime();
                if (toWait <= 0) {
                    timeoutCalled = true;
                    break;
                }
                const tout = timeout(toWait);
                const waitResult = yield alts([pingCh, releaseCh, tout], {
                    priority: true
                });
                pingCalled =
                    pingCalled + (waitResult.channel === pingCh ? 1 : 0);
                releaseCalled =
                    releaseCalled || waitResult.channel === releaseCh;
                timeoutCalled = timeoutCalled || waitResult.channel === tout;
            }
            log(
                'TESTING #',
                pingCalled > 0 ? 'PING' : '',
                releaseCalled ? 'RELEASE' : '',
                timeoutCalled ? 'TIMEOUT' : ''
            );

            if (releaseCalled || (timeoutCalled && pingCalled === 0)) {
                putAsync(leaseCh, false);
                log('Breaking');
                break;
            }
        }

        releaseFn().subscribe();
        if (autoClose) {
            log('Closing');
            leaseCh.close();
            pingCh.close();
            releaseCh.close();
        }
        log('End');
    });

    return { leaseCh, pingCh, releaseCh };
};

export class PipelineTarget {
    targetName?: string;
    targetIndex?: number;
    targetOffset?: number;
    constructor(
        public value: any,
        options?: {
            targetName?: string;
            targetIndex?: number;
            targetOffset?: number;
        }
    ) {
        if (!options) {
            this.targetOffset = 1;
        } else if (typeof options.targetName === 'string') {
            this.targetName = options.targetName;
        } else if (typeof options.targetIndex === 'number') {
            this.targetIndex = options.targetIndex;
        } else if (typeof options.targetOffset === 'number') {
            this.targetOffset = options.targetOffset;
        } else {
            this.targetOffset = 1;
        }
    }

    static fromValue(value: any) {
        if (value instanceof PipelineTarget) {
            return value;
        } else {
            return new PipelineTarget(value);
        }
    }

    select<T>(dict: Map<number | string, T>, currentIndex: number) {
        if (this.targetName) {
            if (!dict.has(this.targetName)) {
                throw new Error(
                    `Expected to find element with name ${this.targetName}`
                );
            }
            return dict.get(this.targetName);
        } else {
            const index =
                typeof this.targetIndex === 'number'
                    ? this.targetIndex
                    : typeof this.targetOffset === 'number'
                      ? currentIndex + this.targetOffset
                      : currentIndex;
            if (!dict.has(index)) {
                throw new Error(`Expected to find element with index ${index}`);
            }
            return dict.get(index);
        }
    }
}

export interface PipelineNodeInit {
    name: string;
    process: (value: any) => Observable<PipelineTarget | any>;
    inputCh?: ValueOrFunc<any>;
    bufferSize?: number;
    cancelFast?: boolean;
}

export interface PipelineNode {
    name: string;
    inputCh: any;
    statusCh: any;
}

export interface PipelineChannels {
    statusCh: any;
    inputChByName: { [key: string]: any };
    inputChByIndex: any[];
}

export const runPipelineNode = (
    req: PipelineNodeInit & {
        outputCh: any;
        cancelCh?: any;
    },
    options?: Partial<{
        logToConsole: boolean;
    }>
): PipelineNode => {
    const opts = Object.assign(
        {
            logToConsole: false
        },
        options
    );

    const name = req.name;
    const log = conditionalLog(opts.logToConsole, {
        prefix: `PIPELINE NODE [${name}]: `
    });
    const outputCh = req.outputCh;
    const inputCh = getAsValue(req.inputCh) || chan(req.bufferSize);
    const cancelCh = req.cancelCh || chan();
    const statusCh = chan(1);
    const waitChannels = req.cancelFast
        ? [cancelCh, inputCh]
        : [inputCh, cancelCh];
    log('Start');

    go(function*() {
        putAsync(statusCh, true);
        try {
            while (true) {
                log('Waiting');
                const result = yield alts([inputCh, cancelCh], {
                    priority: true
                });
                if (result.channel === cancelCh) {
                    log('cancelling');
                    break;
                } else {
                    log(
                        () =>
                            `process ${capString(
                                JSON.stringify(result.value),
                                40
                            )}`
                    );
                    const doneCh = chan();
                    const processed = req.process(result.value).do({
                        next: value =>
                            log(
                                () =>
                                    `processed INTO ${capString(
                                        JSON.stringify(value),
                                        40
                                    )}`
                            ),
                        error: error => {
                            putAsync(doneCh, false);
                            log(() => `process ERROR! ${error}`);
                        },
                        complete: () => {
                            putAsync(doneCh, true);
                            log(`process DONE!`);
                        }
                    });
                    observableToChannel(processed, outputCh, false);
                    const done = yield take(doneCh);
                    if (!done) {
                        log('breaking due to ERROR');
                        break;
                    }
                }
            }
            putAsync(statusCh, false);
        } catch (error) {
            log('PROCESSING ERROR', error);
            putAsync(statusCh, false);
            throw error;
        }
    });

    return { name, inputCh, statusCh };
};

export const runPipeline = (
    nodes: (PipelineNodeInit & {
        initialValues?: ObsOrFunc<any>;
    })[],
    options: Partial<{
        cancelCh: any; // Cancel channel
        leasing: ValueOrFunc<LeaseChannels>;
        leasingPingTimeSecs: number;
        logToConsole: boolean;
    }>
): PipelineChannels => {
    const opts = Object.assign(
        {
            logToConsole: false,
            leasing: <ValueOrFunc<LeaseChannels>>null,
            leasingPingTimeSecs: 60
        },
        options
    );

    const log = conditionalLog(opts.logToConsole, {
        prefix: () => `PIPELINE: `
    });

    const cancelCh = opts.cancelCh || chan();
    const cancelMult = mult(cancelCh);
    const statusCh = chan(1);
    const inputChByName = {};
    const inputChByIndex = [];

    function* runPipeline$$() {
        const nodesByNameAndIndex = new Map<string | number, PipelineNode>();
        const startChannels = [];
        const finishChannels = [];

        for (let i = 0; i < nodes.length; i++) {
            const index = i; /// Avoid closure problems!!!
            const node = nodes[index];
            const nodeLog = conditionalLog(opts.logToConsole, {
                prefix: () => `PIPELINE [${node.name}]: `
            });
            nodeLog('INIT');
            const outputCh = chan();
            const nodeCancelCh = chan();
            const startCh = chan();
            const finishCh = chan();
            startChannels.push(startCh);
            finishChannels.push(finishCh);

            mult.tap(cancelMult, nodeCancelCh);
            const nodeController = runPipelineNode({
                name: node.name,
                process: node.process,
                inputCh: node.inputCh,
                bufferSize: node.bufferSize,
                cancelFast: node.cancelFast,
                outputCh,
                cancelCh: nodeCancelCh
            });
            nodesByNameAndIndex.set(index, nodeController);
            nodesByNameAndIndex.set(node.name, nodeController);
            inputChByName[node.name] = node.inputCh;
            inputChByIndex[index] = node.inputCh;

            if (node.initialValues) {
                const initialValues = getAsObs(node.initialValues);
                const onlyWithValueCh = mapInto(x => x.value, node.inputCh);
                const withoutErrorsCh = removeInto(x => x.error, onlyWithValueCh);
                observableToChannel(initialValues, withoutErrorsCh, false);
            }

            go(function*() {
                nodeLog('Starting');
                yield take(startCh);
                let error: any;
                try {
                    while (true) {
                        const result = alts([outputCh, nodeCancelCh], {
                            priority: true
                        });
                        if (result.channel === nodeCancelCh) {
                            nodeLog('cancelled');
                            break;
                        } else {
                            const outValue = PipelineTarget.fromValue(
                                result.value
                            );
                            const targetNode = outValue.select(
                                nodesByNameAndIndex,
                                index
                            );
                            yield put(targetNode.inputCh, outValue.value);
                        }
                    }
                } catch (e) {
                    error = e;
                    nodeLog('ERROR', e);
                }
                mult.untap(cancelMult, nodeCancelCh);
                yield put(finishCh, error || true);
                nodeLog('Finished');
            });
        }

        for (let i = 0; i < startChannels.length; i++) {
            yield put(startChannels[i], true);
        }

        for (let i = 0; i < finishChannels.length; i++) {
            yield take(finishChannels[i]);
        }
    }

    function* main$$() {
        log('MAIN Start');
        const leasing = getAsValue(opts.leasing);
        if (leasing) {
            log('Using LEASING');

            const leaseAcquired: boolean = yield take(leasing.leaseCh);

            if (leaseAcquired) {
                log('Lease acquired');
                const cancelLeaseCh = chan();
                mult.tap(cancelMult, cancelLeaseCh);
                go(startPinging, {
                    pingCh: leasing.pingCh,
                    pingValue: true,
                    pingTimeMilliseconds: opts.leasingPingTimeSecs * 1000,
                    cancelCh: cancelLeaseCh,
                    pingAsync: false,
                    onFinish: () => {
                        mult.untap(cancelMult, cancelLeaseCh);
                        putAsync(leasing.releaseCh, true);
                    }
                });

                putAsync(statusCh, true);

                yield take(go(runPipeline$$));

                putAsync(statusCh, false);
            } else {
                log('Lease NOT ACQUIRED');
                putAsync(statusCh, false);
            }
        } else {
            log('NOT using LEASING');

            putAsync(statusCh, true);

            yield take(go(runPipeline$$));

            putAsync(statusCh, false);
        }
        log('MAIN End');
    }

    go(main$$);

    return { statusCh, inputChByName, inputChByIndex };
};
