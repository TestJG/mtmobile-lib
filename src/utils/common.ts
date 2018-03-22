import * as _ from 'lodash';
import { EqualityComparer, shallowEqualStrict } from './equality';

export const isNothing = x => x === undefined || x === null;
export const isSomething = x => x !== undefined && x !== null;

export const assign = <T>(s: T, ...u: Partial<T>[]): T =>
    Object.assign({}, s, ...u);

export const assignArray = <T>(s: T[], ...u: [number, T[]][]): T[] => {
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

export const assignArrayOrSame = <T>(s: T[], ...u: [number, T[]][]): T[] =>
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
export const noop = () => {};

export const joinStr = (sep: string, strs: string[]) =>
    strs.reduce(
        (prev, str) => (!!prev && !!str ? prev + sep + str : prev || str),
        ''
    );

export function uuid(separator: string = '-'): string {
    const s4 = () =>
        Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

    return joinStr(separator || '', [
        s4() + s4(),
        s4(),
        s4(),
        s4(),
        s4() + s4() + s4()
    ]);
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

export const objFilter = (filter: (keyValue: [string, any]) => boolean) => (
    source: KeyValuePairs
): KeyValuePairsMap => {
    if (typeof source !== 'object') {
        throw new Error('Must be an object');
    }
    const original = toKVMap(source);
    return toKVMap(
        Object.keys(original).reduce((obj, key) => {
            if (filter([key, original[key]])) {
                return Object.assign(obj, { [key]: original[key] });
            } else {
                return obj;
            }
        }, {})
    );
};

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

export function capString(
    str: string,
    maxLength: number,
    ellipsis: string = '...'
) {
    maxLength = maxLength >= ellipsis.length ? maxLength : ellipsis.length;
    if (str.length > maxLength) {
        return str.substr(0, maxLength - ellipsis.length) + ellipsis;
    } else {
        return str;
    }
}

export interface LogOpts {
    logs?: boolean | ValueOrFunc<string>;
}
export interface Logger {
    log: typeof console.log;
}

const getLogToConsole = (
    logOpts: boolean | ValueOrFunc<string> | LogOpts | null | undefined,
    defaultPrefix: ValueOrFunc<string>
): ValueOrFunc<string> | null => {
    if (isNothing(logOpts) || logOpts === false) {
        return null;
    } else if (logOpts === true) {
        return defaultPrefix || 'LOG: ';
    } else if (typeof logOpts === 'object') {
        return getLogToConsole(logOpts.logs, defaultPrefix);
    } else {
        return logOpts;
    }
};

export const conditionalLog = (
    logOpts?: boolean | ValueOrFunc<string> | LogOpts | null | undefined,
    options?: Partial<{
        prefix: ValueOrFunc<string>;
        logger: typeof console.log;
    }>
) => {
    const opts = Object.assign(
        {
            logger: console.log.bind(console)
        },
        options
    );
    const prefix = getLogToConsole(logOpts, opts.prefix);
    if (prefix) {
        const logger: typeof console.log = opts.logger;

        return Object.assign(
            (msg, ...args) => {
                const pref = getAsValue(prefix);
                if (typeof msg === 'function') {
                    msg = msg(...args);
                    logger(pref + msg);
                } else {
                    logger(pref + msg, ...args);
                }
            },
            {
                enabled: true,
                options: { prefix, logger }
            }
        );
    } else {
        return Object.assign((msg, ...args) => {}, {
            enabled: false,
            options: { prefix: '', logger: noop }
        });
    }
};

export const subLog = (
    parentLog: any,
    enabled: boolean | ValueOrFunc<string>,
    options?: Partial<{
        prefix: ValueOrFunc<string>;
        logger: typeof console.log;
    }>
) => {
    if (parentLog.enabled) {
        return conditionalLog(enabled, options);
    } else {
        return conditionalLog(false);
    }
};

export const logTee = <T>(caption: string, thunk: () => T) => {
    console.log(`START: ${caption}`);
    const startTime = new Date().getTime();
    try {
        const result = thunk();
        const ms = new Date().getTime() - startTime;
        console.log(`END  : ${caption} [${ms}ms]`);
        return result;
    } catch (error) {
        const ms = new Date().getTime() - startTime;
        console.log(`ERROR: ${caption} (${error.message}) [${ms}ms]`);
        throw error;
    }
};

export const stopWatch = () => {
    const startTime = new Date().getTime();
    const elapsedMs = () => new Date().getTime() - startTime;
    const elapsedStr = () => {
        const elapsed = elapsedMs();
        if (elapsed <= 1000) {
            return `${elapsed} ms`;
        } else if (elapsed <= 60 * 1000) {
            return `${elapsed / 1000.0} s`;
        } else {
            const minutes = Math.floor(elapsed / (60 * 1000.0));
            const seconds = (elapsed - minutes * (60 * 1000.0)) / 1000;
            return `${minutes} m ${seconds} s`;
        }
    };

    return { elapsedMs, elapsedStr };
};


export function printStr(
    str: string,
    opts: Partial<{
        maxLength: number;
        backChars: number;
        ellipsis: string;
    }> = {
        maxLength: 1000,
        backChars: 0,
        ellipsis: '...',
    }
) {
    const maxLength = opts.maxLength >= opts.ellipsis.length
        ? opts.maxLength
        : opts.ellipsis.length;

    if (str.length > maxLength) {
        if (opts.ellipsis.length + opts.backChars >= str.length) {
            return opts.ellipsis + str.substr(0, str.length - opts.ellipsis.length);
        } else {
            return str.substr(0, maxLength - opts.ellipsis.length - opts.backChars) +
                opts.ellipsis +
                str.substr(str.length - opts.backChars);
        }
    } else {
        return str;
    }
}

export function printData(
    value: any,
    opts: Partial<{
        maxLength: number;
        backChars: number;
        ellipsis: string;
        showStacktrace: boolean;
    }> = {
        maxLength: 1000,
        backChars: 0,
        ellipsis: '...',
        showStacktrace: true,
    }
): string {
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'undefined':
            return String(value);
        case 'string':
            return `'${printStr(value, opts)}'`;
        case 'symbol':
            return `'${printStr(value, opts)}'`;
        case 'function':
            return `function ${value.name} (... ${value.length} args) { ... }`;
        default:
            if (!value) {
                return 'null';
            } else if (value instanceof Date) {
                return value.toISOString();
            } else if (value instanceof Array) {
                return `[ ... ${value.length} items ]`;
            } else if (value instanceof Error) {
                return `${value.name}: ${value.message}` +
                    (value.stack ? `\n${value.stack}` : '');
            } else if (!value.constructor || value.constructor === Object) {
                return `{ ... }`;
            } else {
                return `${value.constructor.name} { ... }`;
            }
    }
}

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
    onlyEnumerableProperties: boolean;
}

const defaultPrintObjOptions: PrintObjOptions = {
    indent: 0,
    indented: true,
    indentChars: '    ',
    maxDepth: 5,
    maxLines: 100,
    maxValueLength: 100,
    backChars: 0,
    ellipsis: '...',
    maxValuesPerArray: 20,
    maxPropertiesPerObject: 40,
    showStacktrace: true,
    onlyEnumerableProperties: true,
};

export const printObj = (
    obj: any,
    options: Partial<PrintObjOptions> = defaultPrintObjOptions
) => {
    const opts = Object.assign({}, defaultPrintObjOptions, options);
    let result = '';
    let depth = 0;
    // let lines = 0;
    let indentation = '';
    let skipIndent = false;
    const past = new Set<any>();
    for (let i = 0; i < opts.indent; i++) {
        indentation += opts.indentChars;
    }

    const append = (line: string) => {
        if (opts.indented && !skipIndent) {
            if (result.length > 0) { result += '\n'; }
            result += indentation;
            result += line;
        } else {
            result += line;
        }
        skipIndent = false;
    };

    const indent = () => {
        depth++;
        indentation += opts.indentChars;
    };

    const unIndent = () => {
        depth--;
        indentation = indentation.substr(0, indentation.length - opts.indentChars.length);
    };

    const loop = (value: any, ender: string) => {
        if (depth < opts.maxDepth &&
            (value instanceof Array)) {

            if (past.has(value)) {
                append(`[ cyclic reference ... ]${ender}`);
            } else {
                append('[ ');
                indent();
                for (let index = 0; index < value.length; index++) {
                    if (index >= opts.maxValuesPerArray) {
                        append(`... ${value.length - index} more elements`);
                        break;
                    }
                    loop(value[index], ', ');
                }
                unIndent();
                append(']');
            }
        } else if (depth < opts.maxDepth && value && value.constructor === Object) {

            if (past.has(value)) {
                append(`{ cyclic reference ... }`);
            } else {
                append('{ ');
                indent();
                const props = opts.onlyEnumerableProperties
                    ? Object.keys(value).sort()
                    : Object.getOwnPropertyNames(value).sort();
                for (let index = 0; index < props.length; index++) {
                    if (index >= opts.maxPropertiesPerObject) {
                        append(`... ${props.length - index} more properties`);
                        break;
                    }
                    append(`${props[index]}: `);
                    skipIndent = true;
                    loop(value[props[index]], ', ');
                }
                unIndent();
                append('}');
            }
        } else {
            append(printData(value, {
                maxLength: opts.maxValueLength,
                ellipsis: opts.ellipsis,
                backChars: opts.backChars,
                showStacktrace: opts.showStacktrace
            }) + ender);
        }
    };

    loop(obj, '');

    return result;
};
