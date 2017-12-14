import { flatMap } from 'lodash';
import { assign, assignOrSame, objMapValues } from './common';
import { coerceAll } from './coercion';
import { mergeValidators } from './validation';
import {
    FormItem,
    FormFieldInit,
    FormField,
    FormItemState,
    FormGroupInit,
    FormGroup,
    FormGroupState,
    FormGroupFields
} from './forms.interfaces';
import {
    checkPathInField,
    setValueInternal,
    matchGroupPath,
    matchListingPath,
    locateInGroupOrFail,
    createGroupValue,
    setGroupFieldInternal
} from './forms.utils';
import { ValueOrFunc } from '../mtmobile-lib';

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
        value: undefined,
        errors: [],
        isDirty: false,
        isTouched: false,

        // Derived
        isValid: true,
        showErrors: false
    };

    return <FormField<T>>setValueInternal(result, initValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true,
    });
};

export const group = <T = any, F extends FormGroupFields = FormGroupFields>(
    fields: F,
    options?: Partial<FormGroupInit<T>>
): FormGroup<T, F> => {
    if (
        typeof fields !== 'object' ||
        !(fields instanceof Object) ||
        fields.constructor !== Object
    ) {
        throw new Error('Group fields must be a plain JS object.');
    }

    const {
        caption,
        description,
        coerce: coerceInit,
        validations: validatorInit,
        initValue
    } = assign(
        <FormGroupInit<T>>{
            caption: '',
            description: '',
            coerce: undefined,
            validations: undefined,
            initValue: undefined
        },
        options
    );

    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const theFields = <F>Object.assign({}, fields);
    const theInitValue = initValue || <T>createGroupValue(theFields);
    // const value = coerce(theInitValue);
    // const isDirty = false;
    // const isTouched = false;
    // const errors = validator(value);
    // const isValid = errors.length === 0;
    // const showErrors = false;

    const result: FormGroup<T, F> = {
        // Type
        type: 'group',

        // Config
        caption,
        description,
        initValue: theInitValue,
        coerce,
        validator,

        // State
        value: undefined,
        errors: [],
        isDirty: false,
        isTouched: false,

        // Derived
        isValid: true,
        showErrors: false,

        fields: theFields
    };

    return <FormGroup<T, F>>setValueInternal(result, theInitValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true,
    });
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Form Item Manipulations                //
//                                                            //
////////////////////////////////////////////////////////////////

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

        case 'group': {
            if (!path) {
                return item;
            }

            const [_, child, restOfPath] = locateInGroupOrFail(item, path);
            return getFormItem(child, restOfPath);
        }

        default:
            throw new Error('getFormItem: Not implemented');
    }
};

export const existFormItem = (item: FormItem, path: string = ''): boolean =>
    !!getFormItem(item, path);

export const setValue = <I extends FormItem = FormItem>(
    item: I,
    value: ValueOrFunc,
    path: string = ''
): I => <I>setValueInternal(item, value, path);

export const setGroupField = <I extends FormItem = FormItem>(
    item: I,
    path: string,
    formItem: ValueOrFunc<FormItem>
): I => <I>setGroupFieldInternal(item, path, formItem);
