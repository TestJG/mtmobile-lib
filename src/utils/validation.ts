import * as _ from 'lodash';
import {
    assignOrSame,
    errorToString,
    ValueOrFunc,
    getAsValueOrError
} from './common';

export type EasyValidationResult = string | string[];

export type EasyValidator<T = any> = (value: T) => EasyValidationResult;

export type ValidatorInit<T = any> = EasyValidator<T> | EasyValidator<T>[];

export type ValidationResult = string[];

export type Validator<T = any> = (value: T) => ValidationResult;

export type MessageSource = ValueOrFunc<string | string[]> | undefined;

export const emptyValidator = <T>(value: T) => [];

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
            throw new Error(`Expected a validation result of type string[] or string. However a ${typeof result} was received.`);
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

const getMessages = (...sources: MessageSource[]) => (args: any[]) => {
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
        'Should be a string',
        message,
        args
    );

export const shouldNotBeEmpty = (message?: MessageSource, ...args: any[]) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v !== '',
            'Should not be empty',
            message,
            args
        )
    );

export const shouldNotBeBlank = (message?: MessageSource, ...args: any[]) =>
    validateSome(
        shouldBeAString(message, ...args),
        checkCondition(
            (v: string) => v.trim() !== '',
            'Should not be blank',
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
            'Should match given pattern',
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
            'Should not match given pattern',
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
            () => `Should not be shorter than ${length} characters`,
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
            () => `Should be shorter than ${length} characters`,
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
            () => `Should not be longer than ${length} characters`,
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
            () => `Should be longer than ${length} characters`,
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
        'Should be a number',
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
            () => `Should be greater than ${value}`,
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
            () => `Should be greater than or equal to ${value}`,
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
            () => `Should be less than ${value}`,
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
            () => `Should be less than or equal to ${value}`,
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
            () => `Should be between ${minValue} and ${maxValue}`,
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
            () => `Should not be greater than ${value}`,
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
            () => `Should not be greater than or equal to ${value}`,
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
            () => `Should not be less than ${value}`,
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
            () => `Should not be less than or equal to ${value}`,
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
            () => `Should not be between ${minValue} and ${maxValue}`,
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
        'Should be an array',
        message,
        args
    );

export const shouldNotBeAnEmptyArray = (message?: MessageSource, ...args: any[]) =>
    validateSome(
        shouldBeAnArray(message, ...args),
        checkCondition(
            (v: any[]) => v.length > 0,
            'Should not be an empty array',
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
            () => `Should not be an array shorter than ${length} elements`,
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
            () => `Should be an array shorter than ${length} elements`,
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
            () => `Should not be an array longer than ${length} elements`,
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
            () => `Should be an array longer than ${length} elements`,
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
