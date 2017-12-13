import { flatMap } from 'lodash';
import { assign, assignOrSame } from './common';
import { coerceAll } from './coercion';
import { mergeValidators } from './validation';
import {
    FormFieldInit,
    FormField,
    FormItem,
    FormItemState
} from './forms.interfaces';
import { checkPathInField } from './forms.utils';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Initializations                        //
//                                                            //
////////////////////////////////////////////////////////////////

export const field = <T = any>(
    initValue: T,
    options?: Partial<FormFieldInit<T>>
): FormField<T> => {
    const {
        caption,
        description,
        coerce: coerceInit,
        validations: validatorInit
    } = assign(
        <FormFieldInit<T>>{
            caption: '',
            description: '',
            coerce: undefined,
            validations: undefined
        },
        options
    );

    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const value = coerce(initValue);
    const errors = validator(value);
    const isValid = errors.length === 0;
    const showErrors = false;

    const result: FormField<T> = {
        // Type
        type: 'field',

        // Config
        caption,
        description,
        initValue,
        coerce,
        validator,

        // State
        value,
        errors,
        isDirty: false,
        isTouched: false,

        // Derived
        isValid,
        showErrors
    };

    return result;
};

export const getFormItemInternal = (item: FormItem, path: string) => {
    switch (item.type) {
        case 'field': {
            checkPathInField(path);

            return item;
        }

        default:
            throw new Error('getValueInternal: Not implemented');
    }
};

export const setValueInternal = (item: FormItem, value: any, path: string) => {
    switch (item.type) {
        case 'field': {
            checkPathInField(path);

            // State
            const newValue = item.coerce(value);
            const sameValue = item.value === newValue;
            if (sameValue && value === item.value) {
                return item;
            }

            const errors = item.validator(newValue);
            const isDirty = !sameValue || item.isDirty;
            const isTouched = true || isDirty || item.isTouched;

            // Derived
            const isValid = errors.length === 0;
            const showErrors = !isValid && isTouched;

            const newItem = assignOrSame(item, {
                value: newValue,
                isDirty,
                isTouched,
                errors,
                isValid,
                showErrors
            });

            return newItem;
        }

        default:
            throw new Error('setValueInternal: Not implemented');
    }
};

export const getValue = (item: FormItem, path: string = ''): any => {
    const child = getFormItem(item, path);
    if (!child) {
        return undefined;
    }
    return child.value;
};

export const getFormItem = (item: FormItem, path: string = ''): FormItem => {
    switch (item.type) {
        case 'field': {
            checkPathInField(path);
            return item;
        }

        default:
            throw new Error('getFormItem: Not implemented');
    }
};

export const existFormItem = (item: FormItem, path: string = ''): boolean =>
    !!getFormItem(item, path);

export const setValue = <I extends FormItem = FormItem>(
    item: I,
    value: any,
    path: string = ''
): I => {
    return <I>setValueInternal(item, value, path);
};
