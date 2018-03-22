"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var equality_1 = require("./equality");
exports.isNothing = function (x) { return x === undefined || x === null; };
exports.isSomething = function (x) { return x !== undefined && x !== null; };
exports.assign = function (s) {
    var u = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        u[_i - 1] = arguments[_i];
    }
    return Object.assign.apply(Object, [{}, s].concat(u));
};
exports.assignArray = function (s) {
    var u = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        u[_i - 1] = arguments[_i];
    }
    var arr = s.slice();
    for (var index = 0; index < u.length; index++) {
        if (!(u[index] instanceof Array)) {
            continue;
        }
        var _a = u[index], pos = _a[0], other = _a[1];
        if (!(typeof pos === 'number') || !(other instanceof Array)) {
            continue;
        }
        for (var p = 0; p < other.length; p++) {
            if (pos + p < arr.length) {
                arr[pos + p] = other[p];
            }
            else {
                arr.push(other[p]);
            }
        }
    }
    return arr;
};
exports.getAsValue = function (valueOrFunc) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (typeof valueOrFunc === 'function') {
        return valueOrFunc.apply(void 0, args);
    }
    else {
        return valueOrFunc;
    }
};
exports.getAsValueOrError = function (valueOrFunc, onError) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (typeof valueOrFunc === 'function') {
        try {
            return valueOrFunc.apply(void 0, args);
        }
        catch (error) {
            return exports.getAsValue(onError, error);
        }
    }
    else {
        return valueOrFunc;
    }
};
exports.assignOrSameWith = function (equality, s) {
    var u = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        u[_i - 2] = arguments[_i];
    }
    var would = exports.assign.apply(void 0, [s].concat(u));
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};
exports.assignOrSame = function (s) {
    var u = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        u[_i - 1] = arguments[_i];
    }
    return exports.assignOrSameWith.apply(void 0, [equality_1.shallowEqualStrict, s].concat(u));
};
exports.assignIf = function (s, condition, thenAssign) {
    if (exports.getAsValue(condition, s)) {
        return exports.assignOrSame(s, exports.getAsValue(thenAssign, s));
    }
    else {
        return s;
    }
};
exports.assignIfMany = function (s) {
    var stages = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        stages[_i - 1] = arguments[_i];
    }
    return stages.reduce(function (prev, _a) {
        var condition = _a[0], thenAssign = _a[1];
        return exports.assignIf(prev, condition, thenAssign);
    }, s);
};
exports.assignArrayOrSameWith = function (equality, s) {
    var u = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        u[_i - 2] = arguments[_i];
    }
    var would = exports.assignArray.apply(void 0, [s].concat(u));
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};
exports.assignArrayOrSame = function (s) {
    var u = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        u[_i - 1] = arguments[_i];
    }
    return exports.assignArrayOrSameWith.apply(void 0, [equality_1.shallowEqualStrict, s].concat(u));
};
exports.assignArrayIf = function (s, condition, thenAssign) {
    if (exports.getAsValue(condition, s)) {
        return exports.assignArrayOrSame(s, exports.getAsValue(thenAssign, s));
    }
    else {
        return s;
    }
};
exports.assignArrayIfMany = function (s) {
    var stages = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        stages[_i - 1] = arguments[_i];
    }
    return stages.reduce(function (prev, _a) {
        var condition = _a[0], thenAssign = _a[1];
        return exports.assignArrayIf(prev, condition, thenAssign);
    }, s);
};
exports.id = function (a) { return a; };
exports.noop = function () { };
exports.joinStr = function (sep, strs) {
    return strs.reduce(function (prev, str) { return (!!prev && !!str ? prev + sep + str : prev || str); }, '');
};
function uuid(separator) {
    if (separator === void 0) { separator = '-'; }
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return exports.joinStr(separator || '', [
        s4() + s4(),
        s4(),
        s4(),
        s4(),
        s4() + s4() + s4()
    ]);
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
exports.objMap = function (mapper) {
    return exports.objFlatMap(function (kv) { return [mapper(kv)]; });
};
exports.objMapValues = function (mapper) {
    return exports.objMap(function (_a) {
        var k = _a[0], v = _a[1];
        return [k, mapper(v, k)];
    });
};
exports.objFilter = function (filter) { return function (source) {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    var original = exports.toKVMap(source);
    return exports.toKVMap(Object.keys(original).reduce(function (obj, key) {
        if (filter([key, original[key]])) {
            return Object.assign(obj, (_a = {}, _a[key] = original[key], _a));
        }
        else {
            return obj;
        }
        var _a;
    }, {}));
}; };
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
function capString(str, maxLength, ellipsis) {
    if (ellipsis === void 0) { ellipsis = '...'; }
    maxLength = maxLength >= ellipsis.length ? maxLength : ellipsis.length;
    if (str.length > maxLength) {
        return str.substr(0, maxLength - ellipsis.length) + ellipsis;
    }
    else {
        return str;
    }
}
exports.capString = capString;
var getLogToConsole = function (logOpts, defaultPrefix) {
    if (exports.isNothing(logOpts) || logOpts === false) {
        return null;
    }
    else if (logOpts === true) {
        return defaultPrefix || 'LOG: ';
    }
    else if (typeof logOpts === 'object') {
        return getLogToConsole(logOpts.logs, defaultPrefix);
    }
    else {
        return logOpts;
    }
};
exports.conditionalLog = function (logOpts, options) {
    var opts = Object.assign({
        logger: console.log.bind(console)
    }, options);
    var prefix = getLogToConsole(logOpts, opts.prefix);
    if (prefix) {
        var logger_1 = opts.logger;
        return Object.assign(function (msg) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var pref = exports.getAsValue(prefix);
            if (typeof msg === 'function') {
                msg = msg.apply(void 0, args);
                logger_1(pref + msg);
            }
            else {
                logger_1.apply(void 0, [pref + msg].concat(args));
            }
        }, {
            enabled: true,
            options: { prefix: prefix, logger: logger_1 }
        });
    }
    else {
        return Object.assign(function (msg) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
        }, {
            enabled: false,
            options: { prefix: '', logger: exports.noop }
        });
    }
};
exports.subLog = function (parentLog, enabled, options) {
    if (parentLog.enabled) {
        return exports.conditionalLog(enabled, options);
    }
    else {
        return exports.conditionalLog(false);
    }
};
exports.logTee = function (caption, thunk) {
    console.log("START: " + caption);
    var startTime = new Date().getTime();
    try {
        var result = thunk();
        var ms = new Date().getTime() - startTime;
        console.log("END  : " + caption + " [" + ms + "ms]");
        return result;
    }
    catch (error) {
        var ms = new Date().getTime() - startTime;
        console.log("ERROR: " + caption + " (" + error.message + ") [" + ms + "ms]");
        throw error;
    }
};
exports.stopWatch = function () {
    var startTime = new Date().getTime();
    var elapsedMs = function () { return new Date().getTime() - startTime; };
    var elapsedStr = function () {
        var elapsed = elapsedMs();
        if (elapsed <= 1000) {
            return elapsed + " ms";
        }
        else if (elapsed <= 60 * 1000) {
            return elapsed / 1000.0 + " s";
        }
        else {
            var minutes = Math.floor(elapsed / (60 * 1000.0));
            var seconds = (elapsed - minutes * (60 * 1000.0)) / 1000;
            return minutes + " m " + seconds + " s";
        }
    };
    return { elapsedMs: elapsedMs, elapsedStr: elapsedStr };
};
function printStr(str, opts) {
    if (opts === void 0) { opts = {
        maxLength: 1000,
        backChars: 0,
        ellipsis: '...',
    }; }
    var maxLength = opts.maxLength >= opts.ellipsis.length
        ? opts.maxLength
        : opts.ellipsis.length;
    if (str.length > maxLength) {
        if (opts.ellipsis.length + opts.backChars >= str.length) {
            return opts.ellipsis + str.substr(0, str.length - opts.ellipsis.length);
        }
        else {
            return str.substr(0, maxLength - opts.ellipsis.length - opts.backChars) +
                opts.ellipsis +
                str.substr(str.length - opts.backChars);
        }
    }
    else {
        return str;
    }
}
exports.printStr = printStr;
function printData(value, opts) {
    if (opts === void 0) { opts = {
        maxLength: 1000,
        backChars: 0,
        ellipsis: '...',
        showStacktrace: true,
    }; }
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'undefined':
            return String(value);
        case 'string':
            return "'" + printStr(value, opts) + "'";
        case 'symbol':
            return "'" + printStr(value, opts) + "'";
        case 'function':
            return "function " + value.name + " (... " + value.length + " args) { ... }";
        default:
            if (!value) {
                return 'null';
            }
            else if (value instanceof Date) {
                return value.toISOString();
            }
            else if (value instanceof Array) {
                return "[ ... " + value.length + " items ]";
            }
            else if (value instanceof Error) {
                return value.name + ": " + value.message +
                    (value.stack ? "\n" + value.stack : '');
            }
            else if (!value.constructor || value.constructor === Object) {
                return "{ ... }";
            }
            else {
                return value.constructor.name + " { ... }";
            }
    }
}
exports.printData = printData;
var defaultPrintObjOptions = {
    indent: 0,
    indented: true,
    indentChars: '    ',
    maxDepth: 5,
    maxLines: 100,
    maxValueLength: 100,
    backChars: 0,
    ellipsis: '...',
    maxValuesPerArray: 20,
    maxPropertiesPerObject: 40,
    showStacktrace: true,
    onlyEnumerableProperties: true,
};
exports.printObj = function (obj, options) {
    if (options === void 0) { options = defaultPrintObjOptions; }
    var opts = Object.assign({}, defaultPrintObjOptions, options);
    var result = '';
    var depth = 0;
    // let lines = 0;
    var indentation = '';
    var skipIndent = false;
    var past = new Set();
    for (var i = 0; i < opts.indent; i++) {
        indentation += opts.indentChars;
    }
    var append = function (line) {
        if (opts.indented && !skipIndent) {
            if (result.length > 0) {
                result += '\n';
            }
            result += indentation;
            result += line;
        }
        else {
            result += line;
        }
        skipIndent = false;
    };
    var indent = function () {
        depth++;
        indentation += opts.indentChars;
    };
    var unIndent = function () {
        depth--;
        indentation = indentation.substr(0, indentation.length - opts.indentChars.length);
    };
    var loop = function (value, ender) {
        if (depth < opts.maxDepth &&
            (value instanceof Array)) {
            if (past.has(value)) {
                append("[ cyclic reference ... ]" + ender);
            }
            else {
                append('[ ');
                indent();
                for (var index = 0; index < value.length; index++) {
                    if (index >= opts.maxValuesPerArray) {
                        append("... " + (value.length - index) + " more elements");
                        break;
                    }
                    loop(value[index], ', ');
                }
                unIndent();
                append(']');
            }
        }
        else if (depth < opts.maxDepth && value && value.constructor === Object) {
            if (past.has(value)) {
                append("{ cyclic reference ... }");
            }
            else {
                append('{ ');
                indent();
                var props = opts.onlyEnumerableProperties
                    ? Object.keys(value).sort()
                    : Object.getOwnPropertyNames(value).sort();
                for (var index = 0; index < props.length; index++) {
                    if (index >= opts.maxPropertiesPerObject) {
                        append("... " + (props.length - index) + " more properties");
                        break;
                    }
                    append(props[index] + ": ");
                    skipIndent = true;
                    loop(value[props[index]], ', ');
                }
                unIndent();
                append('}');
            }
        }
        else {
            append(printData(value, {
                maxLength: opts.maxValueLength,
                ellipsis: opts.ellipsis,
                backChars: opts.backChars,
                showStacktrace: opts.showStacktrace
            }) + ender);
        }
    };
    loop(obj, '');
    return result;
};
//# sourceMappingURL=common.js.map