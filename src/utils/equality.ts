export type EqualityComparer<T = any> = (x: T, y: T) => boolean;
export type EqualityComparerFactory<T = any> = (
    childComparer: EqualityComparer
) => EqualityComparer<T>;

export const strictEqual = <T>(x: T, y: T) => x === y;
// tslint:disable-next-line:triple-equals
export const relaxedEqual = <T>(x: T, y: T) => x == y;

export const errorEqualFact: EqualityComparerFactory = (
    childComparer: EqualityComparer
) => (x: Error, y: Error) =>
    childComparer(x.name, y.name) && childComparer(x.message, y.message);

export const dateEqualFact: EqualityComparerFactory = (
    childComparer: EqualityComparer
) => (x: Date, y: Date) => x.getTime() === y.getTime();

export const arrayEqualFact: EqualityComparerFactory = (
    childComparer: EqualityComparer
) => (x: Array<any>, y: Array<any>) =>
    x.length === y.length && x.every((xv, i) => childComparer(xv, y[i]));

export const objectEqualFact: EqualityComparerFactory = (
    childComparer: EqualityComparer
) => (x: Object, y: Object) => {
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
        if (!childComparer(x[prop], y[prop])) {
            return false;
        }
    }
    return true;
};

export const defaultEqualityFactories: [
    (string | Function | undefined),
    boolean,
    EqualityComparerFactory
][] = [
    [Date, true, dateEqualFact],
    [Error, false, errorEqualFact],
    [Array, false, arrayEqualFact],
    [Object, true, objectEqualFact]
];

export const createEqualityComparer = (
    childComparer: () => EqualityComparer,
    fallbackComparer: EqualityComparer,
    factories: [
        (string | Function | undefined),
        boolean,
        EqualityComparerFactory
    ][]
): EqualityComparer => {
    return (x, y) => {
        for (let index = 0; index < factories.length; index++) {
            const [key, strict, factory] = factories[index];
            const isMatch =
                key === undefined ||
                (typeof key === 'string' &&
                    typeof x === key &&
                    typeof y === key) ||
                (typeof key === 'function' &&
                    !!x &&
                    !!y &&
                    ((strict &&
                        x.constructor === key &&
                        y.constructor === key) ||
                        (!strict && x instanceof key && y instanceof key)));
            if (isMatch) {
                return factory(childComparer())(x, y);
            }
        }
        return fallbackComparer(x, y);
    };
};

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
        } else if (x instanceof Error && y instanceof Error) {
            if (x.constructor !== y.constructor) {
                return false;
            }
            if (x.name !== y.name || x.message !== y.message) {
                return false;
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

export const deepEqual = createEqualityComparer(
    () => deepEqual,
    relaxedEqual,
    defaultEqualityFactories
);

export const deepEqualStrict = createEqualityComparer(
    () => deepEqualStrict,
    strictEqual,
    defaultEqualityFactories
);

export const shallowEqual = createEqualityComparer(
    () => relaxedEqual,
    relaxedEqual,
    defaultEqualityFactories
);

export const shallowEqualStrict = createEqualityComparer(
    () => strictEqual,
    strictEqual,
    defaultEqualityFactories
);
