import * as _ from 'lodash';
import {
    assignOrSame,
    errorToString,
    ValueOrFunc,
    getAsValue,
    getAsValueOrError
} from './common';

export type EasyValidationResult = string | string[];

export type EasyValidator<T = any> = (value: T) => EasyValidationResult;

export type ValidatorInit<T = any> = EasyValidator<T> | EasyValidator<T>[];

export type ValidationResult = string[];

export type Validator<T = any> = (value: T) => ValidationResult;

export type MessageSource = ValueOrFunc<string | string[]> | undefined;

export const emptyValidator = <T>(value: T) => [];

const defaultMessages = {
    validatorResultErrorMessage: <ValueOrFunc<string>>(
        ((result: any) =>
            `Expected a validation result of type string[] or string. However a ${typeof result} was received.`)
    ),

    shouldBeAString: <ValueOrFunc<string>>'Should be a string',
    shouldNotBeEmpty: <ValueOrFunc<string>>'Should not be empty',
    shouldNotBeBlank: <ValueOrFunc<string>>'Should not be blank',
    shouldMatch: (pattern: RegExp) =>
        <ValueOrFunc<string>>'Should match given pattern',
    shouldNotMatch: (pattern: RegExp) =>
        <ValueOrFunc<string>>'Should not match given pattern',
    shouldNotBeShorterThan: (length: number) =>
        <ValueOrFunc<string>>`Should not be shorter than ${length} characters`,
    shouldBeShorterThan: (length: number) =>
        <ValueOrFunc<string>>`Should be shorter than ${length} characters`,
    shouldNotBeLongerThan: (length: number) =>
        <ValueOrFunc<string>>`Should not be longer than ${length} characters`,
    shouldBeLongerThan: (length: number) =>
        <ValueOrFunc<string>>`Should be longer than ${length} characters`,

    shouldBeANumber: <ValueOrFunc<string>>'Should be a number',
    shouldBeGreaterThan: (value: number) =>
        <ValueOrFunc<string>>`Should be greater than ${value}`,
    shouldBeGreaterThanOrEqualTo: (value: number) =>
        `Should be greater than or equal to ${value}`,
    shouldBeLessThan: (value: number) => `Should be less than ${value}`,
    shouldBeLessThanOrEqualTo: (value: number) =>
        `Should be less than or equal to ${value}`,
    shouldBeBetweenValues: (minValue: number, maxValue: number) =>
        `Should be between ${minValue} and ${maxValue}`,
    shouldNotBeGreaterThan: (value: number) =>
        `Should not be greater than ${value}`,
    shouldNotBeGreaterThanOrEqualTo: (value: number) =>
        `Should not be greater than or equal to ${value}`,
    shouldNotBeLessThan: (value: number) => `Should not be less than ${value}`,
    shouldNotBeLessThanOrEqualTo: (value: number) =>
        `Should not be less than or equal to ${value}`,
    shouldNotBeBetweenValues: (minValue: number, maxValue: number) =>
        `Should not be between ${minValue} and ${maxValue}`,

    shouldBeAnArray: 'Should be an array',
    shouldNotBeAnEmptyArray: 'Should not be an empty array',
    shouldNotBeAnArrayShorterThan: (length: number) =>
        `Should not be an array shorter than ${length} elements`,
    shouldBeAnArrayShorterThan: (length: number) =>
        `Should be an array shorter than ${length} elements`,
    shouldNotBeAnArrayLongerThan: (length: number) =>
        `Should not be an array longer than ${length} elements`,
    shouldBeAnArrayLongerThan: (length: number) =>
        `Should be an array longer than ${length} elements`
};

let validationMessages = defaultMessages;

export const setValidationMessages = (
    messages: Partial<typeof defaultMessages>
) => {
    validationMessages = assignOrSame(validationMessages, messages);
};

export const makeValidator = <T>(
    val: undefined | EasyValidator<T>
): Validator<T> => {
    if (val === undefined) {
        val = emptyValidator;
    }
    return (value: T) => {
        let result;
        try {
            result = val(value);
        } catch (error) {
            result = [errorToString(error)];
        }
        if (result instanceof Array) {
            return result;
        } else if (typeof result === 'string') {
            if (result.trim()) {
                return [result.trim()];
            } else {
                return [];
            }
        } else {
            const msg = getAsValue(
                validationMessages.validatorResultErrorMessage,
                result
            );
            throw new Error(msg);
        }
    };
};

export const mergeValidators = <T>(validators?: ValidatorInit<T>) => {
    if (validators === undefined) {
        validators = [];
    }
    if (typeof validators === 'function') {
        validators = [validators];
    }
    const realValidators = _.flatMap(validators, v => makeValidator(v));
    return (value: T) =>
        realValidators.reduce(
            (errors, validator) => errors.concat(validator(value)),
            []
        );
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Common Validators                      //
//                                                            //
////////////////////////////////////////////////////////////////

const stringFromSource = (source: MessageSource) => (args: any[]) => {
    if (source === undefined || source === null) {
        return [];
    }
    return getAsValueOrError(source, errorToString, ...args);
};

const getMessages =
    (...sources: MessageSource[]) =>
    (args: any[]) => {
        for (const source of sources) {
            const str = stringFromSource(source)(args);
            if (typeof str === 'string' && !!str.trim()) {
                return [str.trim()];
            } else if (str instanceof Array && str.length > 0) {
                return str;
            }
        }
        return [];
    };

export const checkCondition = <T>(
    validCondition: (v: T) => boolean,
    defaultMessage: MessageSource,
    message?: MessageSource,
    args?: any[]
) =>
    makeValidator((v: T) => {
        if (!validCondition(v)) {
            const msgArgs = args instanceof Array ? [...(args || []), v] : [v];
            return getMessages(message, defaultMessage)(msgArgs);
        } else {
            return [];
        }
    });

export const validateEvery = <T>(...validators: Validator<T>[]) =>
    makeValidator((v: T) =>
        validators.reduce(
            (errors, validator) => errors.concat(validator(v)),
            []
        )
    );

export const validateSome = <T>(...validators: Validator<T>[]) =>
    makeValidator((v: T) => {
        for (let index = 0; index < validators.length; index++) {
            const validator = validators[index];
            const errors = validator(v);
            if (errors && errors.length) {
                return errors;
            }
        }
        return [];
    });

export const shouldBe = <T>(
    validCondition: (v: T) => boolean,
    message: MessageSource,
    ...args: any[]
) => checkCondition(validCondition, message, undefined, args);

export const shouldNotBe = <T>(
    validCondition: (v: T) => boolean,
    message: MessageSource,
    ...args: any[]
) => checkCondition((v: T) => !validCondition(v), message, undefined, args);

////////////////////////////////////////////////////////////////
//                                                            //
//                     String validators                      //
//                                                            //
////////////////////////////////////////////////////////////////

export const shouldBeAString = (message?: MessageSource, ...args: any[]) =>
    checkCondition(
        (v: string) => typeof v === 'string',
        validationMessages.shouldBeAString,
        message,
        args
    );

export const shouldNotBeEmpty = (message?: MessageSource, ...args: any[]) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v !== '',
            validationMessages.shouldNotBeEmpty,
            message,
            args
        )
    );

export const shouldNotBeBlank = (message?: MessageSource, ...args: any[]) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.trim() !== '',
            validationMessages.shouldNotBeBlank,
            message,
            args
        )
    );

export const shouldMatch = (
    pattern: RegExp,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => !!v.match(pattern),
            validationMessages.shouldMatch(pattern),
            message,
            args
        )
    );

export const shouldNotMatch = (
    pattern: RegExp,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => !v.match(pattern),
            validationMessages.shouldNotMatch(pattern),
            message,
            args
        )
    );

export const shouldNotBeShorterThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.length >= length,
            validationMessages.shouldNotBeShorterThan(length),
            message,
            [...args, length]
        )
    );

export const shouldBeShorterThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.length < length,
            validationMessages.shouldBeShorterThan(length),
            message,
            [...args, length]
        )
    );

export const shouldNotBeLongerThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.length <= length,
            validationMessages.shouldNotBeLongerThan(length),
            message,
            [...args, length]
        )
    );

export const shouldBeLongerThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.length > length,
            validationMessages.shouldBeLongerThan(length),
            message,
            [...args, length]
        )
    );

////////////////////////////////////////////////////////////////
//                                                            //
//                     Numeric validators                     //
//                                                            //
////////////////////////////////////////////////////////////////

export const shouldBeANumber = (message?: MessageSource, ...args: any[]) =>
    checkCondition(
        (v: number) => typeof v === 'number' && isFinite(v),
        validationMessages.shouldBeANumber,
        message,
        args
    );

export const shouldBeGreaterThan = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v > value,
            validationMessages.shouldBeGreaterThan(value),
            message,
            [...args, value]
        )
    );

export const shouldBeGreaterThanOrEqualTo = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v >= value,
            validationMessages.shouldBeGreaterThanOrEqualTo(value),
            message,
            [...args, value]
        )
    );

export const shouldBeLessThan = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v < value,
            validationMessages.shouldBeLessThan(value),
            message,
            [...args, value]
        )
    );

export const shouldBeLessThanOrEqualTo = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v <= value,
            validationMessages.shouldBeLessThanOrEqualTo(value),
            message,
            [...args, value]
        )
    );

export const shouldBeBetweenValues = (
    minValue: number,
    maxValue: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => minValue <= v && v <= maxValue,
            validationMessages.shouldBeBetweenValues(minValue, maxValue),
            message,
            [...args, minValue, maxValue]
        )
    );

export const shouldNotBeGreaterThan = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v <= value,
            validationMessages.shouldNotBeGreaterThan(value),
            message,
            [...args, value]
        )
    );

export const shouldNotBeGreaterThanOrEqualTo = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v < value,
            validationMessages.shouldNotBeGreaterThanOrEqualTo(value),
            message,
            [...args, value]
        )
    );

export const shouldNotBeLessThan = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v >= value,
            validationMessages.shouldNotBeLessThan(value),
            message,
            [...args, value]
        )
    );

export const shouldNotBeLessThanOrEqualTo = (
    value: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => v > value,
            validationMessages.shouldNotBeLessThanOrEqualTo(value),
            message,
            [...args, value]
        )
    );

export const shouldNotBeBetweenValues = (
    minValue: number,
    maxValue: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeANumber(message, ...args),
        checkCondition(
            (v: number) => !(minValue <= v && v <= maxValue),
            validationMessages.shouldNotBeBetweenValues(minValue, maxValue),
            message,
            [...args, minValue, maxValue]
        )
    );

////////////////////////////////////////////////////////////////
//                                                            //
//                     Array validators                       //
//                                                            //
////////////////////////////////////////////////////////////////

export const shouldBeAnArray = (message?: MessageSource, ...args: any[]) =>
    checkCondition(
        (v: any[]) => v instanceof Array,
        validationMessages.shouldBeAnArray,
        message,
        args
    );

export const shouldNotBeAnEmptyArray = (
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length > 0,
            validationMessages.shouldNotBeAnEmptyArray,
            message,
            args
        )
    );

export const shouldNotBeAnArrayShorterThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length >= length,
            validationMessages.shouldNotBeAnArrayShorterThan(length),
            message,
            [...args, length]
        )
    );

export const shouldBeAnArrayShorterThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length < length,
            validationMessages.shouldBeAnArrayShorterThan(length),
            message,
            [...args, length]
        )
    );

export const shouldNotBeAnArrayLongerThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length <= length,
            validationMessages.shouldNotBeAnArrayLongerThan(length),
            message,
            [...args, length]
        )
    );

export const shouldBeAnArrayLongerThan = (
    length: number,
    message?: MessageSource,
    ...args: any[]
) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length > length,
            validationMessages.shouldBeAnArrayLongerThan(length),
            message,
            [...args, length]
        )
    );

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
