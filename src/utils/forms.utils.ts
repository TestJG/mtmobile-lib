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

export const locateInGroupOrFail = (item: FormGroup, path: string) => {
    const match = matchGroupPath(path);
    if (!match) {
        throw new Error(
            `Unexpected path accessing this group: ${JSON.stringify(path)}`
        );
    }

    const child = item.fields[match.step];
    if (!match) {
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

export interface SetValueOptions {
    affectDirty: boolean;
    compareValues: boolean;
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

export const setValueInternal = (
    item: FormItem,
    value: any,
    path: string,
    options?: Partial<SetValueOptions>
): FormItem => {
    const opts: SetValueOptions = Object.assign(
        <SetValueOptions>{
            affectDirty: true,
            compareValues: true
        },
        options
    );

    switch (item.type) {
        case 'field': {
            checkPathInField(path);

            // State
            const newValue = item.coerce(value);
            const sameValue = opts.compareValues && item.value === newValue;
            if (sameValue && value === item.value) {
                return item;
            }

            const errors = item.validator(newValue);
            const isDirty =
                item.isDirty || (opts.affectDirty ? !sameValue : false);
            const isTouched = isDirty || item.isTouched;

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

        case 'group': {
            if (!path) {
                // If path is empty, the assignment is directed to this group
                validateGroupValue(value, item.fields);
                const newValue = item.coerce(value);
                validateGroupValue(value, item.fields);

                const sameValue = opts.compareValues && item.value === newValue;
                if (sameValue && value === item.value) {
                    return item;
                }

                // compute the new fields object, assigning values to the
                // group's children
                const newFields = updateGroupFields(
                    newValue,
                    item.fields,
                    opts
                );

                const computedValue = createGroupValue(newFields);

                // If none of the group's children changed after the assignment,
                // then, and only then can the group evaluate the rest of it's
                // state. Much care must be taken to avoid a stack overflow.
                // Later some protection must be added to prevent an infinite
                // loop.
                if (newFields === item.fields) {
                    const errors = item.validator(computedValue);
                    const isDirty = Object.keys(newFields).some(
                        k => newFields[k].isDirty
                    );
                    const isTouched = Object.keys(newFields).some(
                        k => newFields[k].isTouched
                    );

                    // Derived
                    const isValid =
                        errors.length === 0 &&
                        Object.keys(newFields).every(
                            k => newFields[k].isValid
                        );
                    const showErrors = !isValid && isTouched;

                    return assignOrSame(item, {
                        // State
                        value: computedValue,
                        errors,
                        isDirty,
                        isTouched,

                        // Derived
                        isValid,
                        showErrors,

                        fields: newFields
                    });
                } else {
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

            const [name, child, restOfPath] = locateInGroupOrFail(item, path);
        }

        default:
            throw new Error('setValueInternal: Not implemented');
    }
};
