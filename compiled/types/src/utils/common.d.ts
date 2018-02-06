import { EqualityComparer } from './equality';
export declare const isNothing: (x: any) => boolean;
export declare const isSomething: (x: any) => boolean;
export declare const assign: <T>(s: T, ...u: Partial<T>[]) => T;
export declare const assignArray: <T>(s: T[], ...u: [number, T[]][]) => T[];
export declare type ValueOrFunc<T = any> = T | ((...args: any[]) => T);
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
export declare const conditionalLog: (logOpts?: string | boolean | LogOpts | ((...args: any[]) => string), options?: Partial<{
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
export declare const subLog: (parentLog: any, enabled: string | boolean | ((...args: any[]) => string), options?: Partial<{
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
