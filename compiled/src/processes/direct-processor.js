import { Observable, Subject, ReplaySubject } from 'rxjs';
import { assign, objMapValues } from '../utils/common';
import { makeRunTask } from './makeRunTask';
export function startDirectProcessor(runTask, options) {
    const opts = assign({
        caption: 'DirProc',
        maxRetries: 5,
        minDelay: 10,
        maxDelay: 5000,
        nextDelay: (d) => d * 5,
        isTransientError: (error) => true
    }, options || {});
    const onFinishedSub = new ReplaySubject(1);
    const onFinished$ = onFinishedSub.asObservable();
    const onTaskStartedSub = new Subject();
    const onTaskStarted$ = onTaskStartedSub.asObservable();
    const onTaskReStartedSub = new Subject();
    const onTaskReStarted$ = onTaskReStartedSub.asObservable();
    const onTaskResultSub = new Subject();
    const onTaskResult$ = onTaskResultSub.asObservable();
    const onTaskErrorSub = new Subject();
    const onTaskError$ = onTaskErrorSub.asObservable();
    const onTaskCompletedSub = new Subject();
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
    const runOneTask = function (item, sub) {
        const runOnce = (retries) => {
            let obs = null;
            if (retries === 1) {
                onTaskStartedSub.next(item);
            }
            else {
                onTaskReStartedSub.next(item);
            }
            try {
                obs = runTask(item);
            }
            catch (error) {
                obs = Observable.throw(error);
            }
            if (obs instanceof Observable) {
                // It is already an observable, let it be!
            }
            else if (Promise.resolve(obs) === obs) {
                obs = Observable.fromPromise(obs);
            }
            else {
                obs = Observable.of(obs);
            }
            return obs;
        };
        const between = (value, min, max) => Math.min(Math.max(value, min), max);
        const looper = (retries, delay) => {
            const task = runOnce(retries);
            task.subscribe({
                next: v => {
                    sub.next(v);
                    onTaskResultSub.next([item, v]);
                },
                error: error => {
                    if (opts.isTransientError(error, retries) &&
                        retries < opts.maxRetries) {
                        const newDelay = between(opts.nextDelay(delay, retries), opts.minDelay, opts.maxDelay);
                        setTimeout(() => looper(retries + 1, newDelay), delay);
                    }
                    else {
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
    const process = (item) => {
        if (!isAlive()) {
            return Observable.throw(new Error('worker:finishing'));
        }
        runningCount++;
        const sub = new Subject();
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
 * TaskItem of the form { kind: 'method', payload: T } is implemented as
 * service.method(payload).
 */
export const fromServiceToDirectProcessor = (service, caption = 'ServProc', options) => startDirectProcessor(makeRunTask(objMapValues(f => payload => (!!payload ? f(payload) : f()))(service)), Object.assign({ caption }, options));
//# sourceMappingURL=direct-processor.js.map