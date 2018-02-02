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
    LogOpts,
    logTee,
    ValueOrFunc,
    getAsValue,
    capString,
    id,
    noop
} from './common';
import { ObsOrFunc, getAsObs, fromObsLike } from './rxutils';
import { isNothing } from '../../index';

export const isChan = (value: any) =>
    value instanceof Object && value.constructor.name === 'Channel';

export const isInstruction = (value: any) =>
    value instanceof Object && value.constructor.name.endsWith('Instruction');

export type ToChanOptions = {
    bufferOrN;
    transducer;
    exHandler;
    keepOpen: boolean;
    includeErrors: boolean;
} & LogOpts;

export const bufferedObserver = (
    options?: Partial<ToChanOptions>
): Observer<any> & { channel: any } => {
    const opts = Object.assign(
        {
            keepOpen: false,
            includeErrors: true
        },
        options
    );
    const log = conditionalLog(opts, { prefix: 'BUFFER: ' });
    const channel = chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    const data = {
        buffer: [],
        isClosed: false,
        waiter: null
    };
    const finish = () => {
        data.isClosed = true;
        if (data.buffer.length === 0 && data.waiter) {
            putAsync(data.waiter, false);
        }
    };
    const checkClosed = () => {
        if (data.isClosed) {
            throw new Error('Observer is closed');
        }
    };
    const push = (value: any) => {
        data.buffer.push(value);
        log('PUSH', value, data.buffer);
        if (data.buffer.length === 1 && data.waiter) {
            putAsync(data.waiter, true);
        }
    };
    const next = (value: any) => {
        checkClosed();
        push(value);
    };
    const error = (e: any) => {
        checkClosed();
        if (opts.includeErrors) {
            push(e);
        }
        finish();
    };
    const complete = () => {
        log('OBS: COMPLETE');
        checkClosed();
        finish();
    };

    go(function*() {
        while (true) {
            if (data.buffer.length === 0) {
                if (data.isClosed) {
                    log('GO: BREAK');
                    break;
                }
                if (data.waiter) {
                    throw new Error('I should not be already waiting!!!');
                }
                data.waiter = chan();
                log('GO: WAIT', new Date().toISOString(), data.buffer);
                const wait = yield data.waiter;
                data.waiter = null;
                if (wait === false) {
                    log('GO: BREAK');
                    break;
                }
            }
            const value = data.buffer.shift();
            log('GO: PUT', value, data.buffer);
            yield put(channel, value);
        }
        log('GO: CLOSING', opts.keepOpen, data.buffer);
        if (!opts.keepOpen) {
            channel.close();
        }
    });

    const result = { next, error, complete, channel };
    Object.defineProperty(result, 'closed', {
        enumerable: true,
        configurable: false,
        get: () => data.isClosed
    });
    return result;
};

export const generatorToChan = (gen, options?: Partial<ToChanOptions>) => {
    const opts = Object.assign(
        {
            keepOpen: false,
            includeErrors: true
        },
        options
    );
    const ch = chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    go(function*() {
        while (true) {
            try {
                const { done, value } = gen.next();
                if (done) {
                    break;
                }
                yield put(ch, value);
            } catch (e) {
                if (opts.includeErrors) {
                    yield put(ch, e);
                }
                break;
            }
        }
        if (!opts.keepOpen) {
            ch.close();
        }
    });
    return ch;
};

export const iterableToChan = (iterable, options?: Partial<ToChanOptions>) => {
    const opts = Object.assign(
        {
            keepOpen: false,
            includeErrors: true
        },
        options
    );
    try {
        const generator = iterable[Symbol.iterator]();
        return generatorToChan(generator, options);
    } catch (error) {
        if (opts.includeErrors) {
            return iterableToChan([error], options);
        } else {
            return iterableToChan([], options);
        }
    }
};

export const promiseToChan = (
    promise: Promise<any>,
    options?: Partial<ToChanOptions>
) => {
    const opts = Object.assign(
        {
            keepOpen: false,
            includeErrors: true
        },
        options
    );
    const ch = chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    const finish = () => {
        if (!opts.keepOpen) {
            ch.close();
        }
    };
    try {
        promise
            .then(value => {
                go(function*() {
                    yield put(ch, value);
                    finish();
                });
            })
            .catch(error => {
                go(function*() {
                    if (opts.includeErrors) {
                        yield put(ch, error);
                    }
                    finish();
                });
            });
    } catch (error) {
        go(function*() {
            if (opts.includeErrors) {
                yield put(ch, error);
            }
            finish();
        });
    }
    return ch;
};

export const firstToChan = (
    obs: Observable<any>,
    options?: Partial<ToChanOptions>
): any => observableToChan(obs.take(1), options);

export const observableToChan = (
    obs: Observable<any>,
    options?: Partial<ToChanOptions>
): any => {
    const observer = bufferedObserver(options);
    obs.subscribe(observer);
    return observer.channel;
};

export const toChan = (source: any, options?: Partial<ToChanOptions>) => {
    const opts = Object.assign(
        {
            keepOpen: false,
            includeErrors: true
        },
        options
    );

    if (isChan(source)) {
        return source;
    } else if (typeof source === 'function') {
        try {
            const newSource = source();
            return toChan(newSource, options);
        } catch (error) {
            if (opts.includeErrors) {
                return iterableToChan([error], options);
            } else {
                return iterableToChan([], options);
            }
        }
    } else if (
        isNothing(source) ||
        typeof source === 'boolean' ||
        typeof source === 'string' ||
        typeof source === 'number'
    ) {
        return iterableToChan([source], options);
    } else if (Symbol.iterator in source) {
        return iterableToChan(source, options);
    } else if (Symbol.observable in source) {
        return observableToChan(source, options);
    } else if (source && typeof source.next === 'function') {
        return generatorToChan(source, options);
    } else if (Promise.resolve(source) === source) {
        return promiseToChan(source, options);
    } else {
        return iterableToChan([source], options);
    }
};

export const toYielder = (source: any) => {
    if (isInstruction(source)) {
        return source;
    } else {
        return toChan(source);
    }
};

export const chanToObservable = <T>(
    ch: any,
    options?: {
        logs?: boolean | ValueOrFunc<string>;
    }
) => {
    const opts = Object.assign({}, options);
    const log = conditionalLog(opts, { prefix: 'CHAN_OBS: ' });
    return <Observable<T>>Observable.create((o: Observer<T>) => {
        log('Start');
        const cancelCh = promiseChan();
        go(function*() {
            while (true) {
                const result = yield alts([ch, cancelCh], { priority: true });
                if (result.channel === cancelCh || result.value === CLOSED) {
                    log('Completing', result.value);
                    o.complete();
                    break;
                } else {
                    log('Value', result.value);
                    o.next(<T>result.value);
                }
            }
        });
        return () => {
            log('Unsubscribe');
            putAsync(cancelCh, true);
        };
    });
};

export interface PingHandler {
    release: () => any;
    finishedProm: any;
}

export const startPinging = (
    pingCh: any,
    pingTimeMilliseconds: number,
    options?: Partial<
        {
            pingAsync: boolean;
            autoClose: boolean;
        } & LogOpts
    >
): PingHandler => {
    const opts = Object.assign(
        {
            pingAsync: false,
            autoClose: false
        },
        options
    );
    const { pingAsync } = opts;
    const releaseCh = promiseChan();

    const finishedProm = go(function*() {
        const log = conditionalLog(opts);
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
    options?: Partial<
        {
            leaseTimeoutSecs: number;
            leaseMarginSecs: number;
        } & LogOpts
    >
): LeaseHandler => {
    const opts = Object.assign(
        {
            leaseTimeoutSecs: 60
        },
        options
    );
    const { leaseTimeoutSecs } = opts;
    const leaseMarginSecs =
        typeof opts.leaseMarginSecs === 'number'
            ? opts.leaseMarginSecs
            : leaseTimeoutSecs * 0.1;

    const log = conditionalLog(opts);
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
                    yield put(startedProm, false);
                }
                break;
            } else {
                if (firstTime) {
                    log('lease was granted');
                    yield put(startedProm, true);
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
    } & Partial<
        {
            inputCh?: number | any;
            initialValues?: any;
        } & LogOpts
    >
): PipelineNodeHandler => {
    const log = conditionalLog(opts);
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
                    log('Processing input #' + ++index, result.value);
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
                log('Insert init #' + ++index, value);
                yield put(inputCh, value);
            }
            log('Insert init done');
        });
    }

    const input = (value: any) => {
        log('INPUT ', value);
        return put(inputCh, value);
    };
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

    static fromValue(
        value: any,
        factory?: (value: any) => PipelineSequenceTarget
    ) {
        if (value instanceof PipelineSequenceTarget) {
            return value;
        } else if (factory) {
            return factory(value);
        } else {
            return new PipelineSequenceTarget(value);
        }
    }

    selectWith<T = any, R = any>(
        dict: Map<string, T>,
        arr: T[],
        currentIndex: number,
        foundFn: (node: T) => R,
        notFoundFn: (lastIndex: boolean) => R
    ) {
        if (this.name) {
            if (!dict.has(this.name)) {
                return notFoundFn(false);
            }
            return foundFn(dict.get(this.name));
        } else {
            const index =
                typeof this.index === 'number'
                    ? this.index
                    : typeof this.offset === 'number'
                      ? currentIndex + this.offset
                      : currentIndex;
            if (index < 0 || index >= arr.length) {
                return notFoundFn(index === arr.length);
            }
            return foundFn(arr[index]);
        }
    }

    select<T = any>(dict: Map<string, T>, arr: T[], currentIndex: number) {
        const notFoundFn = (lastIndex: boolean) => {
            if (this.name) {
                throw new Error(
                    `Expected to find element with name ${this.name}`
                );
            } else if (typeof this.index === 'number') {
                throw new Error(
                    `Expected to find element at index ${this.index}`
                );
            } else if (typeof this.offset === 'number') {
                throw new Error(
                    `Expected to find element with offset ${this
                        .offset} from index ${currentIndex}`
                );
            } else {
                throw new Error(
                    `Expected to find element but no index was supplied`
                );
            }
        };
        return this.selectWith(dict, arr, currentIndex, id, notFoundFn);
    }

    toString() {
        const valStr = capString(JSON.stringify(this.value), 40);
        if (this.name) {
            return `name ${this.name}: ${valStr}`;
        } else if (typeof this.index === 'number') {
            return `index ${this.index}: ${valStr}`;
        } else if (typeof this.offset === 'number') {
            return `offset ${this.offset}: ${valStr}`;
        } else {
            return `unknown: ${valStr}`;
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

export type PipelineSequenceNodeInit = {
    process: (value: any) => any;
} & Partial<
    {
        name: string;
        inputCh: number | any;
        initialValues: any;
    } & LogOpts
>;

export interface PipelineSequenceHandler {
    startedProm: any;
    finishedProm: any;
    input: (index: string | number, value: any) => any;
    cancel: () => void;
    release: () => any;
}

export const runPipelineSequence = (
    opts: {
        nodes: PipelineSequenceNodeInit[];
        processLast: (value: any) => any;
    } & Partial<LogOpts>
): PipelineSequenceHandler => {
    if (!opts.nodes || opts.nodes.length === 0) {
        throw new Error('At least one node must be supplied.');
    }

    const log = conditionalLog(opts);
    log('Start');
    const RELEASE = global.Symbol('RELEASE');
    const startedProm = promiseChan();

    const pipeDict = new Map<string, PipelineNodeHandler>();
    const pipeArr = new Array<PipelineNodeHandler>();

    const startPipeline = () => {
        for (let i = 0; i < opts.nodes.length; i++) {
            const nodeInit = opts.nodes[i];
            const index = i;
            const process = (value: any) =>
                go(function*() {
                    const proc = nodeInit.process(value);
                    if (isInstruction(proc)) {
                        yield proc;
                        return;
                    }
                    const procCh = toChan(proc);
                    while (true) {
                        const result = yield procCh;
                        if (result === CLOSED) {
                            break;
                        }
                        const target = PipelineSequenceTarget.fromValue(
                            result,
                            toNextTarget
                        );
                        yield target.selectWith(
                            pipeDict,
                            pipeArr,
                            index,
                            n => n.input(target.value),
                            last => {
                                if (last) {
                                    return opts.processLast(target.value);
                                } else {
                                    throw new Error(
                                        'Invalid index: ' + target.toString()
                                    );
                                }
                            }
                        );
                    }
                });
            const node = runPipelineNode({
                process,
                inputCh: nodeInit.inputCh,
                initialValues: nodeInit.initialValues,
                logs: log.enabled && nodeInit.logs
            });
            pipeArr.push(node);
            if (nodeInit.name) {
                pipeDict.set(nodeInit.name, node);
            }
            log('Node initialized', index, nodeInit.name);
        }

        // Return a process that finishes when all nodes finish
        return go(function*() {
            for (let i = 0; i < pipeArr.length; i++) {
                yield pipeArr[i].finishedProm;
                log('Finished node #' + i);
                if (i + 1 < opts.nodes.length) {
                    yield pipeArr[i + 1].release();
                }
            }
        });
    };

    const finishedProm = go(function*() {
        yield put(startedProm, true);
        yield startPipeline();
    });

    const input = (index: string | number, value: any) =>
        (typeof index === 'number'
            ? toIndexedTarget(value, index)
            : toNamedTarget(value, index))
            .select(pipeDict, pipeArr, 0)
            .input(value);
    const release = () => pipeArr[0].release();
    const cancel = () => {
        for (let i = 0; i < pipeArr.length; i++) {
            pipeArr[i].cancel();
        }
    };

    return { startedProm, finishedProm, input, release, cancel };
};
