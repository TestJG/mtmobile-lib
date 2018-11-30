import {
    id,
    assign,
    assignOrSame,
    objMapValues,
    ValueOrFunc,
    getAsValue
} from './common';
import { coerceAll } from './coercion';
import { mergeValidators } from './validation';
import { getFormatterFor, getParserFor } from './parsing';
import {
    FormItem,
    FormFieldInit,
    FormField,
    FormGroupInit,
    FormGroup,
    FormGroupFields,
    FormListingInit,
    FormListing,
    FormListingFields,
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
    setInputInternal,
    setInfoInternal,
    updateListingFieldsInternal,
    updateFormInfoInternal
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
        info,
        coerce: coerceInit,
        validations: validatorInit,
        initInput,
        parser: parserInit,
        formatter: formatterInit,
        parserErrorText,
    } = assign(
        <FormFieldInit<T>>{
            caption: '',
            description: '',
            info: undefined,
            coerce: undefined,
            validations: undefined,
            initInput: null,
            parser: undefined,
            formatter: undefined,
            parserErrorText: undefined,
        },
        options
    );

    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const parser = parserInit || getParserFor(initValue);
    const formatter = formatterInit || getFormatterFor(initValue);

    const result: FormField<T> = {
        // Type
        type: 'field',

        // Config
        caption,
        description,
        info,
        initValue,
        initInput,
        coerce,
        validator,
        parser,
        formatter,
        parserErrorText,

        // State
        value: undefined,
        errors: [],
        isDirty: false,
        isTouched: false,
        input: initInput,
        validInput: undefined,
        isValidInput: true,

        // Derived
        isValid: true,
        showErrors: false
    };

    if (initInput !== null) {
        return <FormField<T>>setInputInternal(result, initInput, '', {
            affectDirty: false,
            compareValues: false,
            initialization: true
        });
    } else {
        return <FormField<T>>setValueInternal(result, initValue, '', {
            affectDirty: false,
            compareValues: false,
            initialization: true
        });
    }
};

export const group = <T = any>(
    fields: FormGroupFields<T>,
    options?: Partial<FormGroupInit<T>>
): FormGroup<T> => {
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
    const theFields = Object.assign({}, fields);
    const theInitValue = initValue || <T>createGroupValue(theFields);

    const result: FormGroup<T> = {
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

    return <FormGroup<T>>setValueInternal(result, theInitValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};

export const listing = <
    T extends any[] = any[]
>(
    fields: FormListingFields<T>,
    options?: Partial<FormListingInit<T>>
): FormListing<T> => {
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
    const theFields = fields.slice();
    const theInitValue = initValue || <T>createListingValue(theFields);

    const result: FormListing<T> = {
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

    return <FormListing<T>>setValueInternal(result, theInitValue, '', {
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

export const setInput = <I extends FormItem = FormItem>(
    item: I,
    input: ValueOrFunc,
    pathToField: string = ''
): I => <I>setInputInternal(item, input, pathToField);

export const setInputDoNotTouch = <I extends FormItem = FormItem>(
    item: I,
    input: ValueOrFunc,
    pathToField: string = ''
): I =>
    <I>setInputInternal(item, input, pathToField, {
        affectDirty: false
    });

export const resetValue = <I extends FormItem = FormItem>(
    item: I,
    pathToField: string = '',
    value: ValueOrFunc = undefined
): I =>
    <I>setValueInternal(item, value, pathToField, {
        initialization: true,
        compareValues: false
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
export const setInfo = <I extends FormItem = FormItem>(
    item: I,
    info: ValueOrFunc,
    pathToField: string = ''
): I => <I>setInfoInternal(item, info, pathToField);
