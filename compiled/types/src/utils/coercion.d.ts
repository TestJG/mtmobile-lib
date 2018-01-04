export declare type Coerce<T> = (value: T) => T;
export declare type CoerceInit<T> = Coerce<T> | Coerce<T>[];
export declare const coerceAll: <T>(list?: CoerceInit<T>) => Coerce<T>;
export declare const mustNotBeBelow: (minValue: number) => (value: number) => number;
export declare const mustNotBeAbove: (maxValue: number) => (value: number) => number;
export declare const mustBeBetween: (minValue: number, maxValue: number) => Coerce<number>;
