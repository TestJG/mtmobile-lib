import { assign, assignOrSame, objMapValues, ValueOrFunc } from './common';
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
    FormGroupFields,
    FormListingInit,
    FormListing,
    FormListingState,
    FormListingFields,
    FormError
} from './forms.interfaces';
import {
    checkPathInField,
    setValueInternal,
    matchGroupPath,
    matchListingPath,
    locateInGroupOrFail,
    createGroupValue,
    setGroupFieldInternal,
    getAllErrorsInternal,
    createListingValue,
    locateInListingOrFail
} from './forms.utils';

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
        initialization: true
    });
};

export const group = <T = any, F extends FormGroupFields = FormGroupFields>(
    fields: F,
    options?: Partial<FormGroupInit<T>>
): FormGroup<T, F> => {
    if (!(fields instanceof Object) || fields.constructor !== Object) {
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
        initialization: true
    });
};

export const listing = <
    T = any,
    F extends FormListingFields = FormListingFields
>(
    fields: F,
    options?: Partial<FormListingInit<T>>
): FormListing<T, F> => {
    if (!(fields instanceof Array)) {
        throw new Error('Listing fields must be a plain JS Array.');
    }

    const {
        caption,
        description,
        coerce: coerceInit,
        validations: validatorInit,
        initValue
    } = assign(
        <FormListingInit<T>>{
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
    const theFields = <F><any>fields.slice();
    const theInitValue = initValue || <T>createListingValue(theFields);

    const result: FormListing<T, F> = {
        // Type
        type: 'listing',

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

    return <FormListing<T, F>>setValueInternal(result, theInitValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Form Item Manipulations                //
//                                                            //
////////////////////////////////////////////////////////////////

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

        case 'listing': {
            if (!path) {
                return item;
            }

            const [_, child, restOfPath] = locateInListingOrFail(item, path);
            return getFormItem(child, restOfPath);
        }

        default:
            throw new Error('getFormItem: Not implemented');
    }
};

export const getValue = (item: FormItem, path: string = ''): any => {
    const child = getFormItem(item, path);
    if (!child) {
        return undefined;
    }
    return child.value;
};

export const existFormItem = (item: FormItem, path: string): boolean => {
    try {
        return !!getFormItem(item, path);
    } catch (error) {
        return false;
    }
};

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

export const getAllErrors = (item: FormItem) => getAllErrorsInternal(item);
