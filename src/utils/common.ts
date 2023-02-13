import type { EqualityComparer } from './equality';
import { shallowEqualStrict } from './equality';

export const isNothing = x => x === undefined || x === null;
export const isSomething = x => x !== undefined && x !== null;

export const isPromiseLike = <T>(prom: unknown): prom is PromiseLike<T> =>
    isSomething(prom) &&
    typeof prom['then'] === 'function' &&
    Promise.resolve(prom) === prom;

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

export type FuncOf<T> = (...args: any[]) => T;

export type ValueOrFunc<T = any> = T | FuncOf<T>;

export const getAsValue = <T>(valueOrFunc: ValueOrFunc<T>, ...args: any[]) => {
    if (typeof valueOrFunc === 'function') {
        return (valueOrFunc as FuncOf<T>)(...args);
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
            return (valueOrFunc as FuncOf<T>)(...args);
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
        Math.floor((1 + Math.random()) * 0x10000)
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

export const objFlatMap =
    (mapper: (keyValue: [string, any]) => KeyValuePairs) =>
    (source: KeyValuePairs): KeyValuePairsMap => {
        if (typeof source !== 'object') {
            throw new Error('Must be an object');
        }
        return toKVMap(
            Object.keys(toKVMap(source)).flatMap(key =>
                toKVArray(mapper([key, source[key]]))
            )
        );
    };

export const objMap = (mapper: (keyValue: [string, any]) => [string, any]) =>
    objFlatMap(kv => [mapper(kv)]);

export const objMapValues = (mapper: (value: any, key: string) => any) =>
    objMap(([k, v]) => [k, mapper(v, k)]);

export const objFilter =
    (filter: (keyValue: [string, any]) => boolean) =>
    (source: KeyValuePairs): KeyValuePairsMap => {
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
        return str.slice(0, maxLength - ellipsis.length) + ellipsis;
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
        ellipsis: '...'
    }
) {
    const maxLength =
        opts.maxLength >= opts.ellipsis.length
            ? opts.maxLength
            : opts.ellipsis.length;

    if (str.length > maxLength) {
        if (opts.ellipsis.length + opts.backChars >= str.length) {
            return (
                opts.ellipsis + str.slice(0, str.length - opts.ellipsis.length)
            );
        } else {
            return (
                str.slice(
                    0,
                    maxLength - opts.ellipsis.length - opts.backChars
                ) +
                opts.ellipsis +
                str.slice(str.length - opts.backChars)
            );
        }
    } else {
        return str;
    }
}

export type Predicate<T = any> = (x: T) => boolean;
export type Comparer<T = any> = (x: T, y: T) => number;

const orderedTypes = [
    'string',
    'boolean',
    'number',
    'symbol',
    'undefined',
    'function',
    'object'
];
export const compareTypes: Comparer = (x, y): number => {
    if (x === y) {
        return 0;
    }
    const a = orderedTypes.indexOf(x);
    const b = orderedTypes.indexOf(y);
    if (a < 0 || a > b) {
        return 1;
    }
    if (b < 0 || b > a) {
        return -1;
    }
    return 0;
};

export const compareSameType: Comparer = (x, y) =>
    typeof x === typeof y ? (x === y ? 0 : x < y ? -1 : 1) : 0;

export const compareNumber: Comparer<number> = (x, y) => {
    if (typeof x !== 'number' || typeof y !== 'number') {
        return 0;
    }
    if (isNaN(x)) {
        if (isNaN(y)) {
            return 0;
        } else {
            return 1;
        }
    } else if (isNaN(y)) {
        return -1;
    } else {
        return x === y ? 0 : x < y ? -1 : 1;
    }
};

export const compareBy =
    <T = any>(...comparers: Comparer<T>[]): Comparer<T> =>
    (x, y) => {
        for (let i = 0; i < comparers.length; i++) {
            const comp = comparers[i](x, y);
            if (comp !== 0) {
                return comp;
            }
        }
        return 0;
    };

export const compareFunction: Comparer<Function> = (x, y) => {
    if (typeof x !== 'function' || typeof y !== 'function') {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    return compareBy<Function>(
        (a, b) => compareSameType(a.name, b.name),
        (a, b) => compareNumber(a.length, b.length)
    )(x, y);
};

export const compareArray: Comparer<Array<any>> = (x, y) => {
    if (!(x instanceof Array) || !(y instanceof Array)) {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    const minLen = Math.min(x.length, y.length);
    for (let i = 0; i < minLen; i++) {
        const a = x[i];
        const b = y[i];
        const comp = compareDataByType(a, b);
        if (comp !== 0) {
            return comp;
        }
    }
    return compareNumber(x.length, y.length);
};

export const compareObject: Comparer<Object> = (x, y) => {
    if (typeof x !== 'object' || typeof y !== 'object') {
        return 0;
    }
    if (x === y) {
        return 0;
    }
    if (!x) {
        return -1;
    }
    if (!y) {
        return 1;
    }
    // array < object
    if (x instanceof Array) {
        if (y instanceof Array) {
            return compareArray(x, y);
        }
        return -1;
    } else if (y instanceof Array) {
        return 1;
    }
    const compFunc = compareFunction(x.constructor, y.constructor);
    if (compFunc !== 0) {
        return compFunc;
    }
    const xProps = Object.getOwnPropertyNames(x).sort();
    const yProps = Object.getOwnPropertyNames(y).sort();
    return compareArray(xProps, yProps);
};

export const compareDataByType = (x: any, y: any) => {
    const comp = compareTypes(typeof x, typeof y);
    if (comp !== 0) {
        return comp;
    }
    switch (typeof x) {
        case 'boolean':
        case 'string':
            return compareSameType(x, y);
        case 'symbol':
            return compareSameType(x.toString(), y.toString());
        case 'number':
            return compareNumber(x, y);
        case 'function':
            return compareFunction(x, y);
        case 'object':
            return compareObject(x, y);
        case 'undefined':
            return 0;
        default:
            return 0;
    }
};

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
        showStacktrace: true
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
            return value.toString();
        case 'function':
            return `${value.name}(... ${value.length} args) => { ... }`;
        default:
            if (!value) {
                return 'null';
            } else if (value instanceof Date) {
                return value.toISOString();
            } else if (value instanceof Array) {
                if (value.length === 0) {
                    return '[]';
                } else if (value.length === 1) {
                    return `[ 1 item ]`;
                }
                return `[ ... ${value.length} items ]`;
            } else if (value instanceof Error) {
                return (
                    `${value.name}: ${value.message}` +
                    (value.stack ? `\n${value.stack}` : '')
                );
            } else {
                const name =
                    !value.constructor || value.constructor === Object
                        ? ''
                        : value.constructor.name + ' ';
                const keys = Object.keys(value);
                if (keys.length === 0) {
                    return `${name}{}`;
                } else if (keys.length === 1) {
                    return `${name}{ 1 property }`;
                }
                return `${name}{ ... ${Object.keys(value).length} properties }`;
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
    excludeTypes: Predicate<string> | string[];
    excludeConstructors: Predicate<Function> | Function[];
    propertyOrder: 'byName' | 'byTypeAndName';
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
    excludeTypes: ['function'],
    excludeConstructors: [],
    propertyOrder: 'byTypeAndName',
    onlyEnumerableProperties: true
};

export const oldPrintObj = (
    obj: any,
    options: Partial<PrintObjOptions> = defaultPrintObjOptions
) => {
    const opts = Object.assign({}, defaultPrintObjOptions, options);
    let result = '';
    let depth = 0;
    // let lines = 0;
    const past = new Set<any>();
    let skipIndent = false;
    let indentation = '';
    for (let i = 0; i < opts.indent; i++) {
        indentation += opts.indentChars;
    }

    const append = (line: string) => {
        if (opts.indented && !skipIndent) {
            if (result.length > 0) {
                result += '\n';
            }
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
        indentation = indentation.slice(
            0,
            indentation.length - opts.indentChars.length
        );
    };

    const loop = (value: any, ender: string) => {
        if (depth < opts.maxDepth && value instanceof Array) {
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
        } else if (
            depth < opts.maxDepth &&
            value &&
            value.constructor === Object
        ) {
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
            append(
                printData(value, {
                    maxLength: opts.maxValueLength,
                    ellipsis: opts.ellipsis,
                    backChars: opts.backChars,
                    showStacktrace: opts.showStacktrace
                }) + ender
            );
        }
    };

    loop(obj, '');

    return result;
};

export const hasNewLine = (s: string) => !!s.match(/\n/);

export const printObj = (
    obj: any,
    options: Partial<PrintObjOptions> = defaultPrintObjOptions
) => {
    const opts = Object.assign({}, defaultPrintObjOptions, options);
    const excludeTypes =
        typeof opts.excludeTypes === 'function'
            ? opts.excludeTypes
            : (x: string) => (<string[]>opts.excludeTypes).indexOf(x) >= 0;
    const excludeConstructors =
        typeof opts.excludeConstructors === 'function'
            ? opts.excludeConstructors
            : (x: Function) =>
                  (<Function[]>opts.excludeConstructors).indexOf(x) >= 0;
    const past = new Map<any, string>();
    const indentations = ['', opts.indentChars];
    const ind = (depth: number) => {
        while (depth >= indentations.length) {
            indentations.push(
                indentations[indentations.length - 1] + opts.indentChars
            );
        }
        return indentations[depth];
    };
    const isExcluded = v =>
        excludeTypes(typeof v) || (!!v && excludeConstructors(v.constructor));
    const propertyComparer =
        opts.propertyOrder === 'byTypeAndName'
            ? compareBy<[string, string, any]>(
                  (a, b) => compareTypes(typeof a[2], typeof b[2]),
                  (a, b) => compareSameType(a[0], b[0])
              )
            : (a, b) => compareSameType(a[0], b[0]);

    const loop = (value: any, depth: number, path: string): string => {
        if (depth < opts.maxDepth && value instanceof Array) {
            if (past.has(value)) {
                return `[ cyclic reference ...${past.get(value)} ]`;
            } else if (value.length === 0) {
                return '[]';
            } else {
                past.set(value, path);
                const values = value
                    .filter(v => !isExcluded(v))
                    .map((v, i) => loop(v, depth + 1, `${path}[${i}]`));
                const totalLength = values.reduce(
                    (x, s) => x + s.length + 2,
                    0
                );
                if (
                    totalLength > opts.maxValueLength ||
                    values.some(s => hasNewLine(s))
                ) {
                    const valuesShort =
                        values.length <= opts.maxValuesPerArray
                            ? values
                            : values.slice(0, opts.maxValuesPerArray);
                    const str = valuesShort
                        .map(v => v.replace(/^|(\r?\n)/g, `$&${ind(1)}`))
                        .join(',\n');
                    if (value.length > opts.maxValuesPerArray) {
                        return `[\n${str}\n${ind(1)}// ... ${
                            value.length - opts.maxValuesPerArray
                        } more elements\n]`;
                    }
                    return `[\n${str}\n]`;
                } else {
                    const str = joinStr(', ', values);
                    return `[ ${str} ]`;
                }
            }
        } else if (
            depth < opts.maxDepth &&
            value &&
            value.constructor === Object
        ) {
            if (past.has(value)) {
                return `{ cyclic reference ...${past.get(value)} }`;
            } else {
                past.set(value, path);
                const propNames = opts.onlyEnumerableProperties
                    ? Object.keys(value)
                    : Object.getOwnPropertyNames(value);
                if (propNames.length === 0) {
                    return '{}';
                }
                const props = propNames
                    .map(
                        n =>
                            <[string, string, any]>[
                                n,
                                loop(value[n], depth + 1, `${path}.${n}`),
                                value[n]
                            ]
                    )
                    .filter(p => !isExcluded(p[2]));
                props.sort(propertyComparer);
                const totalLength = props.reduce(
                    (x, p) => x + p[0].length + p[1].length + 4,
                    0
                );

                if (
                    totalLength > opts.maxValueLength ||
                    props.some(p => hasNewLine(p[1]))
                ) {
                    const propsShort =
                        props.length <= opts.maxPropertiesPerObject
                            ? props
                            : props.slice(0, opts.maxPropertiesPerObject);
                    const str = propsShort
                        .map(
                            p =>
                                `${ind(1)}${p[0]}: ${p[1].replace(
                                    /(\r?\n)/g,
                                    `$&${ind(1)}`
                                )}`
                        )
                        .join(',\n');
                    if (propNames.length > opts.maxPropertiesPerObject) {
                        return `{\n${str}\n${ind(1)}// ... ${
                            propNames.length - opts.maxPropertiesPerObject
                        } more properties\n]`;
                    }
                    return `{\n${str}\n}`;
                } else {
                    const str = props.map(p => `${p[0]}: ${p[1]}`).join(', ');
                    return `{ ${str} }`;
                }
            }
        } else {
            const str = printData(value, {
                maxLength: opts.maxValueLength,
                ellipsis: opts.ellipsis,
                backChars: opts.backChars,
                showStacktrace: opts.showStacktrace
            });
            return str;
        }
    };

    return loop(obj, 0, '');
};

/**
 * Between clamps `value` within the inclusive `min` and `max` bounds.
 * @param value The number to clamp
 * @param min The lower bound
 * @param max The upper bound
 * @returns Returns the clamped number
 */
export const between = (value: number, min: number, max: number) => {
    // Handle NaN cases.
    min = min === min ? min : 0;
    max = max === max ? max : 0;

    return Math.min(Math.max(value, min), max);
};
