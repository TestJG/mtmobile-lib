import _ from 'lodash';
import { shallowEqualStrict } from './equality';
export const assign = (s, ...u) => Object.assign({}, s, ...u);
export const assignArray = (s, ...u) => {
    const arr = s.slice();
    for (let index = 0; index < u.length; index++) {
        if (!(u[index] instanceof Array)) {
            continue;
        }
        const [pos, other] = u[index];
        if (!(typeof pos === 'number') || !(other instanceof Array)) {
            continue;
        }
        for (let p = 0; p < other.length; p++) {
            if (pos + p < arr.length) {
                arr[pos + p] = other[p];
            }
            else {
                arr.push(other[p]);
            }
        }
    }
    return arr;
};
export const getAsValue = (valueOrFunc, ...args) => {
    if (typeof valueOrFunc === 'function') {
        return valueOrFunc(...args);
    }
    else {
        return valueOrFunc;
    }
};
export const getAsValueOrError = (valueOrFunc, onError, ...args) => {
    if (typeof valueOrFunc === 'function') {
        try {
            return valueOrFunc(...args);
        }
        catch (error) {
            return getAsValue(onError, error);
        }
    }
    else {
        return valueOrFunc;
    }
};
export const assignOrSameWith = (equality, s, ...u) => {
    const would = assign(s, ...u);
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};
export const assignOrSame = (s, ...u) => assignOrSameWith(shallowEqualStrict, s, ...u);
export const assignIf = (s, condition, thenAssign) => {
    if (getAsValue(condition, s)) {
        return assignOrSame(s, getAsValue(thenAssign, s));
    }
    else {
        return s;
    }
};
export const assignIfMany = (s, ...stages) => stages.reduce((prev, [condition, thenAssign]) => assignIf(prev, condition, thenAssign), s);
export const assignArrayOrSameWith = (equality, s, ...u) => {
    const would = assignArray(s, ...u);
    if (equality(would, s) === true) {
        return s;
    }
    return would;
};
export const assignArrayOrSame = (s, ...u) => assignArrayOrSameWith(shallowEqualStrict, s, ...u);
export const assignArrayIf = (s, condition, thenAssign) => {
    if (getAsValue(condition, s)) {
        return assignArrayOrSame(s, getAsValue(thenAssign, s));
    }
    else {
        return s;
    }
};
export const assignArrayIfMany = (s, ...stages) => stages.reduce((prev, [condition, thenAssign]) => assignArrayIf(prev, condition, thenAssign), s);
export const id = (a) => a;
export const joinStr = (sep, strs) => strs.reduce((prev, str) => (!!prev && !!str ? prev + sep + str : prev || str), '');
export function uuid(separator = '-') {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    return joinStr(separator || '', [
        s4() + s4(),
        s4(),
        s4(),
        s4(),
        s4() + s4() + s4()
    ]);
}
export const toKVArray = (kvs) => {
    if (kvs instanceof Array) {
        return kvs;
    }
    return Object.keys(kvs).map(k => [k, kvs[k]]);
};
export const toKVMap = (kvs) => {
    if (kvs instanceof Array) {
        return kvs.reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {});
    }
    return kvs;
};
export const objFlatMap = (mapper) => (source) => {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    return toKVMap(_.flatMap(Object.keys(toKVMap(source)), key => toKVArray(mapper([key, source[key]]))));
};
export const objMap = (mapper) => objFlatMap(kv => [mapper(kv)]);
export const objMapValues = (mapper) => objMap(([k, v]) => [k, mapper(v, k)]);
export const objFilter = (filter) => (source) => {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    const original = toKVMap(source);
    return toKVMap(Object.keys(original).reduce((obj, key) => {
        if (filter([key, original[key]])) {
            return Object.assign(obj, { [key]: original[key] });
        }
        else {
            return obj;
        }
    }, {}));
};
export const normalizeError = (err) => {
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
export function errorToString(err) {
    return normalizeError(err).message;
}
//# sourceMappingURL=common.js.map