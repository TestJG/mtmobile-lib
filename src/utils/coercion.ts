export type Coerce<T> = (value: T) => T;

export const coerceAll = <T>(
    list: Coerce<T> | Coerce<T>[] | undefined
): Coerce<T> => {
    if (!list) {
        list = [];
    }
    if (typeof list === 'function') {
        list = [list];
    }
    return (value: T) => (<any>list).reduce((v, c) => c(v), value);
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     String coercions                       //
//                                                            //
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
//                                                            //
//                     Numerical coercions                    //
//                                                            //
////////////////////////////////////////////////////////////////

export const mustNotBeBelow = (minValue: number) => (value: number) => {
    if (value < minValue) {
        return minValue;
    }
    return value;
};

export const mustNotBeAbove = (maxValue: number) => (value: number) => {
    if (value > maxValue) {
        return maxValue;
    }
    return value;
};

export const mustBeBetween = (minValue: number, maxValue: number) =>
    coerceAll([mustNotBeBelow(minValue), mustNotBeAbove(maxValue)]);

////////////////////////////////////////////////////////////////
//                                                            //
//                     DateTime coercions                    //
//                                                            //
////////////////////////////////////////////////////////////////

// mustNotBeAfterDate, mustNotBeBeforeDate, mustBeBetweenDates
