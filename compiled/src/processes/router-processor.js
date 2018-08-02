"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
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
        return rxjs_1.merge.apply(void 0, routeKeys.map(function (key) { return routes[key].finish(); })).pipe(operators_1.last());
    };
    var process = function (task) {
        var pos = task.kind.indexOf(options.routeSeparator);
        if (pos < 0) {
            return rxjs_1.throwError(new Error('argument.invalid.task.kind'));
        }
        var prefix = task.kind.substr(0, pos);
        var route = routes[prefix];
        if (!route) {
            return rxjs_1.throwError(new Error('argument.invalid.task.prefix'));
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
    var onFinished$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) { return routes[key].onFinished$; })).pipe(operators_1.last());
    var onTaskStarted$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) {
        return routes[key].onTaskStarted$.pipe(operators_1.map(recoverPrefix(key)));
    }));
    var onTaskReStarted$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) {
        return routes[key].onTaskReStarted$.pipe(operators_1.map(recoverPrefix(key)));
    }));
    var onTaskResult$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) {
        return routes[key].onTaskResult$.pipe(operators_1.map(function (_a) {
            var item = _a[0], value = _a[1];
            return [recoverPrefix(key)(item), value];
        }));
    }));
    var onTaskError$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) {
        return routes[key].onTaskError$.pipe(operators_1.map(function (_a) {
            var item = _a[0], value = _a[1];
            return [recoverPrefix(key)(item), value];
        }));
    }));
    var onTaskCompleted$ = rxjs_1.merge.apply(void 0, routeKeys.map(function (key) {
        return routes[key].onTaskCompleted$.pipe(operators_1.map(recoverPrefix(key)));
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
    var finish = function () { return rxjs_1.throwError(new Error('invalidop.proxy.finish')); };
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