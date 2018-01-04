"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var common_1 = require("./common");
exports.emptyValidator = function (value) { return []; };
exports.makeValidator = function (val) {
    if (val === undefined) {
        val = exports.emptyValidator;
    }
    return function (value) {
        try {
            var result = val(value);
            if (result instanceof Array) {
                return result;
            }
            else if (result.trim()) {
                return [result.trim()];
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [common_1.errorToString(error)];
        }
    };
};
exports.mergeValidators = function (validators) {
    if (validators === undefined) {
        validators = [];
    }
    if (typeof validators === 'function') {
        validators = [validators];
    }
    var realValidators = _.flatMap(validators, function (v) { return exports.makeValidator(v); });
    return function (value) {
        return realValidators.reduce(function (errors, validator) { return errors.concat(validator(value)); }, []);
    };
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Common Validators                      //
//                                                            //
////////////////////////////////////////////////////////////////
var stringFromSource = function (source) { return function (args) {
    if (source === undefined || source === null) {
        return [];
    }
    return common_1.getAsValueOrError.apply(void 0, [source, common_1.errorToString].concat(args));
}; };
var getMessages = function () {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return function (args) {
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            var str = stringFromSource(source)(args);
            if (typeof str === 'string' && !!str.trim()) {
                return [str.trim()];
            }
            else if (str instanceof Array && str.length > 0) {
                return str;
            }
        }
        return [];
    };
};
exports.checkCondition = function (validCondition, defaultMessage, message, args) {
    return exports.makeValidator(function (v) {
        if (!validCondition(v)) {
            var msgArgs = args instanceof Array ? (args || []).concat([v]) : [v];
            return getMessages(message, defaultMessage)(msgArgs);
        }
        else {
            return [];
        }
    });
};
exports.validateEvery = function () {
    var validators = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        validators[_i] = arguments[_i];
    }
    return exports.makeValidator(function (v) {
        return validators.reduce(function (errors, validator) { return errors.concat(validator(v)); }, []);
    });
};
exports.validateSome = function () {
    var validators = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        validators[_i] = arguments[_i];
    }
    return exports.makeValidator(function (v) {
        for (var index = 0; index < validators.length; index++) {
            var validator = validators[index];
            var errors = validator(v);
            if (errors && errors.length) {
                return errors;
            }
        }
        return [];
    });
};
exports.shouldBe = function (validCondition, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.checkCondition(validCondition, message, undefined, args);
};
exports.shouldNotBe = function (validCondition, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.checkCondition(function (v) { return !validCondition(v); }, message, undefined, args);
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     String validators                      //
//                                                            //
////////////////////////////////////////////////////////////////
exports.shouldBeAString = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.checkCondition(function (v) { return typeof v === 'string'; }, 'Should be a string', message, args);
};
exports.shouldNotBeEmpty = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v !== ''; }, 'Should not be empty', message, args));
};
exports.shouldNotBeBlank = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.trim() !== ''; }, 'Should not be blank', message, args));
};
exports.shouldMatch = function (pattern, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !!v.match(pattern); }, 'Should match given pattern', message, args));
};
exports.shouldNotMatch = function (pattern, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !v.match(pattern); }, 'Should not match given pattern', message, args));
};
exports.shouldNotBeShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length >= length; }, function () { return "Should not be shorter than " + length + " characters"; }, message, args.concat([length])));
};
exports.shouldBeShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length < length; }, function () { return "Should be shorter than " + length + " characters"; }, message, args.concat([length])));
};
exports.shouldNotBeLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length <= length; }, function () { return "Should not be longer than " + length + " characters"; }, message, args.concat([length])));
};
exports.shouldBeLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > length; }, function () { return "Should be longer than " + length + " characters"; }, message, args.concat([length])));
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Numeric validators                     //
//                                                            //
////////////////////////////////////////////////////////////////
exports.shouldBeANumber = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.checkCondition(function (v) { return typeof v === 'number'; }, 'Should be a number', message, args);
};
exports.shouldBeGreaterThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v > value; }, function () { return "Should be greater than " + value; }, message, args.concat([value])));
};
exports.shouldBeGreaterThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v >= value; }, function () { return "Should be greater than or equal to " + value; }, message, args.concat([value])));
};
exports.shouldBeLessThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v < value; }, function () { return "Should be less than " + value; }, message, args.concat([value])));
};
exports.shouldBeLessThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v <= value; }, function () { return "Should be less than or equal to " + value; }, message, args.concat([value])));
};
exports.shouldBeBetweenValues = function (minValue, maxValue, message) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return minValue <= v && v <= maxValue; }, function () { return "Should be between " + minValue + " and " + maxValue; }, message, args.concat([minValue, maxValue])));
};
exports.shouldNotBeGreaterThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v <= value; }, function () { return "Should not be greater than " + value; }, message, args.concat([value])));
};
exports.shouldNotBeGreaterThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v < value; }, function () { return "Should not be greater than or equal to " + value; }, message, args.concat([value])));
};
exports.shouldNotBeLessThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v >= value; }, function () { return "Should not be less than " + value; }, message, args.concat([value])));
};
exports.shouldNotBeLessThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v > value; }, function () { return "Should not be less than or equal to " + value; }, message, args.concat([value])));
};
exports.shouldNotBeBetweenValues = function (minValue, maxValue, message) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !(minValue <= v && v <= maxValue); }, function () { return "Should not be between " + minValue + " and " + maxValue; }, message, args.concat([minValue, maxValue])));
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Array validators                       //
//                                                            //
////////////////////////////////////////////////////////////////
exports.shouldBeAnArray = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.checkCondition(function (v) { return v instanceof Array; }, 'Should be an array', message, args);
};
exports.shouldNotBeAnEmptyArray = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > 0; }, 'Should not be an empty array', message, args));
};
exports.shouldNotBeAnArrayShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length >= length; }, function () { return "Should not be an array shorter than " + length + " elements"; }, message, args.concat([length])));
};
exports.shouldBeAnArrayShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length < length; }, function () { return "Should be an array shorter than " + length + " elements"; }, message, args.concat([length])));
};
exports.shouldNotBeAnArrayLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length <= length; }, function () { return "Should not be an array longer than " + length + " elements"; }, message, args.concat([length])));
};
exports.shouldBeAnArrayLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > length; }, function () { return "Should be an array longer than " + length + " elements"; }, message, args.concat([length])));
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     DateTime validators                    //
//                                                            //
////////////////////////////////////////////////////////////////
// before/notBefore
// after/notAfter
// betweenDates/notBetweenDates
////////////////////////////////////////////////////////////////
//                                                            //
//                     Composite validators                   //
//                                                            //
////////////////////////////////////////////////////////////////
// Conditionals
// Collection validators
// Logical operators
//# sourceMappingURL=validation.js.map