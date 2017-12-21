import { Observable, Subject, ReplaySubject } from 'rxjs';
import { assign } from '../utils/common';
import { ObsLike } from '../utils/rxutils';
import { IProcessor, TaskItem } from './processor.interfaces';
import { setTimeout } from 'timers';
import { tryTo } from '../utils';
import * as _ from 'lodash';
// import { alts, chan, go, put, putAsync, spawn, take, timeout } from 'js-csp';

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
}

/**
 * Creates a Processor that executes sequentially the given tasks
 * @param runTask
 * @param opts
 */
export function startSequentialProcessor(
    runTask: (task: TaskItem) => ObsLike<any>,
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
            isTransientError: (error: any) => true
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
        return _pickedRetry
            ? pickInput() || pickRetry()
            : pickRetry() || pickInput();
    };

    const runTaskOnce = (work: WorkState) => {
        if (work.retries === 0) {
            onTaskStartedSub.next(work.item);
        } else {
            onTaskReStartedSub.next(work.item);
        }
        work.retries++;

        tryTo(() => runTask(work.item))
            .timeout(opts.taskTimeout)
            .subscribe({
                next: value => {
                    work.sub.next(value),
                    onTaskResultSub.next([work.item, value]);
                },
                error: error => {
                    if (
                        opts.isTransientError(error, work.retries) &&
                        work.retries < opts.maxRetries
                    ) {
                        const newDelay = _.clamp(
                            opts.nextDelay(work.delay, work.retries),
                            opts.minDelay,
                            opts.maxDelay
                        );
                        work.delay = newDelay;
                        _retryPendingCount++;
                        setTimeout(() => pushWorkItem(work), newDelay);
                    } else {
                        work.sub.error(error);
                        onTaskErrorSub.next([work.item, error]);
                    }
                },
                complete: () => {
                    work.sub.complete();
                    onTaskCompletedSub.next(work.item);
                }
            });
    };

    const loop = () => {
        const work = pickWork();
        if (work) {
            runTaskOnce(work);

            // setTimeout(loop, 1);
        } else if (!_isAlive) {
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
        } else {
            _isActive = false;
        }
    };

    const pushWorkItem = (work: WorkState) => {
        if (work.retries === 0) {
            inputCh.push(work);
        } else {
            retriesCh.push(work);
        }

        if (!_isActive) {
            _isActive = true;
            setTimeout(loop, opts.interTaskDelay);
        }
    };

    const process = (item: TaskItem) => {
        if (!_isAlive) {
            return Observable.throw(new Error('worker:finishing'));
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
