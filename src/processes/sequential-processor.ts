/* eslint-disable @typescript-eslint/naming-convention */
import type { Observable } from 'rxjs';
import { ReplaySubject, Subject, throwError } from 'rxjs';
import { tryTo } from '../utils';
import type { ValueOrFunc } from '../utils/common';
import { assign, between, errorToString, getAsValue } from '../utils/common';
import { TransientError } from './errors';
import type { IProcessor, TaskItem } from './processor.interfaces';

interface WorkState {
    item: TaskItem;
    sub: Subject<any>;
    delay: number;
    retries: number;
}

/**
 * Options for starting a new sequential processor
 */
export interface SequentialProcessorOptions {
    /**
     * `bufferSize` represents the size of the input channel. After that limit
     * the sequentiality of tasks is undefined.
     */
    bufferSize: number;
    /**
     * `interTaskDelay` is the time between task executions to wait before
     * continuing the task execution loop.
     * Use 0 to prevent the artificial delay between tasks.
     * Use 1 to use the minimum artificial delay between tasks.
     */
    interTaskDelay: number;
    /**
     * `maxRetries` is the max number of retries of a failing task when it
     * fails with transient errors.
     */
    maxRetries: number;
    /**
     * `minDelay` is the minimum delay used between task retries
     */
    minDelay: number;
    /**
     * `maxDelay` is the maximum delay used between task retries
     */
    maxDelay: number;
    /**
     * `nextDelay` is a function to compute the next delay given the
     * previous one and the retry number.
     */
    nextDelay: (delay: number, retry: number) => number;
    /**
     * `isTransientError` is a function to find out whether an error is
     * considered transient or not.
     */
    isTransientError: (error: any, retry: number) => boolean;
    caption: string;
    taskTimeout: number;
    logToConsole: boolean;
}

/**
 * Creates a Processor that executes sequentially the given tasks
 * @param runTask
 * @param opts
 */
export function startSequentialProcessor<T>(
    runTask: (task: TaskItem) => T,
    options?: Partial<SequentialProcessorOptions>
): IProcessor {
    const opts = assign(
        <SequentialProcessorOptions>{
            caption: 'SeqProc',
            bufferSize: 1000,
            interTaskDelay: 1,
            maxRetries: 5,
            minDelay: 10,
            maxDelay: 5000,
            taskTimeout: 5000,
            nextDelay: (d: number) => d * 5,
            isTransientError: (error: any) => error instanceof TransientError,
            logToConsole: false
        },
        options
    );

    const inputCh: WorkState[] = [];
    const retriesCh: WorkState[] = [];
    const finishSub = new Subject<void>();
    const finishObs = finishSub.asObservable();
    let _isAlive = true;
    let _isActive = false;
    let _retryPendingCount = 0;
    let _pickedRetry = false;

    const currentState = () =>
        `[ ${_isAlive ? 'ALIVE' : 'DEAD'} ${
            _isActive ? 'ACTIVE' : 'WAITING'
        } PEND:${_retryPendingCount} INP:${inputCh.length} RET:${
            retriesCh.length
        } ]`;

    const log = (msg: ValueOrFunc<string>, state: boolean = true) => {
        if (opts.logToConsole) {
            const extra = state ? `\n     - ${currentState()}` : '';
            console.log(`${getAsValue(msg)}.${extra}`);
        }
    };

    const logWork = (work: WorkState) => {
        const kind = work.item.kind;
        const retries = work.retries;
        const delay = work.delay;
        const uid = work.item.uid;
        return `(${kind} R:${retries} D:${delay}ms ID:${uid})`;
    };

    const onFinishedSub = new ReplaySubject<void>(1);
    const onFinished$ = onFinishedSub.asObservable();
    const onTaskStartedSub = new Subject<TaskItem>();
    const onTaskStarted$ = onTaskStartedSub.asObservable();
    const onTaskReStartedSub = new Subject<TaskItem>();
    const onTaskReStarted$ = onTaskReStartedSub.asObservable();
    const onTaskResultSub = new Subject<[TaskItem, any]>();
    const onTaskResult$ = onTaskResultSub.asObservable();
    const onTaskErrorSub = new Subject<[TaskItem, any]>();
    const onTaskError$ = onTaskErrorSub.asObservable();
    const onTaskCompletedSub = new Subject<TaskItem>();
    const onTaskCompleted$ = onTaskCompletedSub.asObservable();

    const isAlive = () => _isAlive;

    const finish = () => {
        _isAlive = false;
        log('FINISH');
        return finishObs;
    };

    const pickWork = () => {
        const pickRetry = () => {
            if (retriesCh.length) {
                _pickedRetry = true;
                return retriesCh.shift();
            }
            return undefined;
        };

        const pickInput = () => {
            if (inputCh.length) {
                _pickedRetry = false;
                return inputCh.shift();
            }
            return undefined;
        };
        const result = _pickedRetry
            ? pickInput() || pickRetry()
            : pickRetry() || pickInput();

        return result;
    };

    const loop = () => {
        const work = pickWork();
        log(() => `LOOP - PICK ${!work ? 'nothing' : logWork(work)}`);
        if (work) {
            runTaskOnce(work);
        } else if (!_isAlive && _retryPendingCount === 0) {
            // Only once all input and retries has been processed
            _isActive = false;
            finishSub.next();
            finishSub.complete();
            onFinishedSub.next(null);
            onFinishedSub.complete();
            onTaskStartedSub.complete();
            onTaskReStartedSub.complete();
            onTaskResultSub.complete();
            onTaskErrorSub.complete();
            onTaskCompletedSub.complete();
            log('LOOP - CLOSED');
        } else {
            _isActive = false;
            log('LOOP - DEACTIVATED');
        }
    };

    const pushWorkItem = (work: WorkState) => {
        if (work.retries === 0) {
            inputCh.push(work);
            log(() => 'PUSH - INPUT ' + logWork(work));
        } else {
            _retryPendingCount--;
            retriesCh.push(work);
            log(() => 'PUSH - RETRY ' + logWork(work));
        }

        if (!_isActive) {
            _isActive = true;
            setTimeout(loop, 1);
            log('PUSH - REACTIVATE');
        }
    };

    const runTaskOnce = (work: WorkState) => {
        if (work.retries === 0) {
            onTaskStartedSub.next(work.item);
            log(() => 'RUN  - FIRST ' + logWork(work));
        } else {
            onTaskReStartedSub.next(work.item);
            log(() => 'RUN  - RETRY');
        }
        work.retries++;

        (tryTo(() => runTask(work.item)) as Observable<T>)
            // .timeout(opts.taskTimeout)
            .subscribe({
                next: value => {
                    log(
                        () =>
                            `RUN  - NEXT ${JSON.stringify(value)} ` +
                            logWork(work)
                    );
                    work.sub.next(value);
                    onTaskResultSub.next([work.item, value]);
                },
                error: error => {
                    if (
                        opts.isTransientError(error, work.retries) &&
                        work.retries < opts.maxRetries
                    ) {
                        const newDelay = between(
                            opts.nextDelay(work.delay, work.retries),
                            opts.minDelay,
                            opts.maxDelay
                        );
                        work.delay = newDelay;
                        _retryPendingCount++;
                        log(
                            () =>
                                `RUN  - ERROR ${JSON.stringify(
                                    errorToString(error)
                                )} ${logWork(work)}`
                        );
                        setTimeout(() => loop(), 1);
                        setTimeout(() => pushWorkItem(work), newDelay);
                    } else {
                        work.sub.error(error);
                        onTaskErrorSub.next([work.item, error]);
                        log(() => `RUN  - COMPLETE ${logWork(work)}`);
                        setTimeout(() => loop(), 1);
                    }
                },
                complete: () => {
                    setTimeout(() => loop(), 1);
                    work.sub.complete();
                    onTaskCompletedSub.next(work.item);
                }
            });
    };

    const process = (item: TaskItem) => {
        if (!_isAlive) {
            log('PROCESS - NOT ALIVE');
            return throwError(() => new Error('worker:finishing'));
        }

        const sub = new Subject<any>();
        const work: WorkState = {
            item,
            sub,
            delay: opts.minDelay,
            retries: 0
        };

        pushWorkItem(work);

        return sub.asObservable();
    };

    log('START');

    return {
        caption: opts.caption,
        process,
        isAlive,
        finish,
        onFinished$,
        onTaskStarted$,
        onTaskReStarted$,
        onTaskResult$,
        onTaskError$,
        onTaskCompleted$
    };
}

// /**
//  * Creates a Processor that executes sequentially the given tasks
//  * @param runTask
//  * @param opts
//  */
// export function startSequentialProcessor(
//     runTask: (task: TaskItem) => ObsLike<any>,
//     opts?: Partial<SequentialProcessorOptions>
// ): IProcessor {
//     const defaultOptions: SequentialProcessorOptions = {
//         caption: 'SeqProc',
//         bufferSize: 1000,
//         interTaskDelay: 1,
//         maxRetries: 5,
//         minDelay: 10,
//         maxDelay: 5000,
//         nextDelay: (d: number) => d * 5,
//         isTransientError: (error: any) => true
//     };

//     const options = assign(defaultOptions, opts || {});

//     const inputCh = chan(options.bufferSize);
//     const retriesCh = chan();
//     const finishCh = chan(1);
//     const finishSub = new Subject<void>();
//     const finishObs = finishSub.asObservable();
//     let _isAlive = true;

//     const onFinishedSub = new ReplaySubject<void>(1);
//     const onFinished$ = onFinishedSub.asObservable();
//     const onTaskStartedSub = new Subject<TaskItem>();
//     const onTaskStarted$ = onTaskStartedSub.asObservable();
//     const onTaskReStartedSub = new Subject<TaskItem>();
//     const onTaskReStarted$ = onTaskReStartedSub.asObservable();
//     const onTaskResultSub = new Subject<[TaskItem, any]>();
//     const onTaskResult$ = onTaskResultSub.asObservable();
//     const onTaskErrorSub = new Subject<[TaskItem, any]>();
//     const onTaskError$ = onTaskErrorSub.asObservable();
//     const onTaskCompletedSub = new Subject<TaskItem>();
//     const onTaskCompleted$ = onTaskCompletedSub.asObservable();

//     const isAlive = () => _isAlive;

//     const finish = () => {
//         if (_isAlive) {
//             _isAlive = false;
//             putAsync(finishCh, 'FINISHED');
//         }
//         return finishObs;
//     };

//     const process = (item: TaskItem) => {
//         if (!isAlive()) {
//             return Observable.throw(new Error('worker:finishing'));
//         }
//         const sub = new Subject<any>();
//         const state: WorkState = {
//             item,
//             sub,
//             nextDelay: options.minDelay,
//             retries: 0
//         };
//         putAsync(inputCh, state);
//         return sub.asObservable();
//     };

//     function* runOneTask(state: WorkState, waitCh: any) {
//         let obs: Observable<any> = null;
//         if (state.retries === 0) {
//             onTaskStartedSub.next(state.item);
//         } else {
//             onTaskReStartedSub.next(state.item);
//         }
//         state.retries++;

//         try {
//             obs = runTask(state.item);
//         } catch (error) {
//             obs = Observable.throw(error);
//         }

//         if (obs instanceof Observable) {
//             // It is already an observable, let it be!
//         } else if (Promise.resolve(obs) === obs) {
//             obs = Observable.fromPromise(obs);
//         } else {
//             obs = Observable.of(obs);
//         }

//         obs.subscribe({
//             next: v => {
//                 state.sub.next(v);
//                 onTaskResultSub.next([state.item, v]);
//             },
//             error: error => {
//                 if (
//                     options.isTransientError(error, state.retries) &&
//                     state.retries < options.maxRetries
//                 ) {
//                     putAsync(waitCh, 'RETRY');
//                     const delay = state.nextDelay;
//                     state.nextDelay = Math.min(
//                         Math.max(
//                             options.nextDelay(delay, state.retries),
//                             options.minDelay
//                         ),
//                         options.maxDelay
//                     );
//                     go(function*() {
//                         yield timeout(delay);
//                         yield put(retriesCh, state);
//                     });
//                 } else {
//                     putAsync(waitCh, 'ERROR');
//                     state.sub.error(error);
//                     onTaskErrorSub.next([state.item, error]);
//                 }
//             },
//             complete: () => {
//                 putAsync(waitCh, 'COMPLETE');
//                 state.sub.complete();
//                 onTaskCompletedSub.next(state.item);
//             }
//         });
//     }

//     function* loop() {
//         while (true) {
//             const result = yield alts([retriesCh, inputCh, finishCh], {
//                 priority: true
//             });

//             if (result.channel === finishCh) {
//                 finishSub.next();
//                 finishSub.complete();
//                 break;
//             } else {
//                 const state = <WorkState>result.value;
//                 const waitCh = chan();
//                 spawn(runOneTask(state, waitCh));
//                 yield take(waitCh);

//                 if (options.interTaskDelay) {
//                     yield timeout(options.interTaskDelay);
//                 }
//             }
//         }

//         onFinishedSub.next(null);
//         onFinishedSub.complete();
//         onTaskStartedSub.complete();
//         onTaskReStartedSub.complete();
//         onTaskResultSub.complete();
//         onTaskErrorSub.complete();
//         onTaskCompletedSub.complete();
//     }

//     go(loop);

//     return {
//         caption: options.caption,
//         process,
//         isAlive,
//         finish,
//         onFinished$,
//         onTaskStarted$,
//         onTaskReStarted$,
//         onTaskResult$,
//         onTaskError$,
//         onTaskCompleted$
//     };
// }
