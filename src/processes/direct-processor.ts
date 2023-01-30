import { of, from, throwError, Observable, Subject, ReplaySubject } from 'rxjs';
import { assign, objMapValues } from '../utils/common';
import { ObsLike } from '../utils/rxutils';
import { TransientError } from './errors';
import { IProcessor, TaskItem } from './processor.interfaces';
import { makeRunTask } from './makeRunTask';

export interface DirectProcessorOptions {
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

export function startDirectProcessor(
    runTask: (task: TaskItem) => ObsLike<any>,
    options?: Partial<DirectProcessorOptions>
): IProcessor {
    const opts = assign(
        <DirectProcessorOptions>{
            caption: 'DirProc',
            maxRetries: 5,
            minDelay: 10,
            maxDelay: 5000,
            nextDelay: (d: number) => d * 5,
            isTransientError: (error: any) => error instanceof TransientError
        },
        options || {}
    );

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

    let _isAlive = true;
    let runningCount = 0;
    const isAlive = () => _isAlive;

    const closeSubjects = () => {
        onFinishedSub.next(null);
        onFinishedSub.complete();
        onTaskStartedSub.complete();
        onTaskReStartedSub.complete();
        onTaskResultSub.complete();
        onTaskErrorSub.complete();
        onTaskCompletedSub.complete();
    };

    const finish = () => {
        if (_isAlive) {
            _isAlive = false;
            if (runningCount === 0) {
                closeSubjects();
            }
        }
        return onFinished$;
    };

    const runOneTask = function (item: TaskItem, sub: Subject<any>) {
        const runOnce = (retries: number) => {
            let obs: Observable<any> = null;
            if (retries === 1) {
                onTaskStartedSub.next(item);
            } else {
                onTaskReStartedSub.next(item);
            }

            try {
                obs = runTask(item);
            } catch (error) {
                obs = throwError(error);
            }

            if (obs instanceof Observable) {
                // It is already an observable, let it be!
            } else if (Promise.resolve(obs) === obs) {
                obs = from(obs);
            } else {
                obs = of(obs);
            }

            return obs;
        };

        const between = (value: number, min: number, max: number) =>
            Math.min(Math.max(value, min), max);

        const looper = (retries: number, delay: number) => {
            const task = runOnce(retries);
            task.subscribe({
                next: v => {
                    sub.next(v);
                    onTaskResultSub.next([item, v]);
                },
                error: error => {
                    if (
                        opts.isTransientError(error, retries) &&
                        retries < opts.maxRetries
                    ) {
                        const newDelay = between(
                            opts.nextDelay(delay, retries),
                            opts.minDelay,
                            opts.maxDelay
                        );
                        setTimeout(() => looper(retries + 1, newDelay), delay);
                    } else {
                        sub.error(error);
                        onTaskErrorSub.next([item, error]);
                    }
                },
                complete: () => {
                    sub.complete();
                    onTaskCompletedSub.next(item);
                }
            });
        };

        looper(1, opts.minDelay);
    };

    const process = (item: TaskItem) => {
        if (!isAlive()) {
            return throwError(new Error('worker:finishing'));
        }
        runningCount++;
        const sub = new Subject<any>();
        runOneTask(item, sub);
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

/**
 * Creates an instance of IProcessor (Direct), from a given service, where each
 * TaskItem of the form `{ kind: 'method', payload: T }` is implemented as
 * `service.method(payload)`.
 */
export const fromServiceToDirectProcessor = (
    service: any,
    caption: string = 'ServProc',
    options?: Partial<DirectProcessorOptions>
): IProcessor =>
    startDirectProcessor(
        makeRunTask(
            objMapValues(f => payload => !!payload ? f(payload) : f())(service)
        ),
        Object.assign({ caption }, options)
    );
