"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("rxjs/Observable");
var Subject_1 = require("rxjs/Subject");
var ReplaySubject_1 = require("rxjs/ReplaySubject");
var common_1 = require("../utils/common");
var errors_1 = require("./errors");
var utils_1 = require("../utils");
var lodash_1 = require("lodash");
var index_1 = require("../../index");
/**
 * Creates a Processor that executes sequentially the given tasks
 * @param runTask
 * @param opts
 */
function startSequentialProcessor(runTask, options) {
    var opts = common_1.assign({
        caption: 'SeqProc',
        bufferSize: 1000,
        interTaskDelay: 1,
        maxRetries: 5,
        minDelay: 10,
        maxDelay: 5000,
        taskTimeout: 5000,
        nextDelay: function (d) { return d * 5; },
        isTransientError: function (error) { return error instanceof errors_1.TransientError; },
        logToConsole: false
    }, options);
    var inputCh = [];
    var retriesCh = [];
    var finishSub = new Subject_1.Subject();
    var finishObs = finishSub.asObservable();
    var _isAlive = true;
    var _isActive = false;
    var _retryPendingCount = 0;
    var _pickedRetry = false;
    var currentState = function () {
        return "[ " + (_isAlive ? 'ALIVE' : 'DEAD') + " " + (_isActive ? 'ACTIVE' : 'WAITING') + " PEND:" + _retryPendingCount + " INP:" + inputCh.length + " RET:" + retriesCh.length + " ]";
    };
    var log = function (msg, state) {
        if (state === void 0) { state = true; }
        if (opts.logToConsole) {
            var extra = state ? "\n     - " + currentState() : '';
            console.log(index_1.getAsValue(msg) + "." + extra);
        }
    };
    var logWork = function (work) {
        return "(" + work.item.kind + " R:" + work.retries + " D:" + work.delay + "ms ID:" + work.item.uid + ")";
    };
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
    var isAlive = function () { return _isAlive; };
    var finish = function () {
        _isAlive = false;
        log('FINISH');
        return finishObs;
    };
    var pickWork = function () {
        var pickRetry = function () {
            if (retriesCh.length) {
                _pickedRetry = true;
                return retriesCh.shift();
            }
            return undefined;
        };
        var pickInput = function () {
            if (inputCh.length) {
                _pickedRetry = false;
                return inputCh.shift();
            }
            return undefined;
        };
        var result = _pickedRetry
            ? pickInput() || pickRetry()
            : pickRetry() || pickInput();
        return result;
    };
    var runTaskOnce = function (work) {
        if (work.retries === 0) {
            onTaskStartedSub.next(work.item);
            log(function () { return 'RUN  - FIRST ' + logWork(work); });
        }
        else {
            onTaskReStartedSub.next(work.item);
            log(function () { return 'RUN  - RETRY'; });
        }
        work.retries++;
        utils_1.tryTo(function () { return runTask(work.item); })
            .subscribe({
            next: function (value) {
                log(function () {
                    return "RUN  - NEXT " + JSON.stringify(value) + " " +
                        logWork(work);
                });
                work.sub.next(value);
                onTaskResultSub.next([work.item, value]);
            },
            error: function (error) {
                if (opts.isTransientError(error, work.retries) &&
                    work.retries < opts.maxRetries) {
                    var newDelay = lodash_1.default.clamp(opts.nextDelay(work.delay, work.retries), opts.minDelay, opts.maxDelay);
                    work.delay = newDelay;
                    _retryPendingCount++;
                    log(function () {
                        return "RUN  - ERROR " + JSON.stringify(index_1.errorToString(error)) + " " + logWork(work);
                    });
                    setTimeout(function () { return loop(); }, 1);
                    setTimeout(function () { return pushWorkItem(work); }, newDelay);
                }
                else {
                    work.sub.error(error);
                    onTaskErrorSub.next([work.item, error]);
                    log(function () { return "RUN  - COMPLETE " + logWork(work); });
                    setTimeout(function () { return loop(); }, 1);
                }
            },
            complete: function () {
                setTimeout(function () { return loop(); }, 1);
                work.sub.complete();
                onTaskCompletedSub.next(work.item);
            }
        });
    };
    var loop = function () {
        var work = pickWork();
        log(function () { return "LOOP - PICK " + (!work ? 'nothing' : logWork(work)); });
        if (work) {
            runTaskOnce(work);
        }
        else if (!_isAlive && _retryPendingCount === 0) {
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
        }
        else {
            _isActive = false;
            log('LOOP - DEACTIVATED');
        }
    };
    var pushWorkItem = function (work) {
        if (work.retries === 0) {
            inputCh.push(work);
            log(function () { return 'PUSH - INPUT ' + logWork(work); });
        }
        else {
            _retryPendingCount--;
            retriesCh.push(work);
            log(function () { return 'PUSH - RETRY ' + logWork(work); });
        }
        if (!_isActive) {
            _isActive = true;
            setTimeout(loop, 1);
            log('PUSH - REACTIVATE');
        }
    };
    var process = function (item) {
        if (!_isAlive) {
            log('PROCESS - NOT ALIVE');
            return Observable_1.Observable.throw(new Error('worker:finishing'));
        }
        var sub = new Subject_1.Subject();
        var work = {
            item: item,
            sub: sub,
            delay: opts.minDelay,
            retries: 0
        };
        pushWorkItem(work);
        return sub.asObservable();
    };
    log('START');
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
exports.startSequentialProcessor = startSequentialProcessor;
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
//# sourceMappingURL=sequential-processor.js.map