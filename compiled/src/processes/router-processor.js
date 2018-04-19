"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("rxjs/Observable");
var common_1 = require("../utils/common");
function startRouterProcessor(routes, opts) {
    var routeKeys = Object.keys(routes);
    var defaultOptions = {
        caption: 'RtrProc',
        routeSeparator: '/'
    };
    var options = common_1.assign(defaultOptions, opts || {});
    var isAlive = function () { return routeKeys.some(function (key) { return routes[key].isAlive(); }); };
    var finish = function () {
        return Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) { return routes[key].finish(); })).last();
    };
    var process = function (task) {
        var pos = task.kind.indexOf(options.routeSeparator);
        if (pos < 0) {
            return Observable_1.Observable.throw(new Error('argument.invalid.task.kind'));
        }
        var prefix = task.kind.substr(0, pos);
        var route = routes[prefix];
        if (!route) {
            return Observable_1.Observable.throw(new Error('argument.invalid.task.prefix'));
        }
        var newKind = task.kind.substr(pos + options.routeSeparator.length);
        var newTask = common_1.assign(task, { kind: newKind });
        return route.process(newTask);
    };
    var recoverPrefix = function (prefix) { return function (item) {
        return common_1.assign(item, {
            kind: "" + prefix + options.routeSeparator + item.kind
        });
    }; };
    var onFinished$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) { return routes[key].onFinished$; })).last();
    var onTaskStarted$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) {
        return routes[key].onTaskStarted$.map(recoverPrefix(key));
    }));
    var onTaskReStarted$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) {
        return routes[key].onTaskReStarted$.map(recoverPrefix(key));
    }));
    var onTaskResult$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) {
        return routes[key].onTaskResult$.map(function (_a) {
            var item = _a[0], value = _a[1];
            return [recoverPrefix(key)(item), value];
        });
    }));
    var onTaskError$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) {
        return routes[key].onTaskError$.map(function (_a) {
            var item = _a[0], value = _a[1];
            return [recoverPrefix(key)(item), value];
        });
    }));
    var onTaskCompleted$ = Observable_1.Observable.merge.apply(Observable_1.Observable, routeKeys.map(function (key) {
        return routes[key].onTaskCompleted$.map(recoverPrefix(key));
    }));
    return {
        caption: options.caption,
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
exports.startRouterProcessor = startRouterProcessor;
function startRouterProxy(processor, prefix, opts) {
    var defaultOptions = {
        routeSeparator: '/'
    };
    var options = common_1.assign(defaultOptions, opts || {});
    var isAlive = function () { return processor.isAlive(); };
    var finish = function () { return Observable_1.Observable.throw(new Error('invalidop.proxy.finish')); };
    var process = function (task) {
        var newTask = common_1.assign(task, {
            kind: "" + prefix + options.routeSeparator + task.kind
        });
        return processor.process(newTask);
    };
    return {
        process: process,
        isAlive: isAlive,
        finish: finish
    };
}
exports.startRouterProxy = startRouterProxy;
//# sourceMappingURL=router-processor.js.map