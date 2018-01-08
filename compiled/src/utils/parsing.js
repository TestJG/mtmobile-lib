"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
////////////////////////////////////////////////////////////////
//                                                            //
//                String Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////
exports.stringParser = function (source) { return source; };
exports.stringFormatter = function (source) { return source; };
////////////////////////////////////////////////////////////////
//                                                            //
//                Number Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////
exports.numberParser = function (source) {
    var result = parseFloat(source);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};
exports.integerParser = function (radix) { return function (text) {
    var result = parseInt(text, radix);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
}; };
exports.decimalParser = exports.integerParser(10);
exports.numberRadixFormatter = function (radix) { return function (value) {
    return value.toString(radix);
}; };
exports.numberFormatter = exports.numberRadixFormatter(10);
exports.numberPrecisionFormatter = function (precision) { return function (value) { return value.toPrecision(precision); }; };
exports.numberFixedFormatter = function (digits) { return function (value) { return value.toFixed(digits); }; };
exports.numberExponentialFormatter = function (fractionDigits) { return function (value) { return value.toExponential(fractionDigits); }; };
exports.numberLocaleFormatter = function (locales, options) { return function (value) { return value.toLocaleString(locales, options); }; };
exports.decimalFormatter = exports.numberFixedFormatter(0);
////////////////////////////////////////////////////////////////
//                                                            //
//               Default Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////
exports.getParserFor = function (value) {
    if (typeof value === 'string') {
        return exports.stringParser;
    }
    else if (typeof value === 'number') {
        return exports.numberParser;
    }
    else {
        return common_1.id;
    }
};
exports.getFormatterFor = function (value) {
    if (typeof value === 'string') {
        return exports.stringFormatter;
    }
    else if (typeof value === 'number') {
        return exports.numberFormatter;
    }
    else {
        return common_1.id;
    }
};
//# sourceMappingURL=parsing.js.map