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

export interface FormField<T = any> extends FormPart<T> {
    type: 'field';
}

export interface ValuesMapping {
    [name: string]: any;
}
export interface FormItemsMapping {
    [name: string]: FormItem<any>;
}

export interface FormGroup<T extends { [name: string]: any } = any>
    extends FormPart<T> {
    type: 'group';
    fields: { [name: string]: FormItem };
    construct: (values: ValuesMapping) => T;
    destruct: (values: T) => ValuesMapping;
}

export type ValuesListing = Array<any>;
export type FormItemsListing = Array<FormItem<any>>;

export interface FormList<T extends { [name: number]: any } = any>
    extends FormPart<T> {
    type: 'list';
    fields: Array<FormItem<any>>;
    construct: (values: ValuesListing) => T;
    destruct: (values: T) => ValuesListing;
}

export type FormItem<T = any> = FormField<T> | FormGroup<T> | FormList<T>;

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

interface AssignmentRef {
    targetPath: string;
    target: FormItem;
    ancestors: FormItem[]; // last is the parent
}

interface ValueAssignmentRef extends AssignmentRef {
    newValue: any;
}

interface SetValueOptions {
    forceAssignment: boolean;
    affectDirty: boolean;
    validate: boolean;
    maxAssignmentsPerPath: number;
    maxTotalAssignments: number;
}

type SetValueMode = 'setValue' | 'setDirty' | 'setTouched' | 'validate';

interface SetValueContext {
    value: any;
    mode: SetValueMode;
    targetPath: string;
    currentPath: string;
    counters: Map<string, number>;
    opts: SetValueOptions;
}

const getSetValueOptions = (
    options?: Partial<SetValueOptions>
): SetValueOptions =>
    Object.assign(
        <SetValueOptions>{
            forceAssignment: false,
            affectDirty: true,
            validate: true,
            maxAssignmentsPerPath: 5,
            maxTotalAssignments: 1000
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
        const result = assignOrSame(item, <any>{ errors, isValid });
        return result;
    }
    return item;
};

const setFieldValue = <T>(
    item: FormField<T>,
    value: T,
    opts: SetValueOptions
) => {
    const coercedValue = item.coerce(value);

    if (!opts.forceAssignment && item.sameValue(item.value, coercedValue)) {
        return item;
    }

    return assignOrSame(item, <any>{ value: coercedValue });
};

const setGroupValue = <T>(
    item: FormGroup<T>,
    value: T,
    opts: SetValueOptions
) => {
    if (!value) {
        // Then assign value from children to parent
        const mappings: ValuesMapping = {};
        Object.keys(item.fields).forEach(
            key => (mappings[key] = mappings[key].value)
        );
        value = item.construct(mappings);
        const coercedValue = item.coerce(value);

        if (!opts.forceAssignment && item.sameValue(item.value, coercedValue)) {
            return item;
        }

        return assignOrSame(item, <any>{ value: coercedValue });
    } else {
        // Then assign value from parent to children, and then back
        throw new Error('updateGroupValue: Not supported yet');
    }
};

const setListValue = <T>(
    item: FormList<T>,
    value: T,
    opts: SetValueOptions
) => {
    if (!value) {
        // Then assign value from children to parent
        const mappings: ValuesListing = item.fields.map(child => child.value);
        value = item.construct(mappings);
        const coercedValue = item.coerce(value);

        if (!opts.forceAssignment && item.sameValue(item.value, coercedValue)) {
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
            result = setFieldValue(item, value, opts);
            break;

        case 'group':
            result = setGroupValue(item, value, opts);
            break;

        case 'list':
            result = setListValue(item, value, opts);
            break;

        default:
            throw new Error('Unknown form item: ' + (<any>(item || {})).type);
    }
    // if (!opts.testEquality && result === item) {
    //     /* value didn't changed */
    //     return item;
    // }

    result = updateValidation(result, opts);
    result = updateDirty(result, opts);
    result = updateShowError(result, opts);
    return result;
};

const TotalCountKey = 'TOTAL ASSIGNMENTS COUNT';

const setFormItemValueRec = (
    item: FormItem,
    ctx: SetValueContext
): FormItem => {
    const { value, targetPath, currentPath, counters, opts } = ctx;

    if (item.type === 'field') {
        return setFormFieldValue(item, ctx);
    } else if (item.type === 'group') {
        return setFormGroupValue(item, ctx);
    } else if (item.type === 'list') {
        return setFormListValue(item, ctx);
    }
};

const setFormFieldValue = (formField: FormField, ctx: SetValueContext) => {
    const { value, mode, targetPath, currentPath, counters, opts } = ctx;

    // If this value is not targeted to this field
    if (targetPath !== '') {
        throw new Error(
            `This field do not contains any children. Target path: ${JSON.stringify(
                targetPath
            )}`
        );
    }

    const flags = {
        setValue: mode === 'setValue',
        setDirty: mode === 'setDirty',
        setTouched: mode === 'setTouched',
        validate: mode === 'validate',
        setShowErrors: false
    };
    let newItem = formField;

    if (flags.setValue) {
        const coercedValue = newItem.coerce(value);
        const valueChanged =
            opts.forceAssignment ||
            !newItem.sameValue(newItem.value, coercedValue);
        if (valueChanged) {
            const result = assignOrSame(newItem, <any>{ value: coercedValue });
            if (result !== newItem) {
                flags.setDirty = true;
                flags.setTouched = true;
                flags.validate = true;
                flags.setShowErrors = true;
                newItem = result;
            }
        }
    }

    if (flags.setDirty) {
        const result = assignIf(newItem, opts.affectDirty, () => ({
            isDirty: true
        }));
        if (result !== newItem) {
            flags.setTouched = true;
            flags.setShowErrors = true;
            newItem = result;
        }
    }

    if (flags.setTouched) {
        const result = assignIf(newItem, opts.affectDirty, () => ({
            isTouched: true
        }));
        if (result !== newItem) {
            flags.setShowErrors = true;
            newItem = result;
        }
    }

    if (flags.setShowErrors) {
        const result = assignOrSame(newItem, <any>{
            showError: !newItem.isValid && newItem.isTouched
        });
        if (result !== newItem) {
            flags.setShowErrors = true;
            newItem = result;
        }
    }

    checkCountersFor(newItem, formField, ctx);

    return newItem;
};

const setFormGroupValue = (formGroup: FormGroup, ctx: SetValueContext) => {
    const { value, mode, targetPath, currentPath, counters, opts } = ctx;

    if (targetPath === '') {
        let newItem: FormGroup;

        switch (mode) {
            case 'setValue': {
                if (typeof value === 'undefined') {
                    const newValue = createGroupValue(formGroup);

                    const newCtx = assign(ctx, { value: newValue });

                    return setFormItemValueRec(formGroup, newCtx);
                } else {
                    const modifiedItem = <FormGroup>updateFormItemValue(ctx)(
                        formGroup
                    );
                    newItem =
                        opts.forceAssignment || modifiedItem !== formGroup
                            ? <FormGroup>[
                                  updateFormItemDirty(ctx),
                                  updateFormItemTouched(ctx),
                                  updateFormItemValidation(ctx),
                                  updateFormItemShowError
                              ].reduce((i, f) => f(i), formGroup)
                            : modifiedItem;
                }
                break;
            }

            case 'validate': {
                const modifiedItem = <FormGroup>updateFormItemValidation(ctx)(
                    formGroup
                );
                newItem =
                    modifiedItem !== formGroup
                        ? <FormGroup>updateFormItemShowError(formGroup)
                        : modifiedItem;
                break;
            }

            default:
                throw new Error(
                    `Cannot set directly ${mode} for group in path ${currentPath}`
                );
        }

        checkCountersFor(newItem, formGroup, ctx);

        return newItem;
    } else {
        // This update is targeted to a potential descendant of current group
        // Try to match a path like "childPath(...)"
        const match = targetPath.match(/^([^\[\.]+)(\.([^\.].*)|(\[.*)|())$/);
        if (!match) {
            throw new Error(
                `Invalid target path: ${JSON.stringify(
                    targetPath
                )} for a group. Expected a property access as first step.`
            );
        }

        const childName = match[1];
        const restPath = match[3] || match[4] || match[5];
        const child = formGroup.fields[childName];
        if (!child) {
            throw new Error(
                `Invalid target path: ${JSON.stringify(
                    targetPath
                )} for this group. Expected one of ${JSON.stringify(
                    Object.keys(formGroup.fields)
                )} but given ${JSON.stringify(childName)}.`
            );
        }

        const newChild = setFormItemValueRec(
            child,
            assign(ctx, {
                targetPath: restPath,
                currentPath: joinStr('.', [currentPath, childName])
            })
        );

        // If the child didn't change, then the group do not change either
        if (newChild === child) {
            return formGroup;
        }

        let newItem: FormGroup;

        switch (mode) {
            case 'setValue': {
                const newFormGroup = assign(formGroup, {
                    fields: assign(formGroup.fields, { [childName]: newChild })
                });

                const newCtx = assign(ctx, {
                    targetPath: '',
                    // undefined here means to reconstruct the group value from its fields
                    value: undefined,
                    // From now on do not force assignments
                    opts: assignOrSame(ctx.opts, { forceAssignment: false })
                });

                return setFormItemValueRec(newFormGroup, newCtx);
            }

            case 'setDirty': {
                const modifiedItem = <FormGroup>updateFormItemDirty(ctx)(
                    formGroup
                );
                newItem =
                    modifiedItem !== formGroup
                        ? <FormGroup>[
                              updateFormItemTouched(ctx),
                              updateFormItemShowError
                          ].reduce((i, f) => f(i), formGroup)
                        : modifiedItem;
                break;
            }

            case 'setTouched': {
                const modifiedItem = <FormGroup>updateFormItemTouched(ctx)(
                    formGroup
                );
                newItem =
                    modifiedItem !== formGroup
                        ? <FormGroup>updateFormItemShowError(formGroup)
                        : modifiedItem;
                break;
            }

            case 'validate': {
                const modifiedItem = <FormGroup>updateFormItemValidation(ctx)(
                    formGroup
                );
                newItem =
                    modifiedItem !== formGroup
                        ? <FormGroup>updateFormItemShowError(formGroup)
                        : modifiedItem;
                break;
            }
        }

        checkCountersFor(newItem, formGroup, ctx);

        return newItem;
    }
};

const setFormListValue = (
    formGroup: FormList,
    ctx: SetValueContext
): FormList => {
    const { value, mode, targetPath, currentPath, counters, opts } = ctx;

    throw new Error('setFormListValueAux: Not implemented');
};

const checkCountersFor = (
    newItem: FormItem,
    originalItem: FormItem,
    ctx: SetValueContext
) => {
    if (newItem !== originalItem) {
        const { currentPath, counters, opts } = ctx;
        // Test whether the total number of assignments has been exceeded
        checkCounters(ctx)(TotalCountKey, opts.maxTotalAssignments);
        // Test whether the number of assignments has been exceeded
        checkCounters(ctx)(currentPath, opts.maxAssignmentsPerPath);

        // The field has changed so count the assignment
        counters[TotalCountKey] = (counters[TotalCountKey] || 0) + 1;
        counters[currentPath] = (counters[currentPath] || 0) + 1;
    }
};

const updateFormItemValue = ({ value, opts }: SetValueContext) => (
    formItem: FormItem
): FormItem => {
    const coercedValue = formItem.coerce(value);
    // If the field considers the coerced value as the same as the value
    // already assigned to it, and we are testing for equality then the
    // field can be considered as not been changed at all
    if (
        !opts.forceAssignment &&
        formItem.sameValue(formItem.value, coercedValue)
    ) {
        return formItem;
    }

    return assignOrSameWith(shallowEqual, formItem, <any>{ value });
};

const updateFormItemDirty = ({ opts }: SetValueContext) => (
    formItem: FormItem
): FormItem => assignIf(formItem, opts.affectDirty, () => ({ isDirty: true }));

const updateFormItemTouched = ({ opts }: SetValueContext) => (
    formItem: FormItem
): FormItem =>
    assignIf(formItem, opts.affectDirty, () => ({ isTouched: true }));

const updateFormItemValidation = ({ opts }: SetValueContext) => (
    formItem: FormItem
): FormItem =>
    assignIf(formItem, opts.validate, () => {
        const errors = formItem.validator(formItem.value);
        const isValid = errors.length === 0;
        return { errors, isValid };
    });

const updateFormItemShowError = (formItem: FormItem): FormItem =>
    assignOrSame(formItem, <any>{
        showError: !formItem.isValid && formItem.isTouched
    });

const checkCounters = ({ counters }: SetValueContext) => (
    key: string,
    max: number
): void => {
    counters[key] = counters[key] || 0;
    if (counters[key] > max) {
        throw new Error(
            `The assignment operation is taking too long. More than ${max} different assignments has been made to path ${key}.`
        );
    }
};

const createGroupValue = <T>(formGroup: FormGroup<T>): T =>
    formGroup.construct(
        objMapValues((f: FormItem) => f.value)(formGroup.fields)
    );

const createListValue = <T>(formList: FormList<T>): T =>
    formList.construct(formList.fields.map(f => f.value));

const setFormItemValue = (
    item: FormItem,
    targetPath,
    value: any,
    mode: SetValueMode,
    options?: Partial<SetValueOptions>
): FormItem => {
    const opts = getSetValueOptions(options);

    return setFormItemValueRec(item, {
        value,
        mode,
        targetPath,
        currentPath: '',
        counters: new Map(),
        opts
    });
};

const defaultSameValue = shallowEqual;

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
        forceAssignment: true,
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
    const fieldsMap = Object.assign({}, fields);

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
        forceAssignment: true,
        affectDirty: false,
        validate: true
    });
};

const defaultListConstruct = <T>(values: ValuesMapping): T => values.map(id);

const defaultListDestruct = <T>(values: T): ValuesMapping =>
    (<any[]>(<any>values)).map(id);

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
        forceAssignment: true,
        affectDirty: false,
        validate: true
    });
};
