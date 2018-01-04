"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var rxutils_1 = require("../utils/rxutils");
function makeRunTask(runners) {
    return function (task) {
        if (!task) {
            return rxjs_1.Observable.throw(new Error('argument.null.task'));
        }
        if (!task.kind) {
            return rxjs_1.Observable.throw(new Error('argument.null.task.kind'));
        }
        var runner = runners[task.kind];
        if (!runner) {
            return rxjs_1.Observable.throw(new Error("unknown.task:" + task.kind));
        }
        return rxutils_1.tryTo(function () { return runner(task.payload); });
    };
}
exports.makeRunTask = makeRunTask;
//# sourceMappingURL=makeRunTask.js.map