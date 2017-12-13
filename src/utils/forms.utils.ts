import { flatMap } from 'lodash';
import {
    assign,
    assignOrSame,
    assignIf,
    assignIfMany,
    id,
    objMapValues,
    toKVArray,
    shallowEqual,
    assignOrSameWith,
    joinStr
} from './common';
import { Coerce, coerceAll } from './coercion';
import { Validator, EasyValidator, mergeValidators } from './validation';
import {
    FormFieldInit,
    FormField,
    FormItem,
    FormItemState
} from './forms.interfaces';
import { shallowEqualStrict } from '../mtmobile-lib';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Path Utilities                         //
//                                                            //
////////////////////////////////////////////////////////////////

export const matchGroupPath = (path: string) => {
    const match = path.match(/^([^\[\.]+)(\.([^\.].*)|(\[.*)|())$/);
    if (!match) {
        return null;
    }
    const step = match[1];
    const rest = match[3] || match[4] || match[5];
    return { step, rest };
};

export const matchListingPath = (path: string) => {
    const match = path.match(/^\[([\d]+)\](\.([^\.].*)|(\[.*)|())$/);
    if (!match) {
        return null;
    }
    const step = parseInt(match[1], 10);
    const rest = match[3] || match[4] || match[5];
    return { step, rest };
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Form Items Manipulations               //
//                                                            //
////////////////////////////////////////////////////////////////

// const setItemLens = <T = any>(value: T) => (
//     item: FormItemState<T>
// ): FormItemState<T> => {
//     const coercedValue = item.coerce(value);
//     return assignOrSame(item, { value: coercedValue });
// };

export const updateDerived = <T = any, I extends FormItem<T> = FormItem<T>>(
    item: I
): I => {
    switch (item.type) {
        case 'field': {
            const isValid = item.errors.length === 0;
            const showErrors = !isValid && item.isTouched;
            const changes = <Partial<I>>{ isValid, showErrors };
            return assignOrSame(item, changes);
        }

        default:
            throw new Error('updateDerived: Not implemented');
    }
};

// export const updateState = <T = any, I extends FormItem<T> = FormItem<T>>(
//     item: I, newValue?: undefined
// ): I => {
//     if (newValue !== undefined) {
//         const newItem = setItemLens(newValue || item.initValue)(item);
//     }
// };

export const setValueInternal = (item: FormItem, value: any, path: string) => {
    switch (item.type) {
        case 'field': {
            if (!!path) {
                throw new Error(
                    `Unexpected path accessing this field: ${JSON.stringify(
                        path
                    )}`
                );
            }
            const newValue = item.coerce(value);
            const sameValue = item.value === newValue;
            if (sameValue && value === item.value) {
                return item;
            }

            const errors = item.validator(newValue);

            const newItem = assignOrSame(item, {
                value: newValue,
                isDirty: !sameValue || item.isDirty,
                isTouched: true,
                errors
            });

            return updateDerived(newItem);
        }

        default:
            throw new Error('setValueInternal: Not implemented');
    }
};
