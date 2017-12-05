"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
exports.assign = function (s) {
    var u = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        u[_i - 1] = arguments[_i];
    }
    return Object.assign.apply(Object, [{}, s].concat(u));
};
exports.id = function (a) { return a; };
exports.joinStr = function (sep, strs) {
    return strs.reduce(function (prev, str) { return (!!prev && !!str ? prev + sep + str : prev || str); }, '');
};
function uuid(separator) {
    if (separator === void 0) { separator = '-'; }
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };
    if (!separator) {
        separator = '';
    }
    return (s4() +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        s4() +
        s4());
}
exports.uuid = uuid;
exports.toKVArray = function (kvs) {
    if (kvs instanceof Array) {
        return kvs;
    }
    return Object.keys(kvs).map(function (k) { return [k, kvs[k]]; });
};
exports.toKVMap = function (kvs) {
    if (kvs instanceof Array) {
        return kvs.reduce(function (prev, _a) {
            var key = _a[0], value = _a[1];
            return Object.assign(prev, (_b = {}, _b[key] = value, _b));
            var _b;
        }, {});
    }
    return kvs;
};
exports.objFlatMap = function (mapper) { return function (source) {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    return exports.toKVMap(_.flatMap(Object.keys(exports.toKVMap(source)), function (key) {
        return exports.toKVArray(mapper([key, source[key]]));
    }));
}; };
exports.objMap = function (mapper) { return exports.objFlatMap(function (kv) { return [mapper(kv)]; }); };
exports.objMapValues = function (mapper) {
    return exports.objMap(function (_a) {
        var k = _a[0], v = _a[1];
        return [k, mapper(v, k)];
    });
};
exports.normalizeError = function (err) {
    if (!err) {
        return new Error('error.unknown');
    }
    if (typeof err === 'string') {
        return new Error(err);
    }
    if (err instanceof Error) {
        if (!err.message) {
            return new Error('error.unknown');
        }
        return err;
    }
    if (typeof err.message === 'string' && !!err.message) {
        return new Error(err.message);
    }
    return new Error('error.unknown');
};
function errorToString(err) {
    return exports.normalizeError(err).message;
}
exports.errorToString = errorToString;
