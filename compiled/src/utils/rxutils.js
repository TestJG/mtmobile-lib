"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var common_1 = require("./common");
exports.normalizeErrorOnCatch = function (err) {
    return rxjs_1.Observable.throw(common_1.normalizeError(err));
};
exports.fromObsLike = function (source, treatArraysAsValues) {
    if (treatArraysAsValues === void 0) { treatArraysAsValues = true; }
    if (common_1.isSomething(source) &&
        (Promise.resolve(source) === source ||
            typeof source['subscribe'] === 'function' ||
            (!treatArraysAsValues && source instanceof Array))) {
        return rxjs_1.Observable.from(source);
    }
    else {
        return rxjs_1.Observable.of(source);
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
    return obs.do({ complete: runDefers, error: runDefers });
};
exports.wrapFunctionStream = function (stream) {
    var conn = stream.publishReplay(1);
    var subs = conn.connect();
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return conn.first().switchMap(function (f) { return f.apply(void 0, args); });
    });
};
exports.wrapServiceStreamFromNames = function (source, names) {
    var conn = source.publishReplay(1);
    var subs = conn.connect();
    return names.reduce(function (prev, name) {
        return Object.assign(prev, (_a = {},
            _a[name] = exports.wrapFunctionStream(conn.map(function (s) { return s[name]; })),
            _a));
        var _a;
    }, {});
};
exports.firstMap = function (source) { return function (mapper) { return source.first().map(mapper).catch(exports.normalizeErrorOnCatch); }; };
exports.firstSwitchMap = function (source) { return function (mapper) {
    return source
        .first()
        .switchMap(mapper)
        .catch(exports.normalizeErrorOnCatch);
}; };
exports.getAsObs = function (source) {
    return exports.tryTo(function () { return common_1.getAsValue(source); });
};
function makeState(init, updates$) {
    var state$ = updates$
        .scan(function (prev, up) { return up(prev); }, init)
        .publishBehavior(init);
    var connection = state$.connect();
    return [state$, connection];
}
exports.makeState = makeState;
function mapUntilCancelled(observable, cancel) {
    return rxjs_1.Observable.merge(observable.takeUntil(cancel), cancel.first().takeUntil(observable.ignoreElements().materialize()));
}
exports.mapUntilCancelled = mapUntilCancelled;
//# sourceMappingURL=rxutils.js.map