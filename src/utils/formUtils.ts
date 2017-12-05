import { flatMap } from 'lodash';
import { assignOrSame, id, errorToString } from './common';

export type Coerce<T> = (value: T) => T;

const mergeCoerceList = <T>(list: Coerce<T>[]): Coerce<T> => (value: T) =>
    list.reduce((v, c) => c(v), value);

export type EasyValidationResult = string | string[];

export type EasyValidator<T> = (value: T) => EasyValidationResult;

export type ValidationResult = string[];

export type Validator<T> = (value: T) => ValidationResult;

const emptyValidator = <T>(value: T) => [];

const makeValidator = <T>(val: EasyValidator<T>): Validator<T> => (
    value: T
) => {
    try {
        const result = val(value);
        if (result instanceof Array) {
            return result;
        } else {
            return [result];
        }
    } catch (error) {
        return [errorToString(error)];
    }
};

const mergeValidators = <T>(validators: EasyValidator<T>[]): Validator<T> => (
    value: T
) => flatMap(validators || [], v => makeValidator(v)(value));

export interface FormPart<T> {
    caption: string;
    description: string;
    value: T;
    isDirty: boolean;
    isTouched: boolean;
    isValid: boolean;
    showError: boolean;
    errors: string[];
    validator: Validator<T>;
    coerce: Coerce<T>;
}

export interface FormField<T> extends FormPart<T> {
    type: 'field';
    initValue: T;
}

export interface FormGroup<T extends { [name: string]: any }>
    extends FormPart<T> {
    type: 'group';
    fields: Map<string, FormItem<any>>;
}

export interface FormList<T extends { [name: number]: any }>
    extends FormPart<T> {
    type: 'list';
    fields: Array<FormItem<any>>;
}

export type FormItem<T> = FormField<T> | FormGroup<T> | FormList<T>;

export interface FormPartOptions<T> {
    caption: string;
    description: string;
    validators: EasyValidator<T>[];
    coerce: Coerce<T>[];
}

export interface FormFieldOptions<T> extends FormPartOptions<T> {}

// export type FormFieldOptions<T> = { type: 'field-options' } & Partial<
//     FormPartOptions<T>
// >;

// export type FormGroupOptions<T extends { [name: string]: any }> = { type: 'group-options' } & Partial<
//     FormPartOptions<T>
// >;

// export type FormListOptions<T extends { [name: number]: any }> = { type: 'list-options' } & Partial<
//     FormPartOptions<T>
// >;

// export type FormItemOptions<T> =
//     FormFieldOptions<T> | FormGroupOptions<T> | FormListOptions<T>;

interface SetValueOptions {
    testEquality: boolean;
    affectDirty: boolean;
    validate: boolean;
}

const getSetValueOptions = (
    options?: Partial<SetValueOptions>
): SetValueOptions =>
    Object.assign(
        <SetValueOptions>{
            testEquality: true,
            affectDirty: true,
            validate: true
        },
        options
    );

const updateShowError = <T, P extends FormItem<T>>(
    item: P,
    opts: SetValueOptions
): P =>
    assignOrSame(item, <any>{
        showError: !item.isValid && item.isTouched
    });

const updateDirty = <T, P extends FormItem<T>>(
    item: P,
    opts: SetValueOptions
): P => {
    if (opts.affectDirty) {
        return assignOrSame(item, <any>{
            isDirty: true,
            isTouched: true
        });
    }
    return item;
};

const updateValidation = <T, P extends FormItem<T>>(
    item: P,
    opts: SetValueOptions
): P => {
    if (opts.validate) {
        const errors = item.validator(item.value);
        const isValid = errors.length === 0;
        return assignOrSame(item, <any>{ errors, isValid });
    }
    return item;
};

const updateFieldValue = <T>(
    item: FormField<T>,
    value: T,
    opts: SetValueOptions
) => {
    value = item.coerce(value);

    if (opts.testEquality && item.value === value) {
        return item;
    }

    return assignOrSame(item, <any>{ value });
};

const updateGroupValue = <T>(
    item: FormGroup<T>,
    value: T,
    opts: SetValueOptions
) => {
    throw new Error("updateGroupValue: Not supported yet");
};

const updateListValue = <T>(
    item: FormList<T>,
    value: T,
    opts: SetValueOptions
) => {
    throw new Error("updateGroupValue: Not supported yet");
};

const setItemValue = <T>(
    item: FormItem<T>,
    value: T,
    options?: Partial<SetValueOptions>
): typeof item => {
    const opts = getSetValueOptions(options);

    let result: FormItem<T> = null;
    switch (item.type) {
        case 'field':
            result = updateFieldValue(item, value, opts);
            break;

        case 'group':
            result = updateGroupValue(item, value, opts);
            break;

        case 'list':
            result = updateListValue(item, value, opts);
            break;

        default:
            throw new Error('Unknown form item: ' + item.type);
    }
    if (result === item) { /* value didn't changed */
        return item;
    }

    result = updateValidation(result, opts);
    result = updateDirty(result, opts);
    result = updateShowError(result, opts);
    return item;
};

export const field = <T>(
    initValue: T,
    options?: FormFieldOptions<T>
): FormField<T> => {
    const opts = Object.assign(
        <FormFieldOptions<T>>{
            caption: '',
            description: '',
            validators: [],
            coerce: []
        },
        options
    );

    const coerce = mergeCoerceList(opts.coerce);
    const validator = mergeValidators(opts.validators);

    const aField: FormField<T> = {
        type: 'field',
        caption: opts.caption,
        description: opts.description,
        value: initValue,
        initValue,
        validator,
        isDirty: false,
        isTouched: false,
        isValid: true,
        errors: [],
        showError: false,
        coerce
    };

    return <FormField<T>>setItemValue(aField, initValue, {
        testEquality: false,
        affectDirty: false,
        validate: true
    });
};
