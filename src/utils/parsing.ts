export type Parser<T = any, U = string> = (text: U) => T;
export type Formatter<T = any, U = string> = (source: T) => U;

////////////////////////////////////////////////////////////////
//                                                            //
//                Number Parsers and Formatters               //
//                                                            //
////////////////////////////////////////////////////////////////

export const numberParser: Parser<number> = source => {
    const result = parseFloat(source);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};

export const integerParser = (radix: number): Parser<number> => text => {
    const result = parseInt(text, radix);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};

export const decimalParser = integerParser(10);

export const numberFormatter = (radix?: number): Formatter<number> => value =>
    value.toString(radix);

export const numberPrecisionFormatter = (
    precision?: number
): Formatter<number> => value => value.toPrecision(precision);

export const numberFixedFormatter = (
    digits?: number
): Formatter<number> => value => value.toFixed(digits);

export const numberExponentialFormatter = (
    fractionDigits?: number
): Formatter<number> => value => value.toExponential(fractionDigits);

export const numberLocaleFormatter = (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
): Formatter<number> => value => value.toLocaleString(locales, options);

export const decimalFormatter = numberFixedFormatter(0);
