"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var common_1 = require("../utils/common");
exports.createBackgroundWorker = function (opts) {
    opts.processor.onFinished$.subscribe({
        complete: function () {
            opts.terminate();
        }
    });
    var subscriptions = new Map();
    var process = function (item) {
        switch (item.kind) {
            case 'process': {
                var subs = opts.processor.process(item.task).subscribe({
                    next: function (v) {
                        return opts.postMessage({
                            kind: 'N',
                            uid: item.uid,
                            valueOrError: v
                        });
                    },
                    error: function (err) {
                        subscriptions.delete(item.uid);
                        opts.postMessage({
                            kind: 'E',
                            uid: item.uid,
                            valueOrError: err
                        });
                    },
                    complete: function () {
                        subscriptions.delete(item.uid);
                        opts.postMessage({
                            kind: 'C',
                            uid: item.uid
                        });
                    }
                });
                subscriptions.set(item.uid, subs);
                break;
            }
            case 'unsubscribe': {
                var subs = subscriptions.get(item.uid);
                if (subs) {
                    subs.unsubscribe();
                    subscriptions.delete(item.uid);
                }
                break;
            }
            case 'terminate': {
                opts.processor.finish().subscribe();
                break;
            }
            default:
                throw new Error('Unknown WorkerItem type: ' + item.kind);
        }
    };
    return { process: process };
};
exports.createForegroundWorker = function (opts) {
    var worker = opts.createWorker();
    var run = opts.run || (function (f) { return f(); });
    var caption = opts.caption || 'worker';
    var status = 'open';
    var terminateUUID = common_1.uuid();
    var terminateSub = new rxjs_1.Subject();
    var terminate$ = terminateSub.asObservable();
    var terminateSubscription = terminateSub.subscribe({
        complete: function () {
            status = 'closed';
            run(function () { return worker.terminate(); });
            terminateSubscription.unsubscribe();
        }
    });
    var observers = new Map();
    var isAlive = function () { return status === 'open'; };
    var finish = function () {
        if (status === 'open') {
            status = 'closing';
            worker.postMessage({
                kind: 'terminate',
                uid: terminateUUID
            });
        }
        return terminate$;
    };
    var process = function (task) {
        var result = rxjs_1.Observable.create(function (o) {
            var id = common_1.uuid();
            var sub = new rxjs_1.Subject();
            var obs$ = sub.asObservable();
            observers.set(id, sub);
            worker.postMessage({ kind: 'process', uid: id, task: task });
            var subs = obs$.subscribe({
                next: function (x) { return o.next(x); },
                error: function (e) { return o.error(e); },
                complete: function () { return o.complete(); }
            });
            return function () {
                subs.unsubscribe();
                worker.postMessage({ kind: 'unsubscribe', uid: id });
            };
        });
        return result;
    };
    worker.onmessage = function (resp) {
        if (resp.uid === terminateUUID) {
            if (resp.kind === 'C') {
                run(function () { return terminateSub.complete(); });
            }
        }
        else {
            var obs_1 = observers.get(resp.uid);
            if (!!obs_1) {
                switch (resp.kind) {
                    case 'N':
                        run(function () { return obs_1.next(resp.valueOrError); });
                        break;
                    case 'E':
                        run(function () { return obs_1.error(resp.valueOrError); });
                        observers.delete(resp.uid);
                        break;
                    case 'C':
                        run(function () { return obs_1.complete(); });
                        observers.delete(resp.uid);
                        break;
                }
            }
        }
    };
    return {
        process: process,
        isAlive: isAlive,
        finish: finish
    };
};
//# sourceMappingURL=worker-processor.js.map