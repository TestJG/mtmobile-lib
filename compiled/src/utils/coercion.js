export const coerceAll = (list) => {
    if (!list) {
        list = [];
    }
    if (typeof list === 'function') {
        list = [list];
    }
    return (value) => list.reduce((v, c) => c(v), value);
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
export const mustNotBeBelow = (minValue) => (value) => {
    if (value < minValue) {
        return minValue;
    }
    return value;
};
export const mustNotBeAbove = (maxValue) => (value) => {
    if (value > maxValue) {
        return maxValue;
    }
    return value;
};
export const mustBeBetween = (minValue, maxValue) => coerceAll([mustNotBeBelow(minValue), mustNotBeAbove(maxValue)]);
////////////////////////////////////////////////////////////////
//                                                            //
//                     DateTime coercions                    //
//                                                            //
////////////////////////////////////////////////////////////////
// mustNotBeAfterDate, mustNotBeBeforeDate, mustBeBetweenDates
//# sourceMappingURL=coercion.js.map