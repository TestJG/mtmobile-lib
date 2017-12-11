import { flatMap } from 'lodash';
import { assignOrSame, errorToString } from './common';

export type EasyValidationResult = string | string[];

export type EasyValidator<T> = (value: T) => EasyValidationResult;

export type ValidationResult = string[];

export type Validator<T> = (value: T) => ValidationResult;

export type MessageSource = string | ((...args: any[]) => string) | undefined;

export const emptyValidator = <T>(value: T) => [];

export const makeValidator = <T>(
    val: undefined | EasyValidator<T>
): Validator<T> => {
    if (val === undefined) {
        val = emptyValidator;
    }
    return (value: T) => {
        try {
            const result = val(value);
            if (result instanceof Array) {
                return result;
            } else if (result.trim()) {
                return [result.trim()];
            } else {
                return [];
            }
        } catch (error) {
            return [errorToString(error)];
        }
    };
};

export const mergeValidators = <T>(
    validators: EasyValidator<T> | EasyValidator<T>[] | undefined
): Validator<T> => (value: T) => {
    if (validators === undefined) {
        validators = [];
    }
    if (typeof validators === 'function') {
        validators = [validators];
    }
    return flatMap(validators, v => makeValidator(v)(value));
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Common Validators                      //
//                                                            //
////////////////////////////////////////////////////////////////

const stringFromSource = (source: MessageSource) => (args: any[]) => {
    if (!source) {
        return '';
    }
    if (typeof source === 'function') {
        try {
            return source(...args);
        } catch (error) {
            return errorToString(error);
        }
    }
    return source;
};

const getMessage = (...sources: MessageSource[]) => (args: any[]) => {
    for (const source of sources) {
        const str = stringFromSource(source)(args);
        if (!!str) {
            return str;
        }
    }
    return '';
};

export const checkCondition = <T>(
    validCondition: (v: T) => boolean,
    defaultMessage: MessageSource,
    message?: MessageSource,
    args?: any[]
) =>
    makeValidator((v: T) => {
        if (validCondition(v)) {
            return getMessage(defaultMessage, message)([...args, v]);
        } else {
            return '';
        }
    });

////////////////////////////////////////////////////////////////
//                                                            //
//                     String validators                      //
//                                                            //
////////////////////////////////////////////////////////////////

export const shouldNotBeEmpty = (message?: MessageSource) =>
    checkCondition((v: string) => v !== '', 'Should not be empty', message);

export const shouldNotBeBlank = (message?: MessageSource) =>
    checkCondition(
        (v: string) => (v || '').trim() !== '',
        'Should not be blank',
        message
    );

export const shouldMatch = (pattern: RegExp, message?: MessageSource) =>
    checkCondition(
        (v: string) => !!(v || '').match(pattern),
        'Should match given pattern',
        message
    );

export const shouldNotMatch = (pattern: RegExp, message?: MessageSource) =>
    checkCondition(
        (v: string) => !(v || '').match(pattern),
        'Should not match given pattern',
        message
    );

export const shouldNotBeShorterThan = (
    length: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: string) => (v || '').length >= length,
        (l: number) => `Should not be shorter than ${l} characters`,
        message,
        [length]
    );

export const shouldBeShorterThan = (length: number, message?: MessageSource) =>
    checkCondition(
        (v: string) => (v || '').length < length,
        (l: number) => `Should be shorter than ${l} characters`,
        message,
        [length]
    );

export const shouldNotBeLongerThan = (
    length: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: string) => (v || '').length <= length,
        (l: number) => `Should not be longer than ${l} characters`,
        message,
        [length]
    );

export const shouldBeLongerThan = (length: number, message?: MessageSource) =>
    checkCondition(
        (v: string) => (v || '').length > length,
        (l: number) => `Should be longer than ${l} characters`,
        message,
        [length]
    );

////////////////////////////////////////////////////////////////
//                                                            //
//                     Numeric validators                     //
//                                                            //
////////////////////////////////////////////////////////////////

export const shouldBeGreaterThan = (value: number, message?: MessageSource) =>
    checkCondition(
        (v: number) => v > value,
        (l: number) => `Should be greater than ${l}`,
        message,
        [value]
    );

export const shouldBeGreaterThanOrEqualTo = (
    value: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => v >= value,
        (l: number) => `Should be greater than or equal to ${l}`,
        message,
        [value]
    );

export const shouldBeLessThan = (value: number, message?: MessageSource) =>
    checkCondition(
        (v: number) => v < value,
        (l: number) => `Should be less than ${l}`,
        message,
        [value]
    );

export const shouldBeLessThanOrEqualTo = (
    value: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => v <= value,
        (l: number) => `Should be less than or equal to ${l}`,
        message,
        [value]
    );

export const shouldBeBetweenValues = (
    minValue: number,
    maxValue: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => minValue <= v && v <= maxValue,
        (min: number, max: number) => `Should be between ${min} and ${max}`,
        message,
        [minValue, maxValue]
    );

export const shouldNotBeGreaterThan = (
    value: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => v <= value,
        (l: number) => `Should not be greater than ${l}`,
        message,
        [value]
    );

export const shouldNotBeGreaterThanOrEqualTo = (
    value: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => v < value,
        (l: number) => `Should not be greater than or equal to ${l}`,
        message,
        [value]
    );

export const shouldNotBeLessThan = (value: number, message?: MessageSource) =>
    checkCondition(
        (v: number) => v >= value,
        (l: number) => `Should not be less than ${l}`,
        message,
        [value]
    );

export const shouldNotBeLessThanOrEqualTo = (
    value: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => v > value,
        (l: number) => `Should not be less than or equal to ${l}`,
        message,
        [value]
    );

export const shouldNotBeBetweenValues = (
    minValue: number,
    maxValue: number,
    message?: MessageSource
) =>
    checkCondition(
        (v: number) => !(minValue <= v && v <= maxValue),
        (min: number, max: number) => `Should not be between ${min} and ${max}`,
        message,
        [minValue, maxValue]
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
