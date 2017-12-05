"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var common_1 = require("./common");
exports.normalizeErrorOnCatch = function (err) {
    return rxjs_1.Observable.throw(common_1.normalizeError(err));
};
exports.tryTo = function (thunk) {
    try {
        var result = thunk();
        if (Promise.resolve(result) === result ||
            typeof result['subscribe'] === 'function') {
            return rxjs_1.Observable.from(result);
        }
        return rxjs_1.Observable.of(result);
    }
    catch (error) {
        return exports.normalizeErrorOnCatch(error);
    }
};
exports.rxid = function (x) { return rxjs_1.Observable.of(x); };
exports.rxdelay = function (ms, scheduler) {
    return rxjs_1.Observable.of(1)
        .delay(ms, scheduler)
        .switchMap(function () { return rxjs_1.Observable.empty(); });
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
exports.firstMap = function (source) { return function (mapper) {
    return source
        .first()
        .map(mapper)
        .catch(exports.normalizeErrorOnCatch);
}; };
exports.firstSwitchMap = function (source) { return function (mapper) {
    return source
        .first()
        .switchMap(mapper)
        .catch(exports.normalizeErrorOnCatch);
}; };
function makeState(init, updates$) {
    var state$ = updates$
        .scan(function (prev, up) { return up(prev); }, init)
        .publishBehavior(init);
    var connection = state$.connect();
    return [state$, connection];
}
exports.makeState = makeState;
