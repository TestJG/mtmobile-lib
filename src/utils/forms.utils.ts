import { flatMap } from 'lodash';
import {
    assign,
    assignOrSame,
    assignIf,
    assignIfMany,
    id,
    objMapValues,
    toKVArray,
    deepEqual,
    shallowEqual,
    assignOrSameWith,
    joinStr,
    getAsValue,
    ValueOrFunc
} from './common';
import { Coerce, coerceAll } from './coercion';
import { Validator, EasyValidator, mergeValidators } from './validation';
import {
    FormFieldInit,
    FormField,
    FormGroupInit,
    FormGroup,
    FormGroupFields,
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

export const checkPathInField = (path: string) => {
    if (!!path) {
        throw new Error(
            `Unexpected path accessing this field: ${JSON.stringify(path)}`
        );
    }
};

////////////////////////////////////////////////////////////////
//                                                            //
//                     Field Manipulation                     //
//                                                            //
////////////////////////////////////////////////////////////////

export const locateInGroupOrFail = (
    item: FormGroup,
    path: string,
    failIfNoChild: boolean = true
) => {
    const match = matchGroupPath(path);
    if (!match) {
        throw new Error(
            `Unexpected path accessing this group: ${JSON.stringify(path)}`
        );
    }

    const child = item.fields[match.step];
    if (!child && failIfNoChild) {
        throw new Error(
            `Unexpected field name accessing this group: ${JSON.stringify(
                match.step
            )}`
        );
    }
    return <[string, FormItem, string]>[match.step, child, match.rest];
};

const checkGroupValue = (value: any) => {
    if (
        typeof value !== 'object' ||
        !(value instanceof Object) ||
        value.constructor !== Object
    ) {
        throw new Error('Group value must be a plain JS object.');
    }
};

const validateGroupValue = (value: any, fields: FormGroupFields) => {
    checkGroupValue(value);
    const valueNames = Object.keys(value).sort();
    const fieldNames = Object.keys(fields).sort();
    if (valueNames.length === fieldNames.length) {
        if (fieldNames.every((fn, i) => fn === valueNames[i])) {
            return;
        }
    }
    throw new Error(
        `A group value must have the same names than the group fields. ` +
            `Expected fields ${JSON.stringify(
                fieldNames
            )} but got value names ${JSON.stringify(valueNames)}`
    );
};

export const createGroupValue = (fields: FormGroupFields): any => {
    return objMapValues((f: FormItem) => f.value)(fields);
};

export const createGroupInitValue = (fields: FormGroupFields): any => {
    return objMapValues((f: FormItem) => f.initValue)(fields);
};

export interface SetValueOptions {
    affectDirty: boolean;
    compareValues: boolean;
    initialization: boolean;
}

const updateGroupFields = (
    value: any,
    fields: FormGroupFields,
    opts: SetValueOptions
) =>
    Object.keys(fields).reduce(
        (fs, key) =>
            assignOrSame(fs, {
                [key]: setValueInternal(fs[key], value[key], '', opts)
            }),
        fields
    );

const setFieldValueInternal = (
    item: FormItem,
    value: ValueOrFunc,
    opts: SetValueOptions
): FormItem => {
    const theValue = getAsValue(value, item.value);
    const newValue = item.coerce(theValue);
    const sameValue = opts.compareValues && item.value === newValue;
    if (sameValue && theValue === item.value) {
        return item;
    }

    const initValue = opts.initialization ? newValue : item.initValue;
    const errors = item.validator(newValue);
    const isDirty = item.isDirty || (opts.affectDirty ? !sameValue : false);
    const isTouched = isDirty || item.isTouched;

    // Derived
    const isValid = errors.length === 0;
    const showErrors = !isValid && isTouched;

    const newItem = assignOrSame(item, {
        initValue,
        value: newValue,
        isDirty,
        isTouched,
        errors,
        isValid,
        showErrors
    });

    return newItem;
};

const createNewGroupFieldsFromDirectValue = (
    item: FormGroup,
    value: ValueOrFunc,
    opts: SetValueOptions
): FormGroupFields => {
    // If path is empty, the assignment is directed to this group
    const theValue = getAsValue(value, item.value);

    validateGroupValue(theValue, item.fields);
    const newValue = item.coerce(theValue);
    validateGroupValue(newValue, item.fields);

    const sameValue = opts.compareValues && deepEqual(item.value, newValue);
    if (sameValue && deepEqual(theValue, item.value)) {
        return null;
    }

    // compute the new fields object, assigning values to the
    // group's children
    return updateGroupFields(newValue, item.fields, opts);
};

const createNewGroupFieldsFromChildValue = (
    item: FormGroup,
    value: ValueOrFunc,
    path: string,
    opts: SetValueOptions
): FormGroupFields => {
    const [name, child, restOfPath] = locateInGroupOrFail(item, path);
    const newChild = setValueInternal(child, value, restOfPath, opts);
    return assignOrSame(item.fields, { [name]: newChild });
};

const updateFinalGroupFields = (item: FormGroup) => {
    const computedValue = createGroupValue(item.fields);
    const computedInitValue = createGroupInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = Object.keys(item.fields).some(k => item.fields[k].isDirty);
    const isTouched = Object.keys(item.fields).some(
        k => item.fields[k].isTouched
    );

    // Derived
    const isValid =
        errors.length === 0 &&
        Object.keys(item.fields).every(k => item.fields[k].isValid);
    const showErrors = !isValid && isTouched;

    return assignOrSame(item, {
        // Config
        initValue: computedInitValue,

        // State
        value: computedValue,
        errors,
        isDirty,
        isTouched,

        // Derived
        isValid,
        showErrors
    });
};

const setValueInternalRec = (
    item: FormItem,
    value: ValueOrFunc,
    path: string,
    opts: SetValueOptions
): FormItem => {
    switch (item.type) {
        case 'field': {
            checkPathInField(path);

            return setFieldValueInternal(item, value, opts);
        }

        case 'group': {
            const newFields = !path
                ? createNewGroupFieldsFromDirectValue(item, value, opts)
                : createNewGroupFieldsFromChildValue(item, value, path, opts);
            if (newFields === null) {
                return item;
            }

            // If none of the group's children changed after the assignment,
            // then, and only then can the group evaluate the rest of it's
            // state. Much care must be taken to avoid a stack overflow.
            // Later some protection must be added to prevent an infinite
            // loop.
            if (newFields === item.fields) {
                return updateFinalGroupFields(item);
            } else {
                const computedValue = createGroupValue(newFields);
                return setValueInternal(
                    assignOrSame(item, {
                        fields: newFields
                    }),
                    computedValue,
                    '',
                    assign(opts, { compareValues: true })
                );
            }
        }

        default:
            throw new Error('setValueInternal: Not implemented');
    }
};

export const setValueInternal = (
    item: FormItem,
    value: ValueOrFunc,
    path: string,
    options?: Partial<SetValueOptions>
): FormItem => {
    const opts: SetValueOptions = Object.assign(
        <SetValueOptions>{
            affectDirty: true,
            compareValues: true,
            initialization: false,
        },
        options
    );

    return setValueInternalRec(item, value, path, opts);
};

const setGroupFieldInternalRec = (
    item: FormItem,
    path: string,
    formItem: ValueOrFunc<FormItem>,
    opts: SetValueOptions
): FormItem => {
    switch (item.type) {
        case 'field': {
            throw new Error(
                `Cannot reach a group with given path: ${JSON.stringify(path)}`
            );
        }

        case 'group': {
            if (!path) {
                throw new Error(
                    `Unexpected end of path. A field name is missing.`
                );
            }

            const [name, child, restOfPath] = locateInGroupOrFail(
                item,
                path,
                false
            );

            let newField: FormItem = null;
            if (!restOfPath) {
                newField = getAsValue(formItem);
            } else if (!child) {
                if (!path) {
                    throw new Error(
                        `Unexpected end of descendants. A field named ${JSON.stringify(
                            name
                        )} is missing looking for path ${JSON.stringify(path)}.`
                    );
                }
            } else {
                newField = setGroupFieldInternalRec(
                    child,
                    restOfPath,
                    formItem,
                    opts
                );
            }

            let newFields: FormGroupFields = null;
            if (newField && newField !== child) {
                // If newField is not null and not the same as previous
                // child, then set [name] to newField
                newFields = assignOrSame(item.fields, { [name]: newField });
            } else if (!newField && child) {
                // If newField is null and there was a previous child,
                // then remove child from fields
                newFields = Object.keys(item.fields)
                    .filter(key => key !== name)
                    .reduce(
                        (fs, key) => Object.assign(fs, { [key]: newField }),
                        {}
                    );
            }

            if (newFields === null) {
                return item;
            }

            // If none of the group's children changed after the assignment,
            // then, and only then can the group evaluate the rest of it's
            // state. Much care must be taken to avoid a stack overflow.
            // Later some protection must be added to prevent an infinite
            // loop.
            if (newFields === item.fields) {
                return updateFinalGroupFields(item);
            } else {
                const computedValue = createGroupValue(newFields);
                return setValueInternal(
                    assignOrSame(item, {
                        fields: newFields
                    }),
                    computedValue,
                    '',
                    assign(opts, { compareValues: true, initialization: true })
                );
            }
        }

        default:
            throw new Error('setValueInternal: Not implemented');
    }
};

export const setGroupFieldInternal = (
    item: FormItem,
    path: string,
    formItem: ValueOrFunc<FormItem>,
    options?: Partial<SetValueOptions>
): FormItem => {
    const opts: SetValueOptions = Object.assign(
        <SetValueOptions>{
            affectDirty: true,
            compareValues: true,
            initialization: false,
        },
        options
    );

    return setGroupFieldInternalRec(item, path, formItem, opts);
};
