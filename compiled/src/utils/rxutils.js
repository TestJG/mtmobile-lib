"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var common_1 = require("./common");
exports.normalizeErrorOnCatch = function (err) {
    return rxjs_1.throwError(common_1.normalizeError(err));
};
exports.fromObsLike = function (source, treatArraysAsValues) {
    if (treatArraysAsValues === void 0) { treatArraysAsValues = true; }
    if (common_1.isSomething(source) &&
        (Promise.resolve(source) === source ||
            typeof source['subscribe'] === 'function' ||
            (!treatArraysAsValues && source instanceof Array))) {
        return rxjs_1.from(source);
    }
    else {
        return rxjs_1.of(source);
    }
};
exports.tryTo = function (thunk, treatArraysAsValues) {
    if (treatArraysAsValues === void 0) { treatArraysAsValues = true; }
    var defers = [];
    var finishing = false;
    var defer = function (action) {
        if (finishing) {
            throw new Error('Already finishing, this is not the time to defer.');
        }
        defers.push(action);
    };
    var runDefers = function () {
        finishing = true;
        for (var _i = 0, _a = defers.reverse(); _i < _a.length; _i++) {
            var action = _a[_i];
            try {
                action();
            }
            catch (error) {
                console.log("Error in deferred action: " + error);
            }
        }
    };
    var obs;
    try {
        obs = exports.fromObsLike(thunk(defer), treatArraysAsValues);
    }
    catch (error) {
        obs = exports.normalizeErrorOnCatch(error);
    }
    return obs.pipe(operators_1.tap({ complete: runDefers, error: runDefers }));
};
exports.wrapFunctionStream = function (stream) {
    var conn = stream.pipe(operators_1.publishReplay(1));
    var subs = conn.connect();
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return conn.pipe(operators_1.first(), operators_1.switchMap(function (f) { return f.apply(void 0, args); }));
    });
};
exports.wrapServiceStreamFromNames = function (source, names) {
    var conn = source.pipe(operators_1.publishReplay(1));
    var subs = conn.connect();
    return names.reduce(function (prev, name) {
        return Object.assign(prev, (_a = {},
            _a[name] = exports.wrapFunctionStream(conn.pipe(operators_1.map(function (s) { return s[name]; }))),
            _a));
        var _a;
    }, {});
};
exports.firstMap = function (source) { return function (mapper) { return source.pipe(operators_1.first(), operators_1.map(mapper), operators_1.catchError(exports.normalizeErrorOnCatch)); }; };
exports.firstSwitchMap = function (source) { return function (mapper) {
    return source.pipe(operators_1.first(), operators_1.switchMap(mapper), operators_1.catchError(exports.normalizeErrorOnCatch));
}; };
exports.getAsObs = function (source) {
    return exports.tryTo(function () { return common_1.getAsValue(source); });
};
function makeState(init, updates$) {
    var state$ = updates$.pipe(operators_1.scan(function (prev, up) { return up(prev); }, init), operators_1.publishBehavior(init));
    var connection = state$.connect();
    return [state$, connection];
}
exports.makeState = makeState;
function mapUntilCancelled(observable, cancel) {
    return rxjs_1.merge(observable.pipe(operators_1.takeUntil(cancel)), cancel.pipe(operators_1.first(), operators_1.takeUntil(observable.pipe(operators_1.ignoreElements(), operators_1.materialize()))));
}
exports.mapUntilCancelled = mapUntilCancelled;
function logObserver(logger, maxLength, logNext, logErrors, logComplete) {
    if (logger === void 0) { logger = console.log; }
    if (maxLength === void 0) { maxLength = 80; }
    if (logNext === void 0) { logNext = true; }
    if (logErrors === void 0) { logErrors = true; }
    if (logComplete === void 0) { logComplete = true; }
    var next = logNext
        ? function (v) { return logger('NEXT : ', common_1.capString(JSON.stringify(v), maxLength)); }
        : common_1.noop;
    var error = logErrors ? function (v) { return logger('ERROR: ', v); } : common_1.noop;
    var complete = logComplete ? function () { return logger('COMPLETE'); } : common_1.noop;
    return { next: next, error: error, complete: complete };
}
exports.logObserver = logObserver;
//# sourceMappingURL=rxutils.js.map