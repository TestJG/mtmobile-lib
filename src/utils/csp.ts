import { Observable, Observer, Subject, Symbol } from 'rxjs';
import {
    chan,
    promiseChan,
    go,
    spawn,
    timeout,
    alts,
    put,
    take,
    putAsync,
    mult,
    removeInto,
    mapInto,
    onto,
    CLOSED
} from 'js-csp';
import {
    conditionalLog,
    ValueOrFunc,
    getAsValue,
    capString,
    id,
    noop
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
    options?: Partial<{
        channel: any;
        autoClose: boolean;
    }>
): any => observableToChannel(obs.take(1), options);

export const observableToChannel = (
    obs: Observable<any>,
    options?: Partial<{
        channel: any;
        autoClose: boolean;
    }>
): any => {
    const opts = Object.assign({}, options);
    const autoClose =
        typeof opts.autoClose === 'boolean' ? opts.autoClose : !opts.channel;
    const ch = opts.channel || chan();
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

export const channelToObservable = <T>(ch: any) =>
    <Observable<T>>Observable.create((o: Observer<T>) => {
        const cancelCh = promiseChan();
        go(function*() {
            while (true) {
                const result = yield alts([cancelCh, ch], { priority: true });
                if (result.channel === cancelCh || result.value === CLOSED) {
                    o.complete();
                    break;
                } else {
                    o.next(<T>result.value);
                }
            }
        });
        return () => {
            putAsync(cancelCh, true);
        };
    });

export interface PingHandler {
    release: () => any;
    finishedProm: any;
}

export const startPinging = (
    pingCh: any,
    pingTimeMilliseconds: number,
    options?: Partial<{
        pingAsync: boolean;
        autoClose: boolean;
        logToConsole: boolean | ValueOrFunc<string>;
    }>
): PingHandler => {
    const opts = Object.assign(
        {
            pingAsync: false,
            autoClose: false,
            logToConsole: false
        },
        options
    );
    const { pingAsync } = opts;
    const releaseCh = promiseChan();

    const finishedProm = go(function*() {
        const log = conditionalLog(opts.logToConsole);
        log('Start');

        let error: any;
        let index = 0;
        try {
            while (true) {
                const result = yield alts(
                    [releaseCh, timeout(pingTimeMilliseconds)],
                    { priority: true }
                );
                if (result.channel === releaseCh) {
                    log('canceling before ping', index + 1);
                    break;
                }

                index++;
                if (pingAsync) {
                    putAsync(pingCh, index);
                } else {
                    yield put(pingCh, index);
                }
                log(() => 'ping #' + index);
            }
        } catch (e) {
            error = e;
            log('ERROR', e);
        }
        if (opts.autoClose) {
            pingCh.close();
        }
        log('End');
    });

    const release = () =>
        go(function*() {
            yield put(releaseCh, true);
        });

    return { release, finishedProm };
};

export interface LeaseHandler {
    release: () => any;
    pingCh: any;
    startedProm: any;
    finishedProm: any;
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
 *                  duration in seconds and return a channel that returns
 *                  true or false whether the lease was acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease was reserved, to ensure
 *                  release.
 * @param options   - leaseTimeoutSecs: Represents the lease time in seconds.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  subtract from leaseTimeoutSecs to consider that the client
 *                  will not issue a ping in time.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 */
export const startLeasing = (
    leaseFn: (leaseTimeSecs: number) => any,
    releaseFn: () => any,
    options?: Partial<{
        leaseTimeoutSecs: number;
        leaseMarginSecs: number;
        logToConsole: boolean | ValueOrFunc<string>;
    }>
): LeaseHandler => {
    const opts = Object.assign(
        {
            leaseTimeoutSecs: 60,
            logToConsole: false
        },
        options
    );
    const { leaseTimeoutSecs, logToConsole } = opts;
    const leaseMarginSecs =
        typeof opts.leaseMarginSecs === 'number'
            ? opts.leaseMarginSecs
            : leaseTimeoutSecs * 0.1;

    const log = conditionalLog(logToConsole);
    log('Start');

    // const leaseCh = chan();
    const releaseCh = chan();
    const pingCh = chan();
    const startedProm = promiseChan();
    const timeoutSecs = leaseTimeoutSecs - leaseMarginSecs;

    const onePing = () => {
        const resultCh = promiseChan();
        go(function*() {
            const endTime = new Date().getTime() + timeoutSecs * 1000;
            let pingCalled = false;
            while (true) {
                const toWait = endTime - new Date().getTime();
                if (toWait <= 0) {
                    break;
                }
                const tout = timeout(toWait);
                const waitResult = yield alts([pingCh, releaseCh, tout], {
                    priority: true
                });
                if (waitResult.channel === pingCh) {
                    log('ping #' + waitResult.value);
                    pingCalled = true;
                } else if (waitResult.channel === releaseCh) {
                    log('releasing');
                    yield put(resultCh, false);
                    break;
                } else {
                    if (!pingCalled) {
                        log('timeout');
                    }
                    yield put(resultCh, pingCalled);
                }
            }
        });
        return resultCh;
    };

    const finishedProm = go(function*() {
        let firstTime = true;
        while (true) {
            const leaseGranted = yield leaseFn(leaseTimeoutSecs);
            if (!leaseGranted) {
                if (firstTime) {
                    log('lease was not granted');
                    putAsync(startedProm, false);
                }
                break;
            } else {
                if (firstTime) {
                    log('lease was granted');
                    putAsync(startedProm, true);
                }
            }
            firstTime = false;

            const continueLeasing = yield onePing();

            if (!continueLeasing) {
                log('releasing lease');
                yield put(releaseFn(), true);
                break;
            }
            log('continue lease');
        }
        releaseCh.close();
        pingCh.close();
        startedProm.close();
        log('End');
    });

    const release = () =>
        go(function*() {
            yield put(releaseCh, true);
        });

    return { release, pingCh, startedProm, finishedProm };
};

export interface PipelineNodeHandler {
    startedProm: any;
    finishedProm: any;
    input: (value: any) => any;
    cancel: () => void;
    release: () => any;
}

export const runPipelineNode = (
    opts: {
        process: (value: any) => any;
    } & Partial<{
        inputCh: number | any;
        initialValues: any;
        logToConsole: boolean | ValueOrFunc<string>;
    }>
): PipelineNodeHandler => {
    const log = conditionalLog(opts.logToConsole);
    log('Start');
    const RELEASE = global.Symbol('RELEASE');
    const startedProm = promiseChan();
    const cancelProm = promiseChan();
    const inputCh =
        typeof opts.inputCh === 'number'
            ? chan(opts.inputCh)
            : opts.inputCh ? opts.inputCh : chan();

    const finishedProm = go(function*() {
        yield put(startedProm, true);
        let index = 0;
        while (true) {
            const result = yield alts([cancelProm, inputCh], {
                priority: true
            });
            if (result.channel === inputCh && result.value !== RELEASE) {
                try {
                    log('Processing input #' + ++index);
                    yield opts.process(result.value);
                } catch (e) {
                    log('ERROR', e);
                }
            } else {
                log(result.channel === cancelProm ? 'cancelled' : 'released');
                break;
            }
        }
    });

    if (opts.initialValues) {
        go(function*() {
            let index = 0;
            for (const value of opts.initialValues) {
                log('Insert init #' + ++index);
                yield put(inputCh, value);
            }
            log('Insert init done');
        });
    }

    const input = (value: any) => put(inputCh, value);
    const release = () => put(inputCh, RELEASE);
    const cancel = () => cancelProm.close();

    return { startedProm, finishedProm, input, release, cancel };
};

export class PipelineSequenceTarget {
    name?: string;
    index?: number;
    offset?: number;
    constructor(
        public value: any,
        options?: { name: string } | { index: number } | { offset: number }
    ) {
        if (options) {
            const opts = <any>options;
            if (typeof opts.name === 'string') {
                this.name = opts.name;
            } else if (typeof opts.index === 'number') {
                this.index = opts.index;
            } else if (typeof opts.offset === 'number') {
                this.offset = opts.offset;
            }
        } else {
            this.offset = 0;
        }
    }

    static fromValue(value: any) {
        if (value instanceof PipelineSequenceTarget) {
            return value;
        } else {
            return new PipelineSequenceTarget(value);
        }
    }

    select<T = any>(dict: Map<number | string, T>, currentIndex: number) {
        if (this.name) {
            if (!dict.has(this.name)) {
                throw new Error(
                    `Expected to find element with name ${this.name}`
                );
            }
            return dict.get(this.name);
        } else {
            const index =
                typeof this.index === 'number'
                    ? this.index
                    : typeof this.offset === 'number'
                      ? currentIndex + this.offset
                      : currentIndex;
            if (!dict.has(index)) {
                throw new Error(`Expected to find element with index ${index}`);
            }
            return dict.get(index);
        }
    }
}

export const toNamedTarget = (value: any, name: string) =>
    new PipelineSequenceTarget(value, { name });

export const toIndexedTarget = (value: any, index: number) =>
    new PipelineSequenceTarget(value, { index });

export const toOffsetTarget = (value: any, offset: number) =>
    new PipelineSequenceTarget(value, { offset });

export const toCurrentTarget = (value: any) => toOffsetTarget(value, 0);
export const toNextTarget = (value: any) => toOffsetTarget(value, 1);
export const toPreviousTarget = (value: any) => toOffsetTarget(value, -1);

export interface PipelineSequenceHandler {
    startedProm: any;
    finishedProm: any;
    input: (index: string | number, value: any) => any;
    cancel: () => void;
    release: () => any;
}

export const runPipelineSequence = (
    opts: {
        process: (value: any) => any;
    } & Partial<{
        inputCh: number | any;
        initialValues: any;
        logToConsole: boolean | ValueOrFunc<string>;
    }>
): PipelineSequenceHandler => {
    const log = conditionalLog(opts.logToConsole);
    log('Start');
    const RELEASE = global.Symbol('RELEASE');
    const startedProm = promiseChan();
    const cancelProm = promiseChan();

    const finishedProm = go(function*() {
        yield put(startedProm, true);
    });

    const input = (index: string | number, value: any) => null;
    const release = () => null;
    const cancel = () => cancelProm.close();

    return { startedProm, finishedProm, input, release, cancel };
};

// export interface PipelineNodeInit {
//     name: string;
//     process: (value: any) => Observable<PipelineTarget | any>;
//     inputCh?: ValueOrFunc<any>;
//     bufferSize?: number;
//     cancelFast?: boolean;
// }

// export interface PipelineNode {
//     name: string;
//     inputCh: any;
//     statusCh: any;
// }

// export interface PipelineChannels {
//     statusCh: any;
//     cancelCh: any;
//     inputChByName: { [key: string]: any };
//     inputChByIndex: any[];
// }

// export const runPipelineNode = (
//     req: PipelineNodeInit & {
//         outputCh: any;
//         cancelCh?: any;
//     },
//     options?: Partial<{
//         logToConsole: boolean;
//     }>
// ): PipelineNode => {
//     const opts = Object.assign(
//         {
//             logToConsole: false
//         },
//         options
//     );

//     const name = req.name;
//     const log = conditionalLog(opts.logToConsole, {
//         prefix: `PIPELINE NODE [${name}]: `
//     });
//     const outputCh = req.outputCh;
//     const inputCh = getAsValue(req.inputCh) || chan(req.bufferSize);
//     const cancelCh = req.cancelCh || chan();
//     const statusCh = chan(1);
//     const waitChannels = req.cancelFast
//         ? [cancelCh, inputCh]
//         : [inputCh, cancelCh];
//     log('Start');

//     go(function*() {
//         putAsync(statusCh, true);
//         try {
//             while (true) {
//                 log('Waiting');
//                 const result = yield alts([inputCh, cancelCh], {
//                     priority: true
//                 });
//                 if (result.channel === cancelCh) {
//                     log('cancelling');
//                     break;
//                 } else {
//                     log(
//                         () =>
//                             `process ${capString(
//                                 JSON.stringify(result.value),
//                                 40
//                             )}`
//                     );
//                     const doneCh = chan();
//                     const processed = req.process(result.value).do({
//                         next: value =>
//                             log(
//                                 () =>
//                                     `processed INTO ${capString(
//                                         JSON.stringify(value),
//                                         40
//                                     )}`
//                             ),
//                         error: error => {
//                             putAsync(doneCh, false);
//                             log(() => `process ERROR! ${error}`);
//                         },
//                         complete: () => {
//                             putAsync(doneCh, true);
//                             log(`process DONE!`);
//                         }
//                     });
//                     observableToChannel(processed, outputCh, false);
//                     const done = yield take(doneCh);
//                     if (!done) {
//                         log('breaking due to ERROR');
//                         break;
//                     }
//                 }
//             }
//             putAsync(statusCh, false);
//         } catch (error) {
//             log('PROCESSING ERROR', error);
//             putAsync(statusCh, false);
//             throw error;
//         }
//     });

//     return { name, inputCh, statusCh };
// };

// export const runPipeline = (
//     nodes: (PipelineNodeInit & {
//         initialValues?: ObsOrFunc<any>;
//     })[],
//     options: Partial<{
//         leasing: ValueOrFunc<LeaseChannels>;
//         leasingPingTimeSecs: number;
//         logToConsole: boolean;
//     }>
// ): PipelineChannels => {
//     const opts = Object.assign(
//         {
//             logToConsole: false,
//             leasing: <ValueOrFunc<LeaseChannels>>null,
//             leasingPingTimeSecs: 60
//         },
//         options
//     );

//     const log = conditionalLog(opts.logToConsole, {
//         prefix: () => `PIPELINE: `
//     });

//     const cancelCh = chan();
//     const cancelMult = mult(cancelCh);
//     const statusCh = chan(1);
//     const inputChByName = {};
//     const inputChByIndex = [];
//     const cancellingCh = chan();
//     const isCancelling = [false];
//     mult.tap(cancelMult, cancellingCh);

//     go(function* () {
//         yield take(cancellingCh);
//         isCancelling[0] = true;
//     });

//     function* runPipeline$$() {
//         const nodesByNameAndIndex = new Map<string | number, PipelineNode>();
//         const startChannels = [];
//         const finishChannels = [];

//         for (let i = 0; i < nodes.length; i++) {
//             const index = i; /// Avoid closure problems!!!
//             const node = nodes[index];
//             const nodeLog = conditionalLog(opts.logToConsole, {
//                 prefix: () => `PIPELINE [${node.name}]: `
//             });
//             nodeLog('INIT');
//             const outputCh = chan();
//             const nodeCancelCh = chan();
//             const startCh = chan();
//             const finishCh = chan();
//             startChannels.push(startCh);
//             finishChannels.push(finishCh);

//             mult.tap(cancelMult, nodeCancelCh);
//             const nodeController = runPipelineNode({
//                 name: node.name,
//                 process: node.process,
//                 inputCh: node.inputCh,
//                 bufferSize: node.bufferSize,
//                 cancelFast: node.cancelFast,
//                 outputCh,
//                 cancelCh: nodeCancelCh
//             });
//             nodesByNameAndIndex.set(index, nodeController);
//             nodesByNameAndIndex.set(node.name, nodeController);
//             const inputNoCancellingCh = removeInto(_ => isCancelling[0], node.inputCh);
//             inputChByName[node.name] = inputNoCancellingCh;
//             inputChByIndex[index] = inputNoCancellingCh;

//             if (node.initialValues) {
//                 // Insert initial values into input channel
//                 observableToChannel(
//                     getAsObs(node.initialValues),
//                     removeInto(
//                         x => !!x.error,
//                         mapInto(x => x.value, inputNoCancellingCh)
//                     ),
//                     false
//                 );
//             }

//             // Start processing processed outputs
//             go(function*() {
//                 nodeLog('Starting');
//                 yield take(startCh);
//                 let error: any;
//                 try {
//                     while (true) {
//                         const result = alts([outputCh, nodeCancelCh], {
//                             priority: true
//                         });
//                         if (result.channel === nodeCancelCh) {
//                             nodeLog('cancelled');
//                             break;
//                         } else {
//                             const outValue = PipelineTarget.fromValue(
//                                 result.value
//                             );
//                             const targetNode = outValue.select(
//                                 nodesByNameAndIndex,
//                                 index
//                             );
//                             yield put(targetNode.inputCh, outValue.value);
//                         }
//                     }
//                 } catch (e) {
//                     error = e;
//                     nodeLog('ERROR', e);
//                 }
//                 mult.untap(cancelMult, nodeCancelCh);
//                 yield put(finishCh, error || true);
//                 nodeLog('Finished');
//             });
//         }

//         for (let i = 0; i < startChannels.length; i++) {
//             yield put(startChannels[i], true);
//         }

//         for (let i = 0; i < finishChannels.length; i++) {
//             yield take(finishChannels[i]);
//         }
//     }

//     function* main$$() {
//         log('MAIN Start');
//         const leasing = getAsValue(opts.leasing);
//         if (leasing) {
//             log('Using LEASING');

//             const leaseAcquired: boolean = yield take(leasing.leaseCh);

//             if (leaseAcquired) {
//                 log('Lease acquired');
//                 const cancelLeaseCh = chan();
//                 mult.tap(cancelMult, cancelLeaseCh);
//                 go(startPinging, {
//                     pingCh: leasing.pingCh,
//                     pingValue: true,
//                     pingTimeMilliseconds: opts.leasingPingTimeSecs * 1000,
//                     cancelCh: cancelLeaseCh,
//                     pingAsync: false,
//                     onFinish: () => {
//                         mult.untap(cancelMult, cancelLeaseCh);
//                         putAsync(leasing.releaseCh, true);
//                     }
//                 });

//                 putAsync(statusCh, true);

//                 yield take(go(runPipeline$$));

//                 putAsync(statusCh, false);
//             } else {
//                 log('Lease NOT ACQUIRED');
//                 putAsync(statusCh, false);
//             }
//         } else {
//             log('NOT using LEASING');

//             putAsync(statusCh, true);

//             yield take(go(runPipeline$$));

//             putAsync(statusCh, false);
//         }
//         log('MAIN End');
//     }

//     go(main$$);

//     return { statusCh, inputChByName, inputChByIndex };
// };
