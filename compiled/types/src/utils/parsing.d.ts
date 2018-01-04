export declare type Parser<T = any, U = any> = (source: T) => U;
export declare const numberParser: Parser<string, number>;
export declare const integerParser: (radix: number) => Parser<string, number>;
export declare const decimalParser: Parser<string, number>;
