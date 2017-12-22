import {
    assign,
    assignOrSame,
    objMapValues,
    ValueOrFunc,
    getAsValue
} from './common';
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
    FormError,
    ExtraFormInfo
} from './forms.interfaces';
import {
    checkPathInField,
    createGroupValue,
    createListingValue,
    getAllErrorsInternal,
    locateInGroupOrFail,
    locateInListingOrFail,
    setGroupFieldInternal,
    setValueInternal,
    updateListingFieldsInternal,
    updateFormInfoInternal
} from './forms.utils';
import { skip } from 'rxjs/operator/skip';

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
        info,
        coerce: coerceInit,
        validations: validatorInit
    } = assign(
        <FormFieldInit<T>>{
            caption: '',
            description: '',
            info: undefined,
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
        info,
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
        info,
        coerce: coerceInit,
        validations: validatorInit,
        initValue
    } = assign(
        <FormGroupInit<T>>{
            caption: '',
            description: '',
            info: undefined,
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
        info,
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
        info,
        coerce: coerceInit,
        validations: validatorInit,
        initValue
    } = assign(
        <FormListingInit<T>>{
            caption: '',
            description: '',
            info: undefined,
            coerce: undefined,
            validations: undefined,
            initValue: undefined
        },
        options
    );

    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const theFields = <F>(<any>fields.slice());
    const theInitValue = initValue || <T>createListingValue(theFields);

    const result: FormListing<T, F> = {
        // Type
        type: 'listing',

        // Config
        caption,
        description,
        info,
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
    pathToField: string = ''
): I => <I>setValueInternal(item, value, pathToField);

export const setValueDoNotTouch = <I extends FormItem = FormItem>(
    item: I,
    value: ValueOrFunc,
    pathToField: string = ''
): I =>
    <I>setValueInternal(item, value, pathToField, {
        affectDirty: false
    });

export const resetValue = <I extends FormItem = FormItem>(
    item: I,
    value: ValueOrFunc = undefined,
    pathToField: string = ''
): I =>
    <I>setValueInternal(item, value, pathToField, {
        initialization: true,
        compareValues: false,
    });

export const setGroupField = <I extends FormItem = FormItem>(
    item: I,
    pathToGroupField: string,
    formItem: ValueOrFunc<FormItem>
): I => <I>setGroupFieldInternal(item, pathToGroupField, formItem);

export const insertListingFields = <I extends FormItem = FormItem>(
    item: I,
    pathToListing: string,
    newFields: ValueOrFunc<FormItem | FormItem[]>,
    atPosition?: number
): I => {
    return <I>updateListingFieldsInternal(
        item,
        pathToListing,
        (fields: FormListingFields & Array<FormItem>) => {
            let theNewFields = getAsValue(newFields);
            if (!(theNewFields instanceof Array)) {
                theNewFields = [theNewFields];
            }
            if (typeof atPosition !== 'number' || atPosition >= fields.length) {
                return fields.concat(theNewFields);
            } else {
                const pos = atPosition < 0 ? 0 : atPosition;
                if (pos === 0) {
                    return theNewFields.concat(fields);
                } else {
                    return fields
                        .slice(0, pos)
                        .concat(theNewFields)
                        .concat(fields.slice(pos));
                }
            }
        }
    );
};

export const removeListingFields = <I extends FormItem = FormItem>(
    item: I,
    pathToListing: string,
    atPosition: number,
    count: number = 1
): I => {
    return <I>updateListingFieldsInternal(
        item,
        pathToListing,
        (fields: FormListingFields & Array<FormItem>) => {
            return fields
                .slice(0, atPosition)
                .concat(fields.slice(atPosition + count));
        }
    );
};

export const updateFormInfo = <I extends FormItem = FormItem>(
    item: I,
    pathToFormItem: string,
    updater: ValueOrFunc<Partial<ExtraFormInfo>>
): I => updateFormInfoInternal<I>(item, pathToFormItem, updater);

export const getAllErrors = (item: FormItem) => getAllErrorsInternal(item);
