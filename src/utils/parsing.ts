export type Parser<T = any, U = any> = (source: T) => U;

export const numberParser: Parser<string, number> = source => {
    const result = parseFloat(source);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};

export const integerParser = (
    radix: number
): Parser<string, number> => source => {
    const result = parseInt(source, radix);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};

export const decimalParser = integerParser(10);
