import { EqualityComparer } from './equality';
export declare const isNothing: (x: any) => boolean;
export declare const isSomething: (x: any) => boolean;
export declare const assign: <T>(s: T, ...u: Partial<T>[]) => T;
export declare const assignArray: <T>(s: T[], ...u: [number, T[]][]) => T[];
export declare type FuncOf<T> = (...args: any[]) => T;
export declare type ValueOrFunc<T = any> = T | FuncOf<T>;
export declare const getAsValue: <T>(valueOrFunc: ValueOrFunc<T>, ...args: any[]) => T;
export declare const getAsValueOrError: <T>(valueOrFunc: ValueOrFunc<T>, onError: ValueOrFunc<T>, ...args: any[]) => T;
export declare const assignOrSameWith: <T>(equality: EqualityComparer<T>, s: T, ...u: Partial<T>[]) => T;
export declare const assignOrSame: <T>(s: T, ...u: Partial<T>[]) => T;
export declare const assignIf: <T>(s: T, condition: ValueOrFunc<boolean>, thenAssign: ValueOrFunc<Partial<T>>) => T;
export declare const assignIfMany: <T>(s: T, ...stages: [ValueOrFunc<boolean>, ValueOrFunc<Partial<T>>][]) => T;
export declare const assignArrayOrSameWith: <T>(equality: EqualityComparer<T[]>, s: T[], ...u: [number, T[]][]) => T[];
export declare const assignArrayOrSame: <T>(s: T[], ...u: [number, T[]][]) => T[];
export declare const assignArrayIf: <T>(s: T[], condition: ValueOrFunc<boolean>, thenAssign: ValueOrFunc<[number, T[]]>) => T[];
export declare const assignArrayIfMany: <T>(s: T[], ...stages: [ValueOrFunc<boolean>, ValueOrFunc<[number, T[]]>][]) => T[];
export declare const id: <T>(a: T) => T;
export declare const noop: () => void;
export declare const joinStr: (sep: string, strs: string[]) => string;
export declare function uuid(separator?: string): string;
export declare type KeyValuePair = [string, any];
export declare type KeyValuePairsArray = [string, any][];
export interface KeyValuePairsMap {
    [key: string]: any;
}
export declare type KeyValuePairs = KeyValuePairsArray | KeyValuePairsMap;
export declare const toKVArray: (kvs: KeyValuePairs) => [string, any][];
export declare const toKVMap: (kvs: KeyValuePairs) => KeyValuePairsMap;
export declare const objFlatMap: (mapper: (keyValue: [string, any]) => KeyValuePairs) => (source: KeyValuePairs) => KeyValuePairsMap;
export declare const objMap: (mapper: (keyValue: [string, any]) => [string, any]) => (source: KeyValuePairs) => KeyValuePairsMap;
export declare const objMapValues: (mapper: (value: any, key: string) => any) => (source: KeyValuePairs) => KeyValuePairsMap;
export declare const objFilter: (filter: (keyValue: [string, any]) => boolean) => (source: KeyValuePairs) => KeyValuePairsMap;
export declare const normalizeError: (err: any) => Error;
export declare function errorToString(err: any): string;
export declare function capString(str: string, maxLength: number, ellipsis?: string): string;
export interface LogOpts {
    logs?: boolean | ValueOrFunc<string>;
}
export interface Logger {
    log: typeof console.log;
}
export declare const conditionalLog: (logOpts?: string | boolean | LogOpts | FuncOf<string>, options?: Partial<{
    prefix: ValueOrFunc<string>;
    logger: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
}>) => ((msg: any, ...args: any[]) => void) & {
    enabled: boolean;
    options: {
        prefix: ValueOrFunc<string>;
        logger: {
            (message?: any, ...optionalParams: any[]): void;
            (message?: any, ...optionalParams: any[]): void;
        };
    };
};
export declare const subLog: (parentLog: any, enabled: string | boolean | FuncOf<string>, options?: Partial<{
    prefix: ValueOrFunc<string>;
    logger: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
}>) => ((msg: any, ...args: any[]) => void) & {
    enabled: boolean;
    options: {
        prefix: ValueOrFunc<string>;
        logger: {
            (message?: any, ...optionalParams: any[]): void;
            (message?: any, ...optionalParams: any[]): void;
        };
    };
};
export declare const logTee: <T>(caption: string, thunk: () => T) => T;
export declare const stopWatch: () => {
    elapsedMs: () => number;
    elapsedStr: () => string;
};
export declare function printStr(str: string, opts?: Partial<{
    maxLength: number;
    backChars: number;
    ellipsis: string;
}>): string;
export declare type Predicate<T = any> = (x: T) => boolean;
export declare type Comparer<T = any> = (x: T, y: T) => number;
export declare const compareTypes: Comparer;
export declare const compareSameType: Comparer;
export declare const compareNumber: Comparer<number>;
export declare const compareBy: <T = any>(...comparers: Comparer<T>[]) => Comparer<T>;
export declare const compareFunction: Comparer<Function>;
export declare const compareArray: Comparer<Array<any>>;
export declare const compareObject: Comparer<Object>;
export declare const compareDataByType: (x: any, y: any) => number;
export declare function printData(value: any, opts?: Partial<{
    maxLength: number;
    backChars: number;
    ellipsis: string;
    showStacktrace: boolean;
}>): string;
export interface PrintObjOptions {
    indent: number;
    indented: boolean;
    indentChars: string;
    maxDepth: number;
    maxLines: number;
    maxValueLength: number;
    backChars: number;
    ellipsis: string;
    maxValuesPerArray: number;
    maxPropertiesPerObject: number;
    showStacktrace: boolean;
    excludeTypes: Predicate<string> | string[];
    excludeConstructors: Predicate<Function> | Function[];
    propertyOrder: 'byName' | 'byTypeAndName';
    onlyEnumerableProperties: boolean;
}
export declare const oldPrintObj: (obj: any, options?: Partial<PrintObjOptions>) => string;
export declare const hasNewLine: (s: string) => boolean;
export declare const printObj: (obj: any, options?: Partial<PrintObjOptions>) => string;
