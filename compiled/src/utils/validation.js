"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var common_1 = require("./common");
exports.emptyValidator = function (value) { return []; };
var defaultMessages = {
    validatorResultErrorMessage: (function (result) {
        return "Expected a validation result of type string[] or string. However a " + typeof result + " was received.";
    }),
    shouldBeAString: 'Should be a string',
    shouldNotBeEmpty: 'Should not be empty',
    shouldNotBeBlank: 'Should not be blank',
    shouldMatch: function (pattern) {
        return 'Should match given pattern';
    },
    shouldNotMatch: function (pattern) {
        return 'Should not match given pattern';
    },
    shouldNotBeShorterThan: function (length) {
        return "Should not be shorter than " + length + " characters";
    },
    shouldBeShorterThan: function (length) {
        return "Should be shorter than " + length + " characters";
    },
    shouldNotBeLongerThan: function (length) {
        return "Should not be longer than " + length + " characters";
    },
    shouldBeLongerThan: function (length) {
        return "Should be longer than " + length + " characters";
    },
    shouldBeANumber: 'Should be a number',
    shouldBeGreaterThan: function (value) {
        return "Should be greater than " + value;
    },
    shouldBeGreaterThanOrEqualTo: function (value) {
        return "Should be greater than or equal to " + value;
    },
    shouldBeLessThan: function (value) {
        return "Should be less than " + value;
    },
    shouldBeLessThanOrEqualTo: function (value) {
        return "Should be less than or equal to " + value;
    },
    shouldBeBetweenValues: function (minValue, maxValue) {
        return "Should be between " + minValue + " and " + maxValue;
    },
    shouldNotBeGreaterThan: function (value) {
        return "Should not be greater than " + value;
    },
    shouldNotBeGreaterThanOrEqualTo: function (value) {
        return "Should not be greater than or equal to " + value;
    },
    shouldNotBeLessThan: function (value) {
        return "Should not be less than " + value;
    },
    shouldNotBeLessThanOrEqualTo: function (value) {
        return "Should not be less than or equal to " + value;
    },
    shouldNotBeBetweenValues: function (minValue, maxValue) {
        return "Should not be between " + minValue + " and " + maxValue;
    },
    shouldBeAnArray: 'Should be an array',
    shouldNotBeAnEmptyArray: 'Should not be an empty array',
    shouldNotBeAnArrayShorterThan: function (length) {
        return "Should not be an array shorter than " + length + " elements";
    },
    shouldBeAnArrayShorterThan: function (length) {
        return "Should be an array shorter than " + length + " elements";
    },
    shouldNotBeAnArrayLongerThan: function (length) {
        return "Should not be an array longer than " + length + " elements";
    },
    shouldBeAnArrayLongerThan: function (length) {
        return "Should be an array longer than " + length + " elements";
    },
};
var validationMessages = defaultMessages;
exports.setValidationMessages = function (messages) {
    validationMessages = common_1.assignOrSame(validationMessages, messages);
};
exports.makeValidator = function (val) {
    if (val === undefined) {
        val = exports.emptyValidator;
    }
    return function (value) {
        var result;
        try {
            result = val(value);
        }
        catch (error) {
            result = [common_1.errorToString(error)];
        }
        if (result instanceof Array) {
            return result;
        }
        else if (typeof result === 'string') {
            if (result.trim()) {
                return [result.trim()];
            }
            else {
                return [];
            }
        }
        else {
            var msg = common_1.getAsValue(validationMessages.validatorResultErrorMessage, result);
            throw new Error(msg);
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
    return exports.checkCondition(function (v) { return typeof v === 'string'; }, validationMessages.shouldBeAString, message, args);
};
exports.shouldNotBeEmpty = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v !== ''; }, validationMessages.shouldNotBeEmpty, message, args));
};
exports.shouldNotBeBlank = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.trim() !== ''; }, validationMessages.shouldNotBeBlank, message, args));
};
exports.shouldMatch = function (pattern, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !!v.match(pattern); }, validationMessages.shouldMatch(pattern), message, args));
};
exports.shouldNotMatch = function (pattern, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !v.match(pattern); }, validationMessages.shouldNotMatch(pattern), message, args));
};
exports.shouldNotBeShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length >= length; }, validationMessages.shouldNotBeShorterThan(length), message, args.concat([length])));
};
exports.shouldBeShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length < length; }, validationMessages.shouldBeShorterThan(length), message, args.concat([length])));
};
exports.shouldNotBeLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length <= length; }, validationMessages.shouldNotBeLongerThan(length), message, args.concat([length])));
};
exports.shouldBeLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAString.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > length; }, validationMessages.shouldBeLongerThan(length), message, args.concat([length])));
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
    return exports.checkCondition(function (v) { return typeof v === 'number' && isFinite(v); }, validationMessages.shouldBeANumber, message, args);
};
exports.shouldBeGreaterThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v > value; }, validationMessages.shouldBeGreaterThan(value), message, args.concat([value])));
};
exports.shouldBeGreaterThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v >= value; }, validationMessages.shouldBeGreaterThanOrEqualTo(value), message, args.concat([value])));
};
exports.shouldBeLessThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v < value; }, validationMessages.shouldBeLessThan(value), message, args.concat([value])));
};
exports.shouldBeLessThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v <= value; }, validationMessages.shouldBeLessThanOrEqualTo(value), message, args.concat([value])));
};
exports.shouldBeBetweenValues = function (minValue, maxValue, message) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return minValue <= v && v <= maxValue; }, validationMessages.shouldBeBetweenValues(minValue, maxValue), message, args.concat([minValue, maxValue])));
};
exports.shouldNotBeGreaterThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v <= value; }, validationMessages.shouldNotBeGreaterThan(value), message, args.concat([value])));
};
exports.shouldNotBeGreaterThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v < value; }, validationMessages.shouldNotBeGreaterThanOrEqualTo(value), message, args.concat([value])));
};
exports.shouldNotBeLessThan = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v >= value; }, validationMessages.shouldNotBeLessThan(value), message, args.concat([value])));
};
exports.shouldNotBeLessThanOrEqualTo = function (value, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v > value; }, validationMessages.shouldNotBeLessThanOrEqualTo(value), message, args.concat([value])));
};
exports.shouldNotBeBetweenValues = function (minValue, maxValue, message) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeANumber.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return !(minValue <= v && v <= maxValue); }, validationMessages.shouldNotBeBetweenValues(minValue, maxValue), message, args.concat([minValue, maxValue])));
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
    return exports.checkCondition(function (v) { return v instanceof Array; }, validationMessages.shouldBeAnArray, message, args);
};
exports.shouldNotBeAnEmptyArray = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > 0; }, validationMessages.shouldNotBeAnEmptyArray, message, args));
};
exports.shouldNotBeAnArrayShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length >= length; }, validationMessages.shouldNotBeAnArrayShorterThan(length), message, args.concat([length])));
};
exports.shouldBeAnArrayShorterThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length < length; }, validationMessages.shouldBeAnArrayShorterThan(length), message, args.concat([length])));
};
exports.shouldNotBeAnArrayLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length <= length; }, validationMessages.shouldNotBeAnArrayLongerThan(length), message, args.concat([length])));
};
exports.shouldBeAnArrayLongerThan = function (length, message) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return exports.validateSome(exports.shouldBeAnArray.apply(void 0, [message].concat(args)), exports.checkCondition(function (v) { return v.length > length; }, validationMessages.shouldBeAnArrayLongerThan(length), message, args.concat([length])));
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