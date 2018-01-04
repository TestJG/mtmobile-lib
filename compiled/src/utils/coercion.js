"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coerceAll = function (list) {
    if (!list) {
        list = [];
    }
    if (typeof list === 'function') {
        list = [list];
    }
    return function (value) { return list.reduce(function (v, c) { return c(v); }, value); };
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     String coercions                       //
//                                                            //
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//                                                            //
//                     Numerical coercions                    //
//                                                            //
////////////////////////////////////////////////////////////////
exports.mustNotBeBelow = function (minValue) { return function (value) {
    if (value < minValue) {
        return minValue;
    }
    return value;
}; };
exports.mustNotBeAbove = function (maxValue) { return function (value) {
    if (value > maxValue) {
        return maxValue;
    }
    return value;
}; };
exports.mustBeBetween = function (minValue, maxValue) {
    return exports.coerceAll([exports.mustNotBeBelow(minValue), exports.mustNotBeAbove(maxValue)]);
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     DateTime coercions                    //
//                                                            //
////////////////////////////////////////////////////////////////
// mustNotBeAfterDate, mustNotBeBeforeDate, mustBeBetweenDates
//# sourceMappingURL=coercion.js.map