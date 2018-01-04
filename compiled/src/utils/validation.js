import _ from 'lodash';
import { errorToString, getAsValueOrError } from './common';
export const emptyValidator = (value) => [];
export const makeValidator = (val) => {
    if (val === undefined) {
        val = emptyValidator;
    }
    return (value) => {
        try {
            const result = val(value);
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
            return [errorToString(error)];
        }
    };
};
export const mergeValidators = (validators) => {
    if (validators === undefined) {
        validators = [];
    }
    if (typeof validators === 'function') {
        validators = [validators];
    }
    const realValidators = _.flatMap(validators, v => makeValidator(v));
    return (value) => realValidators.reduce((errors, validator) => errors.concat(validator(value)), []);
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Common Validators                      //
//                                                            //
////////////////////////////////////////////////////////////////
const stringFromSource = (source) => (args) => {
    if (source === undefined || source === null) {
        return [];
    }
    return getAsValueOrError(source, errorToString, ...args);
};
const getMessages = (...sources) => (args) => {
    for (const source of sources) {
        const str = stringFromSource(source)(args);
        if (typeof str === 'string' && !!str.trim()) {
            return [str.trim()];
        }
        else if (str instanceof Array && str.length > 0) {
            return str;
        }
    }
    return [];
};
export const checkCondition = (validCondition, defaultMessage, message, args) => makeValidator((v) => {
    if (!validCondition(v)) {
        const msgArgs = args instanceof Array ? [...(args || []), v] : [v];
        return getMessages(message, defaultMessage)(msgArgs);
    }
    else {
        return [];
    }
});
export const validateEvery = (...validators) => makeValidator((v) => validators.reduce((errors, validator) => errors.concat(validator(v)), []));
export const validateSome = (...validators) => makeValidator((v) => {
    for (let index = 0; index < validators.length; index++) {
        const validator = validators[index];
        const errors = validator(v);
        if (errors && errors.length) {
            return errors;
        }
    }
    return [];
});
export const shouldBe = (validCondition, message, ...args) => checkCondition(validCondition, message, undefined, args);
export const shouldNotBe = (validCondition, message, ...args) => checkCondition((v) => !validCondition(v), message, undefined, args);
////////////////////////////////////////////////////////////////
//                                                            //
//                     String validators                      //
//                                                            //
////////////////////////////////////////////////////////////////
export const shouldBeAString = (message, ...args) => checkCondition((v) => typeof v === 'string', 'Should be a string', message, args);
export const shouldNotBeEmpty = (message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v !== '', 'Should not be empty', message, args));
export const shouldNotBeBlank = (message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v.trim() !== '', 'Should not be blank', message, args));
export const shouldMatch = (pattern, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => !!v.match(pattern), 'Should match given pattern', message, args));
export const shouldNotMatch = (pattern, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => !v.match(pattern), 'Should not match given pattern', message, args));
export const shouldNotBeShorterThan = (length, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v.length >= length, () => `Should not be shorter than ${length} characters`, message, [...args, length]));
export const shouldBeShorterThan = (length, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v.length < length, () => `Should be shorter than ${length} characters`, message, [...args, length]));
export const shouldNotBeLongerThan = (length, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v.length <= length, () => `Should not be longer than ${length} characters`, message, [...args, length]));
export const shouldBeLongerThan = (length, message, ...args) => validateSome(shouldBeAString(message, ...args), checkCondition((v) => v.length > length, () => `Should be longer than ${length} characters`, message, [...args, length]));
////////////////////////////////////////////////////////////////
//                                                            //
//                     Numeric validators                     //
//                                                            //
////////////////////////////////////////////////////////////////
export const shouldBeANumber = (message, ...args) => checkCondition((v) => typeof v === 'number', 'Should be a number', message, args);
export const shouldBeGreaterThan = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v > value, () => `Should be greater than ${value}`, message, [...args, value]));
export const shouldBeGreaterThanOrEqualTo = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v >= value, () => `Should be greater than or equal to ${value}`, message, [...args, value]));
export const shouldBeLessThan = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v < value, () => `Should be less than ${value}`, message, [...args, value]));
export const shouldBeLessThanOrEqualTo = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v <= value, () => `Should be less than or equal to ${value}`, message, [...args, value]));
export const shouldBeBetweenValues = (minValue, maxValue, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => minValue <= v && v <= maxValue, () => `Should be between ${minValue} and ${maxValue}`, message, [...args, minValue, maxValue]));
export const shouldNotBeGreaterThan = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v <= value, () => `Should not be greater than ${value}`, message, [...args, value]));
export const shouldNotBeGreaterThanOrEqualTo = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v < value, () => `Should not be greater than or equal to ${value}`, message, [...args, value]));
export const shouldNotBeLessThan = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v >= value, () => `Should not be less than ${value}`, message, [...args, value]));
export const shouldNotBeLessThanOrEqualTo = (value, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => v > value, () => `Should not be less than or equal to ${value}`, message, [...args, value]));
export const shouldNotBeBetweenValues = (minValue, maxValue, message, ...args) => validateSome(shouldBeANumber(message, ...args), checkCondition((v) => !(minValue <= v && v <= maxValue), () => `Should not be between ${minValue} and ${maxValue}`, message, [...args, minValue, maxValue]));
////////////////////////////////////////////////////////////////
//                                                            //
//                     Array validators                       //
//                                                            //
////////////////////////////////////////////////////////////////
export const shouldBeAnArray = (message, ...args) => checkCondition((v) => v instanceof Array, 'Should be an array', message, args);
export const shouldNotBeAnEmptyArray = (message, ...args) => validateSome(shouldBeAnArray(message, ...args), checkCondition((v) => v.length > 0, 'Should not be an empty array', message, args));
export const shouldNotBeAnArrayShorterThan = (length, message, ...args) => validateSome(shouldBeAnArray(message, ...args), checkCondition((v) => v.length >= length, () => `Should not be an array shorter than ${length} elements`, message, [...args, length]));
export const shouldBeAnArrayShorterThan = (length, message, ...args) => validateSome(shouldBeAnArray(message, ...args), checkCondition((v) => v.length < length, () => `Should be an array shorter than ${length} elements`, message, [...args, length]));
export const shouldNotBeAnArrayLongerThan = (length, message, ...args) => validateSome(shouldBeAnArray(message, ...args), checkCondition((v) => v.length <= length, () => `Should not be an array longer than ${length} elements`, message, [...args, length]));
export const shouldBeAnArrayLongerThan = (length, message, ...args) => validateSome(shouldBeAnArray(message, ...args), checkCondition((v) => v.length > length, () => `Should be an array longer than ${length} elements`, message, [...args, length]));
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