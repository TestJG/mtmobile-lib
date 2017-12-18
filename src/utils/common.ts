import * as _ from 'lodash';
import {
    EqualityComparer,
    shallowEqualStrict
} from './equality';

export const assign = <T>(s: T, ...u: Partial<T>[]): T =>
    Object.assign({}, s, ...u);

export const assignArray = <T>(s: T[], ...u: [number, T[]][]): T[] => {
    const arr = s.slice();
    for (let index = 0; index < u.length; index++) {
        if (!(u[index] instanceof Array)) { continue; }
        const [pos, other] = u[index];
        if (!(typeof pos === 'number') || !(other instanceof Array)) { continue; }
        for (let p = 0; p < other.length; p++) {
            if (pos + p < arr.length) {
                arr[pos + p] = other[p];
            } else {
                arr.push(other[p]);
            }
        }
    }
    return arr;
};

export type ValueOrFunc<T = any> = T | ((...args: any[]) => T);

export const getAsValue = <T>(valueOrFunc: ValueOrFunc<T>, ...args: any[]) => {
    if (typeof valueOrFunc === 'function') {
        return valueOrFunc(...args);
    } else {
        return valueOrFunc;
    }
};

export const getAsValueOrError = <T>(
    valueOrFunc: ValueOrFunc<T>,
    onError: ValueOrFunc<T>,
    ...args: any[]
) => {
    if (typeof valueOrFunc === 'function') {
        try {
            return valueOrFunc(...args);
        } catch (error) {
            return getAsValue(onError, error);
        }
    } else {
        return valueOrFunc;
    }
};

export const assignOrSameWith = <T>(
    equality: EqualityComparer<T>,
    s: T,
    ...u: Partial<T>[]
): T => {
    const would = assign(s, ...u);
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};

export const assignOrSame = <T>(s: T, ...u: Partial<T>[]): T =>
    assignOrSameWith(shallowEqualStrict, s, ...u);

export const assignIf = <T>(
    s: T,
    condition: ValueOrFunc<boolean>,
    thenAssign: ValueOrFunc<Partial<T>>
): T => {
    if (getAsValue(condition, s)) {
        return assignOrSame(s, getAsValue(thenAssign, s));
    } else {
        return s;
    }
};

export const assignIfMany = <T>(
    s: T,
    ...stages: Array<[ValueOrFunc<boolean>, ValueOrFunc<Partial<T>>]>
): T =>
    stages.reduce(
        (prev, [condition, thenAssign]) =>
            assignIf(prev, condition, thenAssign),
        s
    );

export const assignArrayOrSameWith = <T>(
    equality: EqualityComparer<T[]>,
    s: T[],
    ...u: [number, T[]][]
): T[] => {
    const would = assignArray(s, ...u);
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};

export const assignArrayOrSame = <T>(s: T[],
    ...u: [number, T[]][]): T[] =>
    assignArrayOrSameWith(shallowEqualStrict, s, ...u);

export const assignArrayIf = <T>(
    s: T[],
    condition: ValueOrFunc<boolean>,
    thenAssign: ValueOrFunc<[number, T[]]>
): T[] => {
    if (getAsValue(condition, s)) {
        return assignArrayOrSame(s, getAsValue(thenAssign, s));
    } else {
        return s;
    }
};

export const assignArrayIfMany = <T>(
    s: T[],
    ...stages: Array<[ValueOrFunc<boolean>, ValueOrFunc<[number, T[]]>]>
): T[] =>
    stages.reduce(
        (prev, [condition, thenAssign]) =>
            assignArrayIf(prev, condition, thenAssign),
        s
    );

export const id = <T>(a: T) => a;

export const joinStr = (sep: string, strs: string[]) =>
    strs.reduce(
        (prev, str) => (!!prev && !!str ? prev + sep + str : prev || str),
        ''
    );

export function uuid(separator: string = '-'): string {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    if (!separator) {
        separator = '';
    }

    return (
        s4() +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        separator +
        s4() +
        s4() +
        s4()
    );
}

export type KeyValuePair = [string, any];

export type KeyValuePairsArray = [string, any][];
export interface KeyValuePairsMap {
    [key: string]: any;
}
export type KeyValuePairs = KeyValuePairsArray | KeyValuePairsMap;

export const toKVArray = (kvs: KeyValuePairs): KeyValuePairsArray => {
    if (kvs instanceof Array) {
        return kvs;
    }
    return Object.keys(kvs).map(k => <[string, any]>[k, kvs[k]]);
};

export const toKVMap = (kvs: KeyValuePairs): KeyValuePairsMap => {
    if (kvs instanceof Array) {
        return kvs.reduce(
            (prev, [key, value]) => Object.assign(prev, { [key]: value }),
            {}
        );
    }
    return kvs;
};

export const objFlatMap = (
    mapper: (keyValue: [string, any]) => KeyValuePairs
) => (source: KeyValuePairs): KeyValuePairsMap => {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    return toKVMap(
        _.flatMap(Object.keys(toKVMap(source)), key =>
            toKVArray(mapper([key, source[key]]))
        )
    );
};

export const objMap = (mapper: (keyValue: [string, any]) => [string, any]) =>
    objFlatMap(kv => [mapper(kv)]);

export const objMapValues = (mapper: (value: any, key: string) => any) =>
    objMap(([k, v]) => [k, mapper(v, k)]);

export const normalizeError = (err: any) => {
    if (!err) {
        return new Error('error.unknown');
    }
    if (typeof err === 'string') {
        return new Error(err);
    }
    if (err instanceof Error) {
        if (!err.message) {
            return new Error('error.unknown');
        }
        return err;
    }
    if (typeof err.message === 'string' && !!err.message) {
        return new Error(err.message);
    }
    return new Error('error.unknown');
};

export function errorToString(err: any) {
    return normalizeError(err).message;
}
