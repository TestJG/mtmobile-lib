"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictEqual = function (x, y) {
    return x === y ||
        (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
};
exports.relaxedEqual = function (x, y) {
    // tslint:disable-next-line:triple-equals
    return x == y ||
        (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
};
exports.errorEqualFact = function (childComparer) { return function (x, y) {
    return childComparer(x.name, y.name) && childComparer(x.message, y.message);
}; };
exports.dateEqualFact = function (childComparer) { return function (x, y) { return x.getTime() === y.getTime(); }; };
exports.arrayEqualFact = function (childComparer) { return function (x, y) {
    return x.length === y.length && x.every(function (xv, i) { return childComparer(xv, y[i]); });
}; };
exports.objectEqualFact = function (childComparer) { return function (x, y) {
    var xProps = Object.getOwnPropertyNames(x);
    var yProps = Object.getOwnPropertyNames(y);
    // Not the same number of properties?
    if (xProps.length !== yProps.length) {
        return false;
    }
    xProps = xProps.sort();
    yProps = yProps.sort();
    // Not the same properties?
    for (var index = 0; index < xProps.length; index++) {
        if (xProps[index] !== yProps[index]) {
            return false;
        }
    }
    // Not the same values?
    for (var index = 0; index < xProps.length; index++) {
        var prop = xProps[index];
        if (!childComparer(x[prop], y[prop])) {
            return false;
        }
    }
    return true;
}; };
exports.defaultEqualityFactories = [
    [Date, true, exports.dateEqualFact],
    [Error, false, exports.errorEqualFact],
    [Array, false, exports.arrayEqualFact],
    [Object, true, exports.objectEqualFact]
];
exports.createEqualityComparer = function (childComparer, fallbackComparer, factories) {
    return function (x, y) {
        for (var index = 0; index < factories.length; index++) {
            var _a = factories[index], key = _a[0], strict = _a[1], factory = _a[2];
            var isMatch = key === undefined ||
                (typeof key === 'string' &&
                    typeof x === key &&
                    typeof y === key) ||
                (typeof key === 'function' &&
                    !!x &&
                    !!y &&
                    ((strict &&
                        x.constructor === key &&
                        y.constructor === key) ||
                        (!strict && x instanceof key && y instanceof key)));
            if (isMatch) {
                return factory(childComparer())(x, y);
            }
        }
        return fallbackComparer(x, y);
    };
};
var recursiveEqualImplementation = function (x, y, fallback) {
    if (exports.strictEqual(x, y)) {
        return true;
    }
    if (typeof x === 'object' && typeof y === 'object') {
        if (x === null || y === null) {
            if (x === null && y === null) {
                return fallback(x, y);
            }
            return false;
        }
        if (x.constructor !== y.constructor) {
            return false;
        }
        if (x instanceof Array && y instanceof Array) {
            if (x.length !== y.length) {
                return false;
            }
            for (var index = 0; index < x.length; index++) {
                if (!fallback(x[index], y[index])) {
                    return false;
                }
            }
            return true;
        }
        else if (x instanceof Error && y instanceof Error) {
            if (x.constructor !== y.constructor) {
                return false;
            }
            if (x.name !== y.name || x.message !== y.message) {
                return false;
            }
            return true;
        }
        else {
            var xProps = Object.getOwnPropertyNames(x);
            var yProps = Object.getOwnPropertyNames(y);
            // Not the same number of properties?
            if (xProps.length !== yProps.length) {
                return false;
            }
            xProps = xProps.sort();
            yProps = yProps.sort();
            // Not the same properties?
            for (var index = 0; index < xProps.length; index++) {
                if (xProps[index] !== yProps[index]) {
                    return false;
                }
            }
            // Not the same values?
            for (var index = 0; index < xProps.length; index++) {
                var prop = xProps[index];
                if (!fallback(x[prop], y[prop])) {
                    return false;
                }
            }
            return true;
        }
    }
    else {
        return fallback(x, y);
    }
};
var deepEqualImpl = function (eq) { return function (x, y) {
    if (exports.strictEqual(x, y)) {
        return true;
    }
    if (typeof x === 'object' && typeof y === 'object') {
        if (x === null || y === null) {
            if (x === null && y === null) {
                return eq(x, y);
            }
            return false;
        }
        return recursiveEqualImplementation(x, y, deepEqualImpl(eq));
    }
    return eq(x, y);
}; };
exports.deepEqual = exports.createEqualityComparer(function () { return exports.deepEqual; }, exports.relaxedEqual, exports.defaultEqualityFactories);
exports.deepEqualStrict = exports.createEqualityComparer(function () { return exports.deepEqualStrict; }, exports.strictEqual, exports.defaultEqualityFactories);
exports.shallowEqual = exports.createEqualityComparer(function () { return exports.relaxedEqual; }, exports.relaxedEqual, exports.defaultEqualityFactories);
exports.shallowEqualStrict = exports.createEqualityComparer(function () { return exports.strictEqual; }, exports.strictEqual, exports.defaultEqualityFactories);
//# sourceMappingURL=equality.js.map