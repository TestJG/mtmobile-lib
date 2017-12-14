import { Observable, Subject, ReplaySubject } from 'rxjs';
import { IProcessor, TaskItem, ObsLike } from './processor.interfaces';
import { alts, chan, go, put, putAsync, spawn, take, timeout } from 'js-csp';
import { assign } from '../utils/common';

interface WorkState {
    item: TaskItem;
    sub: Subject<any>;
    nextDelay: number;
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
}

/**
 * Creates a Processor that executes sequentially the given tasks
 * @param runTask
 * @param opts
 */
export function startSequentialProcessor(
    runTask: (task: TaskItem) => ObsLike<any>,
    opts?: Partial<SequentialProcessorOptions>
): IProcessor {
    const defaultOptions: SequentialProcessorOptions = {
        caption: 'SeqProc',
        bufferSize: 1000,
        interTaskDelay: 1,
        maxRetries: 5,
        minDelay: 10,
        maxDelay: 5000,
        nextDelay: (d: number) => d * 5,
        isTransientError: (error: any) => true
    };

    const options = assign(defaultOptions, opts || {});

    const inputCh = chan(options.bufferSize);
    const retriesCh = chan();
    const finishCh = chan(1);
    const finishSub = new Subject<void>();
    const finishObs = finishSub.asObservable();
    let _isAlive = true;

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
        if (_isAlive) {
            _isAlive = false;
            putAsync(finishCh, 'FINISHED');
        }
        return finishObs;
    };

    const process = (item: TaskItem) => {
        if (!isAlive()) {
            return Observable.throw(new Error('worker:finishing'));
        }
        const sub = new Subject<any>();
        const state: WorkState = {
            item,
            sub,
            nextDelay: options.minDelay,
            retries: 0
        };
        putAsync(inputCh, state);
        return sub.asObservable();
    };

    function* runOneTask(state: WorkState, waitCh: any) {
        let obs: Observable<any> = null;
        if (state.retries === 0) {
            onTaskStartedSub.next(state.item);
        } else {
            onTaskReStartedSub.next(state.item);
        }
        state.retries++;

        try {
            obs = runTask(state.item);
        } catch (error) {
            obs = Observable.throw(error);
        }

        if (obs instanceof Observable) {
            // It is already an observable, let it be!
        } else if (Promise.resolve(obs) === obs) {
            obs = Observable.fromPromise(obs);
        } else {
            obs = Observable.of(obs);
        }

        obs.subscribe({
            next: v => {
                state.sub.next(v);
                onTaskResultSub.next([state.item, v]);
            },
            error: error => {
                if (
                    options.isTransientError(error, state.retries) &&
                    state.retries < options.maxRetries
                ) {
                    putAsync(waitCh, 'RETRY');
                    const delay = state.nextDelay;
                    state.nextDelay = Math.min(
                        Math.max(
                            options.nextDelay(delay, state.retries),
                            options.minDelay
                        ),
                        options.maxDelay
                    );
                    go(function*() {
                        yield timeout(delay);
                        yield put(retriesCh, state);
                    });
                } else {
                    putAsync(waitCh, 'ERROR');
                    state.sub.error(error);
                    onTaskErrorSub.next([state.item, error]);
                }
            },
            complete: () => {
                putAsync(waitCh, 'COMPLETE');
                state.sub.complete();
                onTaskCompletedSub.next(state.item);
            }
        });
    }

    function* loop() {
        while (true) {
            const result = yield alts([retriesCh, inputCh, finishCh], {
                priority: true
            });

            if (result.channel === finishCh) {
                finishSub.next();
                finishSub.complete();
                break;
            } else {
                const state = <WorkState>result.value;
                const waitCh = chan();
                spawn(runOneTask(state, waitCh));
                yield take(waitCh);

                if (options.interTaskDelay) {
                    yield timeout(options.interTaskDelay);
                }
            }
        }

        onFinishedSub.next(null);
        onFinishedSub.complete();
        onTaskStartedSub.complete();
        onTaskReStartedSub.complete();
        onTaskResultSub.complete();
        onTaskErrorSub.complete();
        onTaskCompletedSub.complete();
    }

    go(loop);

    return {
        caption: options.caption,
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
