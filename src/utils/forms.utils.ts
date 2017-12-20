import * as _ from 'lodash';
import { deepEqual, shallowEqual, shallowEqualStrict } from './equality';
import {
    assign,
    assignOrSame,
    assignArrayOrSame,
    assignIf,
    assignIfMany,
    id,
    objMapValues,
    toKVArray,
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
    FormListingInit,
    FormListing,
    FormListingFields,
    FormItem,
    FormItemState,
    FormError,
    ExtraFormInfo
} from './forms.interfaces';
import { FormListingFieldStates } from '../../index';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Path Utilities                         //
//                                                            //
////////////////////////////////////////////////////////////////
export type PathStep = string | number;

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

export const appendGroupPath = (groupPath: string, fieldName: string) =>
    joinStr('.', [groupPath, fieldName]);

export const appendListingPath = (listingPath: string, childIndex: number) =>
    joinStr('', [listingPath, `[${childIndex}]`]);

export const createPath = (steps: PathStep[]) =>
    steps.reduce<string>(
        (path, step) =>
            typeof step === 'number'
                ? appendListingPath(path, step)
                : appendGroupPath(path, step),
        ''
    );

export const createPathOf = (...steps: PathStep[]) => createPath(steps);

export const extractPath = (path: string): PathStep[] => {
    const arr: PathStep[] = [];
    while (path !== '') {
        const match = matchListingPath(path) || matchGroupPath(path);
        if (match === null) {
            throw new Error('Invalid form path: ' + JSON.stringify(path));
        }
        arr.push(match.step);
        path = match.rest;
    }
    return arr;
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

export const locateInListingOrFail = (
    item: FormListing,
    path: string,
    failIfNoChild: boolean = true
) => {
    const match = matchListingPath(path);
    if (!match) {
        throw new Error(
            `Unexpected path accessing this listing: ${JSON.stringify(path)}`
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
    return <[number, FormItem, string]>[match.step, child, match.rest];
};

const checkGroupValue = (value: any) => {
    if (!(value instanceof Object) || value.constructor !== Object) {
        throw new Error('Group value must be a plain JS object.');
    }
};

const checkListingValue = (value: any) => {
    if (!(value instanceof Array)) {
        throw new Error('Listing value must be a plain JS array.');
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

const validateListingValue = (value: any, fields: FormListingFields) => {
    checkListingValue(value);
    const valueArr = <any[]>value;
    const fieldsArr = <FormItem[]>fields;
    if (valueArr.length !== fieldsArr.length) {
        throw new Error(
            `A listing value must have the same length than the listing fields. ` +
                `Expected fields length ${JSON.stringify(
                    fieldsArr.length
                )} but got values length ${JSON.stringify(valueArr.length)}`
        );
    }
};

export const createGroupValue = (fields: FormGroupFields): any =>
    objMapValues((f: FormItem) => f.value)(fields);

export const createGroupInitValue = (fields: FormGroupFields): any =>
    objMapValues((f: FormItem) => f.initValue)(fields);

export const createListingValue = (fields: FormListingFields): any =>
    (<FormItem[]>fields).map(f => f.value);

export const createListingInitValue = (fields: FormListingFields): any =>
    (<FormItem[]>fields).map(f => f.initValue);

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

const updateListingFields = (
    value: any,
    fields: FormListingFields,
    opts: SetValueOptions
) =>
    assignArrayOrSame(<FormItem[]>fields, [
        0,
        (<FormItem[]>fields).map((f, index) =>
            setValueInternal(f, value[index], '', opts)
        )
    ]);

const setFieldValueInternal = (
    item: FormItem,
    value: ValueOrFunc,
    opts: SetValueOptions
): FormItem => {
    const theValue = getAsValue(value || item.initValue, item.value);
    const newValue = item.coerce(theValue);
    const sameValue = opts.compareValues && item.value === newValue;
    if (sameValue && theValue === item.value) {
        return item;
    }

    const initValue = opts.initialization ? newValue : item.initValue;
    const errors = item.validator(newValue);
    const isDirty = opts.initialization
        ? false
        : item.isDirty || (opts.affectDirty ? !sameValue : false);
    const isTouched = opts.initialization ? false : isDirty || item.isTouched;

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
    const theValue = getAsValue(value || item.initValue, item.value);

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

const createNewListingFieldsFromDirectValue = (
    item: FormListing,
    value: ValueOrFunc,
    opts: SetValueOptions
): FormListingFields => {
    // If path is empty, the assignment is directed to this group
    const theValue = getAsValue(value || item.initValue, item.value);

    validateListingValue(theValue, item.fields);
    const newValue = item.coerce(theValue);
    validateListingValue(newValue, item.fields);

    const sameValue = opts.compareValues && deepEqual(item.value, newValue);
    if (sameValue && deepEqual(theValue, item.value)) {
        return null;
    }

    // compute the new fields array, assigning values to the
    // listing's children
    return updateListingFields(newValue, item.fields, opts);
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

const createNewListingFieldsFromChildValue = (
    item: FormListing,
    value: ValueOrFunc,
    path: string,
    opts: SetValueOptions
): FormListingFields => {
    const [index, child, restOfPath] = locateInListingOrFail(item, path);
    const newChild = setValueInternal(child, value, restOfPath, opts);
    return assignArrayOrSame(<FormItem[]>item.fields, [index, [newChild]]);
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

const updateFinalListingFields = (item: FormListing) => {
    const computedValue = createListingValue(item.fields);
    const computedInitValue = createListingInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = (<FormItem[]>item.fields).some(f => f.isDirty);
    const isTouched = (<FormItem[]>item.fields).some(f => f.isTouched);

    // Derived
    const isValid =
        errors.length === 0 && (<FormItem[]>item.fields).every(f => f.isValid);
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

const updateGroupFieldsAux = (
    item: FormGroup,
    newFields: FormGroupFields,
    opts: SetValueOptions
) => {
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
            assign(opts, {
                compareValues: true,
                initialization: true
            })
        );
    }
};

const updateListingFieldsAux = (
    item: FormListing,
    newFields: FormListingFields,
    opts: SetValueOptions
) => {
    if (newFields === null) {
        return item;
    }

    // If none of the listings' children changed after the assignment,
    // then, and only then can the listing evaluate the rest of it's
    // state. Much care must be taken to avoid a stack overflow.
    // Later some protection must be added to prevent an infinite
    // loop.
    if (newFields === item.fields) {
        return updateFinalListingFields(item);
    } else {
        const computedValue = createListingValue(newFields);
        return setValueInternal(
            assignOrSame(item, {
                fields: newFields
            }),
            computedValue,
            '',
            assign(opts, {
                compareValues: true,
                initialization: true
            })
        );
    }
};

const updateFormItemInternalRec = (
    item: FormItem,
    path: PathStep[],
    updater: ValueOrFunc<FormItem>,
    opts: SetValueOptions
): FormItem => {
    if (path.length === 0) {
        const newItem = getAsValue(updater, item);
        if (!newItem || shallowEqualStrict(newItem, item)) {
            return item;
        }
        return newItem;
    } else {
        switch (item.type) {
            case 'field': {
                throw new Error(
                    'Unexpected path accessing this field: ' +
                        JSON.stringify(createPath(path))
                );
            }

            case 'group': {
                const name = path[0];
                if (typeof name !== 'string') {
                    throw new Error(
                        'Unexpected path accessing this group: ' +
                            JSON.stringify(createPath(path))
                    );
                }

                const restOfPath = path.slice(1);
                const child = item.fields[name];
                if (!child) {
                    throw new Error(
                        `Unexpected field name accessing this group: ` +
                            JSON.stringify(name)
                    );
                }

                const newField = updateFormItemInternalRec(
                    child,
                    restOfPath,
                    updater,
                    opts
                );

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

                return updateGroupFieldsAux(item, newFields, opts);
            }

            case 'listing': {
                const index = path[0];
                if (typeof index !== 'number') {
                    throw new Error(
                        'Unexpected path accessing this listing: ' +
                            JSON.stringify(createPath(path))
                    );
                }

                const restOfPath = path.slice(1);
                const child = item.fields[index];
                if (!child) {
                    throw new Error(
                        `Unexpected field index accessing this listing: ` +
                            JSON.stringify(index)
                    );
                }

                const newField = updateFormItemInternalRec(
                    child,
                    restOfPath,
                    updater,
                    opts
                );

                let newFields: FormListingFields = null;
                if (newField) {
                    // If newField is not null and not the same as previous
                    // child, then set [name] to newField
                    newFields = assignArrayOrSame(<FormItem[]>item.fields, [
                        index,
                        [newField]
                    ]);
                } else if (!newField) {
                    // If newField is null and there was a previous child,
                    // then remove child from fields
                    newFields = (<FormItem[]>item.fields)
                        .slice(0, index)
                        .concat((<FormItem[]>item.fields).slice(index + 1));
                }

                return updateListingFieldsAux(item, newFields, opts);
            }

            default:
                break;
        }
    }
};

const setValueUpdater = (value: ValueOrFunc, opts: SetValueOptions) => (
    item: FormItem
): FormItem => {
    switch (item.type) {
        case 'field':
            return setFieldValueInternal(item, value, opts);

        case 'group': {
            return updateGroupFieldsAux(
                item,
                createNewGroupFieldsFromDirectValue(item, value, opts),
                opts
            );
        }

        case 'listing': {
            return updateListingFieldsAux(
                item,
                createNewListingFieldsFromDirectValue(item, value, opts),
                opts
            );
        }

        default:
            throw new Error(
                'Unknown form item type: ' + JSON.stringify((<any>item).type)
            );
    }
};

export function setValueInternal(
    item: FormItem,
    value: ValueOrFunc,
    path: string,
    options?: Partial<SetValueOptions>
): FormItem {
    const opts: SetValueOptions = Object.assign(
        <SetValueOptions>{
            affectDirty: true,
            compareValues: true,
            initialization: false
        },
        options
    );

    return updateFormItemInternalRec(
        item,
        extractPath(path),
        setValueUpdater(value, opts),
        opts
    );
}

const setGroupFieldUpdater = (
    fieldName: string,
    formItem: ValueOrFunc<FormItem>,
    opts: SetValueOptions
) => (item: FormItem): FormItem => {
    switch (item.type) {
        case 'field':
            throw new Error('Expected to find a group but found a field');

        case 'group': {
            const child = item.fields[fieldName];
            const newField = getAsValue(formItem, child);
            let newFields: FormGroupFields = null;
            if (newField && newField !== child) {
                // If newField is not null and not the same as previous
                // child, then set [fieldName] to newField
                newFields = assignOrSame(item.fields, {
                    [fieldName]: newField
                });
            } else if (!newField && child) {
                // If newField is null and there was a previous child,
                // then remove child from fields
                newFields = Object.keys(item.fields)
                    .filter(key => key !== fieldName)
                    .reduce(
                        (fs, key) => Object.assign(fs, { [key]: newField }),
                        {}
                    );
            }
            return updateGroupFieldsAux(item, newFields, opts);
        }

        case 'listing':
            throw new Error('Expected to find a group but found a listing');

        default:
            throw new Error(
                'Unknown form item type: ' + JSON.stringify((<any>item).type)
            );
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
            initialization: false
        },
        options
    );

    let newPath = extractPath(path);
    const fieldName =
        newPath.length >= 1 ? newPath[newPath.length - 1] : undefined;
    if (typeof fieldName !== 'string') {
        throw new Error(
            'Missing field name at the end of path: ' + JSON.stringify(path)
        );
    }
    newPath = newPath.slice(0, newPath.length - 1);

    return updateFormItemInternalRec(
        item,
        newPath,
        setGroupFieldUpdater(fieldName, formItem, opts),
        opts
    );
};

const updateListingFieldsUpdater = (
    fields: ValueOrFunc<FormListingFields & Array<FormItem>>,
    opts: SetValueOptions
) => (item: FormItem): FormItem => {
    switch (item.type) {
        case 'field':
            throw new Error('Expected to find a group but found a field');

        case 'listing': {
            const newFields = getAsValue(fields, item.fields);
            return updateListingFieldsAux(item, newFields, opts);
        }

        case 'group':
            throw new Error('Expected to find a listing but found a group');

        default:
            throw new Error(
                'Unknown form item type: ' + JSON.stringify((<any>item).type)
            );
    }
};

export const updateListingFieldsInternal = (
    item: FormItem,
    path: string,
    fields: ValueOrFunc<FormListingFields & Array<FormItem>>,
    options?: Partial<SetValueOptions>
): FormItem => {
    const opts: SetValueOptions = Object.assign(
        <SetValueOptions>{
            affectDirty: true,
            compareValues: true,
            initialization: false
        },
        options
    );

    return updateFormItemInternalRec(
        item,
        extractPath(path),
        updateListingFieldsUpdater(fields, opts),
        opts
    );
};

export const getAllErrorsInternalRec = (
    item: FormItem,
    path: string
): FormError[] => {
    const currentErrors = !item.errors.length
        ? []
        : [<FormError>{ path, item, errors: item.errors }];
    switch (item.type) {
        case 'field': {
            return currentErrors;
        }

        case 'group': {
            const fieldErrors = _.flatMap(Object.keys(item.fields), key =>
                getAllErrorsInternalRec(
                    item.fields[key],
                    appendGroupPath(path, key)
                )
            );
            return currentErrors.concat(fieldErrors);
        }

        case 'listing': {
            const fieldErrors = _.flatMap(item.fields, (field, index) =>
                getAllErrorsInternalRec(field, appendListingPath(path, index))
            );
            return currentErrors.concat(fieldErrors);
        }
    }
};

export const updateFormInfoInternal = <I extends FormItem = FormItem>(
    item: I,
    pathToFormItem: string,
    updater: ValueOrFunc<Partial<ExtraFormInfo>>
): I => {
    return <I>updateFormItemInternalRec(
        item,
        extractPath(pathToFormItem),
        (formItem: FormItem) => {
            const newInfo = getAsValue(updater, {
                caption: formItem.caption,
                description: formItem.description,
                info: formItem.info,
            });
            return assignIfMany(
                formItem,
                [newInfo.caption !== undefined, { caption: newInfo.caption }],
                [
                    newInfo.description !== undefined,
                    { description: newInfo.description }
                ],
                [newInfo.info !== undefined, { info: newInfo.info }]
            );
        },
        { affectDirty: false, initialization: false, compareValues: false });
};

export const getAllErrorsInternal = (item: FormItem) =>
    getAllErrorsInternalRec(item, '');
