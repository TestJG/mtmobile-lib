"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("rxjs/Observable");
var Subject_1 = require("rxjs/Subject");
var ReplaySubject_1 = require("rxjs/ReplaySubject");
var common_1 = require("../utils/common");
var errors_1 = require("./errors");
var makeRunTask_1 = require("./makeRunTask");
function startDirectProcessor(runTask, options) {
    var opts = common_1.assign({
        caption: 'DirProc',
        maxRetries: 5,
        minDelay: 10,
        maxDelay: 5000,
        nextDelay: function (d) { return d * 5; },
        isTransientError: function (error) { return error instanceof errors_1.TransientError; }
    }, options || {});
    var onFinishedSub = new ReplaySubject_1.ReplaySubject(1);
    var onFinished$ = onFinishedSub.asObservable();
    var onTaskStartedSub = new Subject_1.Subject();
    var onTaskStarted$ = onTaskStartedSub.asObservable();
    var onTaskReStartedSub = new Subject_1.Subject();
    var onTaskReStarted$ = onTaskReStartedSub.asObservable();
    var onTaskResultSub = new Subject_1.Subject();
    var onTaskResult$ = onTaskResultSub.asObservable();
    var onTaskErrorSub = new Subject_1.Subject();
    var onTaskError$ = onTaskErrorSub.asObservable();
    var onTaskCompletedSub = new Subject_1.Subject();
    var onTaskCompleted$ = onTaskCompletedSub.asObservable();
    var _isAlive = true;
    var runningCount = 0;
    var isAlive = function () { return _isAlive; };
    var closeSubjects = function () {
        onFinishedSub.next(null);
        onFinishedSub.complete();
        onTaskStartedSub.complete();
        onTaskReStartedSub.complete();
        onTaskResultSub.complete();
        onTaskErrorSub.complete();
        onTaskCompletedSub.complete();
    };
    var finish = function () {
        if (_isAlive) {
            _isAlive = false;
            if (runningCount === 0) {
                closeSubjects();
            }
        }
        return onFinished$;
    };
    var runOneTask = function (item, sub) {
        var runOnce = function (retries) {
            var obs = null;
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
                obs = Observable_1.Observable.throw(error);
            }
            if (obs instanceof Observable_1.Observable) {
                // It is already an observable, let it be!
            }
            else if (Promise.resolve(obs) === obs) {
                obs = Observable_1.Observable.fromPromise(obs);
            }
            else {
                obs = Observable_1.Observable.of(obs);
            }
            return obs;
        };
        var between = function (value, min, max) {
            return Math.min(Math.max(value, min), max);
        };
        var looper = function (retries, delay) {
            var task = runOnce(retries);
            task.subscribe({
                next: function (v) {
                    sub.next(v);
                    onTaskResultSub.next([item, v]);
                },
                error: function (error) {
                    if (opts.isTransientError(error, retries) &&
                        retries < opts.maxRetries) {
                        var newDelay_1 = between(opts.nextDelay(delay, retries), opts.minDelay, opts.maxDelay);
                        setTimeout(function () { return looper(retries + 1, newDelay_1); }, delay);
                    }
                    else {
                        sub.error(error);
                        onTaskErrorSub.next([item, error]);
                    }
                },
                complete: function () {
                    sub.complete();
                    onTaskCompletedSub.next(item);
                }
            });
        };
        looper(1, opts.minDelay);
    };
    var process = function (item) {
        if (!isAlive()) {
            return Observable_1.Observable.throw(new Error('worker:finishing'));
        }
        runningCount++;
        var sub = new Subject_1.Subject();
        runOneTask(item, sub);
        return sub.asObservable();
    };
    return {
        caption: opts.caption,
        process: process,
        isAlive: isAlive,
        finish: finish,
        onFinished$: onFinished$,
        onTaskStarted$: onTaskStarted$,
        onTaskReStarted$: onTaskReStarted$,
        onTaskResult$: onTaskResult$,
        onTaskError$: onTaskError$,
        onTaskCompleted$: onTaskCompleted$
    };
}
exports.startDirectProcessor = startDirectProcessor;
/**
 * Creates an instance of IProcessor (Direct), from a given service, where each
 * TaskItem of the form { kind: 'method', payload: T } is implemented as
 * service.method(payload).
 */
exports.fromServiceToDirectProcessor = function (service, caption, options) {
    if (caption === void 0) { caption = 'ServProc'; }
    return startDirectProcessor(makeRunTask_1.makeRunTask(common_1.objMapValues(function (f) { return function (payload) { return (!!payload ? f(payload) : f()); }; })(service)), Object.assign({ caption: caption }, options));
};
//# sourceMappingURL=direct-processor.js.map