"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberParser = function (source) {
    var result = parseFloat(source);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};
exports.integerParser = function (radix) { return function (source) {
    var result = parseInt(source, radix);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
}; };
exports.decimalParser = exports.integerParser(10);
//# sourceMappingURL=parsing.js.map