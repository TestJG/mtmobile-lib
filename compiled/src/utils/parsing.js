export const numberParser = source => {
    const result = parseFloat(source);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};
export const integerParser = (radix) => source => {
    const result = parseInt(source, radix);
    if (isFinite(result)) {
        return result;
    }
    throw new Error('Expected a number but got: ' + JSON.stringify(result));
};
export const decimalParser = integerParser(10);
//# sourceMappingURL=parsing.js.map