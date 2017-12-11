import { flatMap } from 'lodash';
import { assignOrSame, id, objMapValues, toKVArray } from './common';
import { Coerce, coerceAll } from './coercion';
import { Validator, EasyValidator, mergeValidators } from './validation';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Interfaces                             //
//                                                            //
////////////////////////////////////////////////////////////////

export type SameValue<T> = (x: T, y: T) => boolean;

export interface FormPart<T> {
    caption: string;
    description: string;
    initValue: T;
    value: T;
    isDirty: boolean;
    isTouched: boolean;
    isValid: boolean;
    showError: boolean;
    errors: string[];
    validator: Validator<T>;
    coerce: Coerce<T>;
    sameValue: SameValue<T>;
}

export interface FormField<T> extends FormPart<T> {
    type: 'field';
}

export interface ValuesMapping {
    [name: string]: any;
}
export interface FormItemsMapping {
    [name: string]: FormItem<any>;
}

export interface FormGroup<T extends { [name: string]: any }>
    extends FormPart<T> {
    type: 'group';
    fields: Map<string, FormItem<any>>;
    construct: (values: ValuesMapping) => T;
    destruct: (values: T) => ValuesMapping;
}

export type ValuesListing = Array<any>;
export type FormItemsListing = Array<FormItem<any>>;

export interface FormList<T extends { [name: number]: any }>
    extends FormPart<T> {
    type: 'list';
    fields: Array<FormItem<any>>;
    construct: (values: ValuesListing) => T;
    destruct: (values: T) => ValuesListing;
}

export type FormItem<T> = FormField<T> | FormGroup<T> | FormList<T>;

export interface FormPartOptions<T> {
    caption: string;
    description: string;
    validators: EasyValidator<T>[] | EasyValidator<T>;
    coerce: Coerce<T>[] | Coerce<T>;
    sameValue: SameValue<T>;
}

export interface FormFieldOptions<T> extends FormPartOptions<T> {}

export interface FormGroupOptions<T> extends FormPartOptions<T> {
    initValue: T;
    construct: (values: ValuesMapping) => T;
    destruct: (values: T) => ValuesMapping;
}

export interface FormListOptions<T> extends FormPartOptions<T> {
    initValue: T;
    // fields: FormItemsListing;
    construct: (values: ValuesListing) => T;
    destruct: (values: T) => ValuesListing;
}

export const field = <T>(
    initValue: T,
    options?: Partial<FormFieldOptions<T>>
) => createField<T>(initValue, options);

export const group = <T>(
    fields: FormItemsMapping,
    options?: Partial<FormGroupOptions<T>>
) => createGroup<T>(fields, options);

export const list = <T>(
    fields: FormItemsListing,
    options?: Partial<FormListOptions<T>>
) => createList<T>(fields, options);

////////////////////////////////////////////////////////////////
//                                                            //
//                     Implementation Details                 //
//                                                            //
////////////////////////////////////////////////////////////////

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

    if (opts.testEquality && item.sameValue(item.value, value)) {
        return item;
    }

    return assignOrSame(item, <any>{ value });
};

const updateGroupValue = <T>(
    item: FormGroup<T>,
    value: T,
    opts: SetValueOptions
) => {
    if (!value) {
        // Then assign value from children to parent
        const mappings: ValuesMapping = {};
        item.fields.forEach((child, key) => (mappings[key] = child.value));
        value = item.construct(mappings);
        const coercedValue = item.coerce(value);

        if (opts.testEquality && item.sameValue(item.value, coercedValue)) {
            return item;
        }

        return assignOrSame(item, <any>{ value: coercedValue });
    } else {
        // Then assign value from parent to children, and then back
        throw new Error('updateGroupValue: Not supported yet');
    }
};

const updateListValue = <T>(
    item: FormList<T>,
    value: T,
    opts: SetValueOptions
) => {
    if (!value) {
        // Then assign value from children to parent
        const mappings: ValuesListing = item.fields.map(child => child.value);
        value = item.construct(mappings);
        const coercedValue = item.coerce(value);

        if (opts.testEquality && item.sameValue(item.value, coercedValue)) {
            return item;
        }

        return assignOrSame(item, <any>{ value: coercedValue });
    } else {
        // Then assign value from parent to children, and then back
        throw new Error('updateListValue: Not supported yet');
    }
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
            throw new Error('Unknown form item: ' + (<any>(item || {})).type);
    }
    if (!opts.testEquality && result === item) {
        /* value didn't changed */
        return item;
    }

    result = updateValidation(result, opts);
    result = updateDirty(result, opts);
    result = updateShowError(result, opts);
    return result;
};

const defaultSameValue = <T>(x: T, y: T) => {
    return x === y;
};

const createField = <T>(
    initValue: T,
    options?: Partial<FormFieldOptions<T>>
): FormField<T> => {
    const opts = Object.assign(
        <FormFieldOptions<T>>{
            caption: '',
            description: '',
            validators: [],
            coerce: [],
            sameValue: defaultSameValue
        },
        options
    );

    const coerce = coerceAll(opts.coerce);
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
        coerce,
        sameValue: opts.sameValue
    };

    return <FormField<T>>setItemValue(aField, initValue, {
        testEquality: false,
        affectDirty: false,
        validate: true
    });
};

const defaultGroupConstruct = <T>(values: ValuesMapping): T =>
    <T>objMapValues(id)(values || {});

const defaultGroupDestruct = <T>(values: T): ValuesMapping =>
    objMapValues(id)(values || {});

const createGroup = <T>(
    fields: FormItemsMapping,
    options?: Partial<FormGroupOptions<T>>
): FormGroup<T> => {
    const opts = Object.assign(
        <FormGroupOptions<T>>{
            initValue: undefined,
            caption: '',
            description: '',
            validators: [],
            coerce: [],
            construct: defaultGroupConstruct,
            destruct: defaultGroupDestruct,
            sameValue: defaultSameValue
        },
        options
    );

    const coerce = coerceAll(opts.coerce);
    const validator = mergeValidators(opts.validators);
    const fieldsMap = new Map<string, FormItem<any>>(toKVArray(fields));

    const aGroup: FormGroup<T> = {
        type: 'group',
        caption: opts.caption,
        description: opts.description,
        value: opts.initValue,
        initValue: opts.initValue,
        fields: fieldsMap,
        validator,
        isDirty: false,
        isTouched: false,
        isValid: true,
        errors: [],
        showError: false,
        coerce,
        construct: opts.construct,
        destruct: opts.destruct,
        sameValue: opts.sameValue
    };

    return <FormGroup<T>>setItemValue(aGroup, opts.initValue, {
        testEquality: false,
        affectDirty: false,
        validate: true
    });
};

const defaultListConstruct = <T>(values: ValuesMapping): T =>
    <T>objMapValues(id)(values || {});

const defaultListDestruct = <T>(values: T): ValuesMapping =>
    objMapValues(id)(values || {});

const createList = <T>(
    fields: FormItemsListing,
    options?: Partial<FormListOptions<T>>
): FormList<T> => {
    const opts = Object.assign(
        <FormListOptions<T>>{
            initValue: undefined,
            caption: '',
            description: '',
            validators: [],
            coerce: [],
            construct: defaultListConstruct,
            destruct: defaultListDestruct,
            sameValue: defaultSameValue
        },
        options
    );

    const coerce = coerceAll(opts.coerce);
    const validator = mergeValidators(opts.validators);

    const aList: FormList<T> = {
        type: 'list',
        caption: opts.caption,
        description: opts.description,
        value: opts.initValue,
        initValue: opts.initValue,
        fields: fields,
        validator,
        isDirty: false,
        isTouched: false,
        isValid: true,
        errors: [],
        showError: false,
        coerce,
        construct: opts.construct,
        destruct: opts.destruct,
        sameValue: opts.sameValue
    };

    return <FormList<T>>setItemValue(aList, opts.initValue, {
        testEquality: false,
        affectDirty: false,
        validate: true
    });
};
