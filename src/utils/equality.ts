
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
        } else if (x instanceof Error && y instanceof Error) {
            if (x.constructor !== y.constructor) {
                return false;
            }
            if (x.name !== y.name || x.message !== y.message) { return false; }
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
