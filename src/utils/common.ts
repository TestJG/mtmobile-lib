import * as _ from 'lodash';

export const assign = <T>(s: T, ...u: Partial<T>[]): T =>
    Object.assign({}, s, ...u);

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
            err.message = 'error.unknown';
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
