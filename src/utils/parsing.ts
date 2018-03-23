import { id, isNothing } from './common';

export type Parser<T = any, U = string> = (text: U) => T;
export type Formatter<T = any, U = string> = (source: T) => U;

////////////////////////////////////////////////////////////////
//                                                            //
//                String Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////

export const stringParser: Parser<string> = source => source || '';

export const stringFormatter: Formatter<string> = source => source || '';

////////////////////////////////////////////////////////////////
//                                                            //
//                Number Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////

export const numberParser: Parser<number> = source => {
    if (isNothing(source) || source === '') {
        return null;
    }
    const result = parseFloat(source);
    if (isNaN(result) || !isFinite(result)) {
        throw new Error('Should be a number');
    }
    return result;
};

export const integerParser = (radix: number): Parser<number> => text => {
    if (isNothing(text) || text === '') {
        return null;
    }
    const result = parseInt(text, radix);
    if (isNaN(result) || !isFinite(result)) {
        throw new Error('Should be a number');
    }
    return result;
};

export const decimalParser = integerParser(10);

export const numberRadixFormatter = (
    radix?: number
): Formatter<number> => value =>
    typeof value === 'number' ? value.toString(radix) : '';

export const numberFormatter = numberRadixFormatter(10);

export const numberPrecisionFormatter = (
    precision?: number
): Formatter<number> => value =>
    typeof value === 'number' ? value.toPrecision(precision) : '';

export const numberFixedFormatter = (
    digits?: number
): Formatter<number> => value =>
    typeof value === 'number' ? value.toFixed(digits) : '';

export const numberExponentialFormatter = (
    fractionDigits?: number
): Formatter<number> => value =>
    typeof value === 'number' ? value.toExponential(fractionDigits) : '';

export const numberLocaleFormatter = (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
): Formatter<number> => value =>
    typeof value === 'number' ? value.toLocaleString(locales, options) : '';

export const decimalFormatter = numberFixedFormatter(0);

////////////////////////////////////////////////////////////////
//                                                            //
//               Default Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////

export const getParserFor = (value: any): Parser<any, string> => {
    if (typeof value === 'string') {
        return stringParser;
    } else if (typeof value === 'number') {
        return numberParser;
    } else {
        return id;
    }
};

export const getFormatterFor = (value: any): Formatter<any, string> => {
    if (typeof value === 'string') {
        return stringFormatter;
    } else if (typeof value === 'number') {
        return numberFormatter;
    } else {
        return id;
    }
};
