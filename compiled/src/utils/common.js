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
        ellipsis: '...'
    }; }
    var maxLength = opts.maxLength >= opts.ellipsis.length
        ? opts.maxLength
        : opts.ellipsis.length;
    if (str.length > maxLength) {
        if (opts.ellipsis.length + opts.backChars >= str.length) {
            return (opts.ellipsis + str.substr(0, str.length - opts.ellipsis.length));
        }
        else {
            return (str.substr(0, maxLength - opts.ellipsis.length - opts.backChars) +
                opts.ellipsis +
                str.substr(str.length - opts.backChars));
        }
    }
    else {
        return str;
    }
}
exports.printStr = printStr;
var orderedTypes = [
    'string',
    'boolean',
    'number',
    'symbol',
    'undefined',
    'function',
    'object'
];
exports.compareTypes = function (x, y) {
    if (x === y) {
        return 0;
    }
    var a = orderedTypes.indexOf(x);
    var b = orderedTypes.indexOf(y);
    if (a < 0 || a > b) {
        return 1;
    }
    if (b < 0 || b > a) {
        return -1;
    }
    return 0;
};
exports.compareSameType = function (x, y) {
    return typeof x === typeof y ? (x === y ? 0 : x < y ? -1 : 1) : 0;
};
exports.compareNumber = function (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        return 0;
    }
    if (isNaN(x)) {
        if (isNaN(y)) {
            return 0;
        }
        else {
            return 1;
        }
    }
    else if (isNaN(y)) {
        return -1;
    }
    else {
        return x === y ? 0 : x < y ? -1 : 1;
    }
};
exports.compareFunction = function (x, y) {
    if (typeof x !== 'function' || typeof y !== 'function') {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    return exports.compareBy(function (a, b) { return exports.compareSameType(a.name, b.name); }, function (a, b) { return exports.compareNumber(a.length, b.length); })(x, y);
};
exports.compareArray = function (x, y) {
    if (!(x instanceof Array) || !(y instanceof Array)) {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    var minLen = Math.min(x.length, y.length);
    for (var i = 0; i < minLen; i++) {
        var a = x[i];
        var b = y[i];
        var comp = exports.compareDataByType(a, b);
        if (comp !== 0) {
            return comp;
        }
    }
    return exports.compareNumber(x.length, y.length);
};
exports.compareObject = function (x, y) {
    if (typeof x !== 'object' || typeof y !== 'object') {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    if (!x) {
        return -1;
    }
    if (!y) {
        return 1;
    }
    // array < object
    if (x instanceof Array) {
        if (y instanceof Array) {
            return exports.compareArray(x, y);
        }
        return -1;
    }
    else if (y instanceof Array) {
        return 1;
    }
    var compFunc = exports.compareFunction(x.constructor, y.constructor);
    if (compFunc !== 0) {
        return compFunc;
    }
    var xProps = Object.getOwnPropertyNames(x).sort();
    var yProps = Object.getOwnPropertyNames(y).sort();
    return exports.compareArray(xProps, yProps);
};
exports.compareBy = function () {
    var comparers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        comparers[_i] = arguments[_i];
    }
    return function (x, y) {
        for (var i = 0; i < comparers.length; i++) {
            var comp = comparers[i](x, y);
            if (comp !== 0) {
                return comp;
            }
        }
        return 0;
    };
};
exports.compareDataByType = function (x, y) {
    var comp = exports.compareTypes(typeof x, typeof y);
    if (comp !== 0) {
        return comp;
    }
    switch (typeof x) {
        case 'boolean':
        case 'string':
            return exports.compareSameType(x, y);
        case 'symbol':
            return exports.compareSameType(x.toString(), y.toString());
        case 'number':
            return exports.compareNumber(x, y);
        case 'function':
            return exports.compareFunction(x, y);
        case 'object':
            return exports.compareObject(x, y);
        case 'undefined':
            return 0;
        default:
            return 0;
    }
};
function printData(value, opts) {
    if (opts === void 0) { opts = {
        maxLength: 1000,
        backChars: 0,
        ellipsis: '...',
        showStacktrace: true
    }; }
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'undefined':
            return String(value);
        case 'string':
            return "'" + printStr(value, opts) + "'";
        case 'symbol':
            return value.toString();
        case 'function':
            return value.name + "(... " + value.length + " args) => { ... }";
        default:
            if (!value) {
                return 'null';
            }
            else if (value instanceof Date) {
                return value.toISOString();
            }
            else if (value instanceof Array) {
                if (value.length === 0) {
                    return '[]';
                }
                else if (value.length === 1) {
                    return "[ 1 item ]";
                }
                return "[ ... " + value.length + " items ]";
            }
            else if (value instanceof Error) {
                return (value.name + ": " + value.message +
                    (value.stack ? "\n" + value.stack : ''));
            }
            else {
                var name_1 = !value.constructor || value.constructor === Object ? '' : value.constructor.name + ' ';
                var keys = Object.keys(value);
                if (keys.length === 0) {
                    return name_1 + "{}";
                }
                else if (keys.length === 1) {
                    return name_1 + "{ 1 property }";
                }
                return name_1 + "{ ... " + Object.keys(value).length + " properties }";
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
    excludeTypes: ['function'],
    excludeConstructors: [],
    propertyOrder: 'byTypeAndName',
    onlyEnumerableProperties: true
};
exports.oldPrintObj = function (obj, options) {
    if (options === void 0) { options = defaultPrintObjOptions; }
    var opts = Object.assign({}, defaultPrintObjOptions, options);
    var result = '';
    var depth = 0;
    // let lines = 0;
    var past = new Set();
    var skipIndent = false;
    var indentation = '';
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
        if (depth < opts.maxDepth && value instanceof Array) {
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
        else if (depth < opts.maxDepth &&
            value &&
            value.constructor === Object) {
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
exports.hasNewLine = function (s) { return !!s.match(/\n/); };
exports.printObj = function (obj, options) {
    if (options === void 0) { options = defaultPrintObjOptions; }
    var opts = Object.assign({}, defaultPrintObjOptions, options);
    var excludeTypes = typeof opts.excludeTypes === 'function'
        ? opts.excludeTypes
        : (function (x) { return opts.excludeTypes.indexOf(x) >= 0; });
    var excludeConstructors = typeof opts.excludeConstructors === 'function'
        ? opts.excludeConstructors
        : (function (x) { return opts.excludeConstructors.indexOf(x) >= 0; });
    var past = new Set();
    var indentations = ['', opts.indentChars];
    var ind = function (depth) {
        while (depth >= indentations.length) {
            indentations.push(indentations[indentations.length - 1] + opts.indentChars);
        }
        return indentations[depth];
    };
    var isExcluded = function (v) { return excludeTypes(typeof v) || (!!v && excludeConstructors(v.constructor)); };
    var propertyComparer = opts.propertyOrder === 'byTypeAndName'
        ? exports.compareBy(function (a, b) { return exports.compareTypes(typeof a[2], typeof b[2]); }, function (a, b) { return exports.compareSameType(a[0], b[0]); })
        : function (a, b) { return exports.compareSameType(a[0], b[0]); };
    var loop = function (value, depth) {
        if (depth < opts.maxDepth && value instanceof Array) {
            if (past.has(value)) {
                return "[ cyclic reference ... ]";
            }
            else if (value.length === 0) {
                return '[]';
            }
            else {
                past.add(value);
                var values = value
                    .filter(function (v) { return !isExcluded(v); })
                    .map(function (v) { return loop(v, depth + 1); });
                var totalLength = values.reduce(function (x, s) { return x + s.length + 2; }, 0);
                if (totalLength > opts.maxValueLength || values.some(function (s) { return exports.hasNewLine(s); })) {
                    var valuesShort = values.length <= opts.maxValuesPerArray
                        ? values : values.slice(0, opts.maxValuesPerArray);
                    var str = valuesShort
                        .map(function (v) { return v.replace(/^|(\r?\n)/g, "$&" + ind(1)); })
                        .join(',\n');
                    if (value.length > opts.maxValuesPerArray) {
                        return "[\n" + str + "\n" + ind(1) + "// ... " + (value.length -
                            opts.maxValuesPerArray) + " more elements\n]";
                    }
                    return "[\n" + str + "\n]";
                }
                else {
                    var str = exports.joinStr(', ', values);
                    return "[ " + str + " ]";
                }
            }
        }
        else if (depth < opts.maxDepth &&
            value &&
            value.constructor === Object) {
            if (past.has(value)) {
                return "{ cyclic reference ... }";
            }
            else {
                past.add(value);
                var propNames = opts.onlyEnumerableProperties
                    ? Object.keys(value)
                    : Object.getOwnPropertyNames(value);
                if (propNames.length === 0) {
                    return '{}';
                }
                var props = propNames
                    .map(function (n) { return [n, loop(value[n], depth + 1), value[n]]; })
                    .filter(function (p) { return !isExcluded(p[2]); });
                props.sort(propertyComparer);
                var totalLength = props.reduce(function (x, p) { return x + p[0].length + p[1].length + 4; }, 0);
                if (totalLength > opts.maxValueLength || props.some(function (p) { return exports.hasNewLine(p[1]); })) {
                    var propsShort = props.length <= opts.maxPropertiesPerObject
                        ? props
                        : props.slice(0, opts.maxPropertiesPerObject);
                    var str = propsShort
                        .map(function (p) { return "" + ind(1) + p[0] + ": " + p[1].replace(/(\r?\n)/g, "$&" + ind(1)); })
                        .join(',\n');
                    if (propNames.length > opts.maxPropertiesPerObject) {
                        return "{\n" + str + "\n" + ind(1) + "// ... " + (propNames.length -
                            opts.maxPropertiesPerObject) + " more properties\n]";
                    }
                    return "{\n" + str + "\n}";
                }
                else {
                    var str = props.map(function (p) { return p[0] + ": " + p[1]; }).join(', ');
                    return "{ " + str + " }";
                }
            }
        }
        else {
            var str = printData(value, {
                maxLength: opts.maxValueLength,
                ellipsis: opts.ellipsis,
                backChars: opts.backChars,
                showStacktrace: opts.showStacktrace
            });
            return str;
        }
    };
    return loop(obj, 0);
};
//# sourceMappingURL=common.js.map