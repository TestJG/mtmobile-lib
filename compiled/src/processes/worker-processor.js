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
    var process = function (item) {
        switch (item.kind) {
            case 'process': {
                opts.processor.process(item.task).subscribe({
                    next: function (v) {
                        return opts.postMessage({
                            kind: 'N',
                            uid: item.uid,
                            valueOrError: v
                        });
                    },
                    error: function (err) {
                        return opts.postMessage({
                            kind: 'E',
                            uid: item.uid,
                            valueOrError: err
                        });
                    },
                    complete: function () {
                        return opts.postMessage({
                            kind: 'C',
                            uid: item.uid
                        });
                    }
                });
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
    var status = 'open';
    var terminateUUID = common_1.uuid();
    var terminateSub = new rxjs_1.Subject();
    var terminate$ = terminateSub.asObservable();
    terminateSub.subscribe({
        complete: function () {
            status = 'closed';
            run(function () { return worker.terminate(); });
            // worker.terminate();
        }
    });
    var observers = new Map();
    observers.set(terminateUUID, terminateSub);
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
        var id = common_1.uuid();
        var sub = new rxjs_1.Subject();
        var obs$ = sub.asObservable();
        observers.set(id, sub);
        worker.postMessage({
            kind: 'process',
            uid: id,
            task: task
        });
        return obs$;
    };
    worker.onmessage = function (msg) {
        var resp = msg.data;
        var obs = observers.get(resp.uid);
        if (!!obs) {
            switch (resp.kind) {
                case 'N':
                    run(function () { return obs.next(resp.valueOrError); });
                    break;
                case 'E':
                    run(function () { return obs.error(resp.valueOrError); });
                    observers.delete(resp.uid);
                    break;
                case 'C':
                    run(function () { return obs.complete(); });
                    observers.delete(resp.uid);
                    break;
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