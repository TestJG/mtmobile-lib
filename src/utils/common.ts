import * as _ from 'lodash';
// import deepequal from 'deep-equal';

export const assign = <T>(s: T, ...u: Partial<T>[]): T =>
    Object.assign({}, s, ...u);

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

export type EqualityComparer<T> = (x: T, y: T) => boolean;
export type EqualityComparerWithFallback<T> = (
    x: T,
    y: T,
    fallback: EqualityComparer<T>
) => boolean;

export const strictEqual = <T>(x: T, y: T) => x === y;
// tslint:disable-next-line:triple-equals
export const relaxedEqual = <T>(x: T, y: T) => x == y;

const recursiveEqualImplementation = <T>(
    x: T,
    y: T,
    fallback: EqualityComparer<any>
) => {
    if (x === y) {
        return true;
    }
    if (typeof x === 'object' && typeof y === 'object') {
        if (x === null || y === null) {
            if (x === null && y === null) {
                return fallback(x, y);
            }
            return false;
        }
        if (x.constructor !== y.constructor) {
            return false;
        }
        if (x instanceof Array && y instanceof Array) {
            if (x.length !== y.length) {
                return false;
            }
            for (let index = 0; index < x.length; index++) {
                if (!fallback(x[index], y[index])) {
                    return false;
                }
            }
            return true;
        } else {
            let xProps = Object.getOwnPropertyNames(x);
            let yProps = Object.getOwnPropertyNames(y);
            // Not the same number of properties?
            if (xProps.length !== yProps.length) {
                return false;
            }
            xProps = xProps.sort();
            yProps = yProps.sort();
            // Not the same properties?
            for (let index = 0; index < xProps.length; index++) {
                if (xProps[index] !== yProps[index]) {
                    return false;
                }
            }
            // Not the same values?
            for (let index = 0; index < xProps.length; index++) {
                const prop = xProps[index];
                if (!fallback(x[prop], y[prop])) {
                    return false;
                }
            }
            return true;
        }
    } else {
        return fallback(x, y);
    }
};

const deepEqualImpl = (eq: EqualityComparer<any>) => <T>(x: T, y: T) => {
    if (x === y) {
        return true;
    }
    if (typeof x === 'object' && typeof y === 'object') {
        if (x === null || y === null) {
            if (x === null && y === null) {
                return eq(x, y);
            }
            return false;
        }
        return recursiveEqualImplementation(x, y, deepEqualImpl(eq));
    }

    return eq(x, y);
};

export const deepEqual = deepEqualImpl(relaxedEqual);
export const deepEqualStrict = deepEqualImpl(strictEqual);

export const shallowEqual = <T>(x: T, y: T) =>
    recursiveEqualImplementation(x, y, relaxedEqual);
export const shallowEqualStrict = <T>(x: T, y: T) =>
    recursiveEqualImplementation(x, y, strictEqual);

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
