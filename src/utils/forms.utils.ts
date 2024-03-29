import type { ValueOrFunc } from './common';
import {
    assign,
    assignArrayOrSame,
    assignIfMany,
    assignOrSame,
    errorToString,
    getAsValue,
    joinStr,
    objMapValues
} from './common';
import { deepEqual, shallowEqualStrict, strictEqual } from './equality';
import type {
    ExtraFormInfo,
    FormError,
    FormField,
    FormGroup,
    FormGroupFields,
    FormItem,
    FormListing,
    FormListingFields,
    UpdateFormItemData
} from './forms.interfaces';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Path Utilities                         //
//                                                            //
////////////////////////////////////////////////////////////////
export type PathStep = string | number;

export const matchGroupPath = (
    path: string,
    allowPatterns: boolean = false
) => {
    const match = !allowPatterns
        ? path.match(/^([^\[\.*]+)(\.([^\.].*)|(\[.*)|())$/)
        : path.match(/^(\*|[^\[\.*]+)(\.([^\.].*)|(\[.*)|())$/);
    if (!match) {
        return null;
    }
    const step = match[1];
    const rest = match[3] || match[4] || match[5];
    return { step, rest };
};

export const matchListingPath = (
    path: string,
    allowPatterns: boolean = false
) => {
    const match = !allowPatterns
        ? path.match(/^\[([\d]+)\](\.([^\.].*)|(\[.*)|())$/)
        : path.match(/^\[(\*|[\d]+)\](\.([^\.].*)|(\[.*)|())$/);
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
    joinStr('', [listingPath, `[${isNaN(childIndex) ? '*' : childIndex}]`]);

export const createPath = (steps: PathStep[]) =>
    steps.reduce<string>(
        (path, step) =>
            typeof step === 'number'
                ? appendListingPath(path, step)
                : appendGroupPath(path, step),
        ''
    );

export const createPathOf = (...steps: PathStep[]) => createPath(steps);

export const extractPath = (
    path: string,
    allowPatterns: boolean = false
): PathStep[] => {
    const arr: PathStep[] = [];
    while (path !== '') {
        const match =
            matchListingPath(path, allowPatterns) ||
            matchGroupPath(path, allowPatterns);
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

export const locateInGroupOrFail = <T>(
    item: FormGroup<T>,
    path: string,
    failIfNoChild: boolean = true
) => {
    const match = <{ step: keyof T; rest: string }>matchGroupPath(path);
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
    return <[keyof T, FormItem<T[keyof T]>, string]>[
        match.step,
        child,
        match.rest
    ];
};

export const locateInListingOrFail = <T extends any[]>(
    item: FormListing<T>,
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
    return <[number, FormItem<T[0]>, string]>[match.step, child, match.rest];
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
            `A listing value must have the same length than` +
                ` the listing fields. Expected fields length ${JSON.stringify(
                    fieldsArr.length
                )} but got values length ${JSON.stringify(valueArr.length)}`
        );
    }
};

export const createGroupValue = (fields: FormGroupFields): any =>
    objMapValues((f: FormItem) => f.value)(fields);

export const createGroupInitValue = (fields: FormGroupFields): any =>
    objMapValues((f: FormItem) => f.initValue)(fields);

export const createListingValue = <T extends unknown[]>(
    fields: FormListingFields<T>
) => fields.map(f => f.value) as T;

export const createListingInitValue = <T extends unknown[]>(
    fields: FormListingFields<T>
) => fields.map(f => f.initValue) as T;

export interface SetValueOptions {
    affectDirty: boolean;
    compareValues: boolean;
    initialization: boolean;
}

const updateGroupFields = <T>(
    value: any,
    fields: FormGroupFields<T>,
    opts: SetValueOptions
) =>
    Object.keys(fields).reduce(
        (fs, key) =>
            assignOrSame(fs, <Partial<FormGroupFields<T>>>{
                [key]: setValueInternal(fs[key], value[key], '', opts)
            }),
        fields
    );

const updateListingFields = <T extends unknown[]>(
    value: T,
    fields: FormListingFields<T>,
    opts: SetValueOptions
) =>
    assignArrayOrSame(fields, [
        0,
        fields.map((f, index) => setValueInternal(f, value[index], '', opts))
    ]);

const setFieldFromNewValue = <T>(
    item: FormField<T>,
    // newValue: any,
    opts: SetValueOptions,
    sameValue: boolean
): FormField<T> => {
    const isDirty = opts.initialization
        ? false
        : item.isDirty || (opts.affectDirty ? !sameValue : false);
    const isTouched = opts.initialization ? false : isDirty || item.isTouched;

    // Derived
    const isValid = item.errors.length === 0;
    const showErrors = item.errors.length !== 0 && isTouched;

    const newItem = assignOrSame(item, {
        // value: newValue,
        isDirty,
        isTouched,
        isValid,
        showErrors
    });

    return newItem;
};

const setFieldInputInternal = <T>(
    item: FormField<T>,
    inputFunc: ValueOrFunc,
    opts: SetValueOptions,
    data: UpdateFormItemData
): FormField<T> => {
    const theInput =
        inputFunc === undefined
            ? item.initInput === null
                ? item.formatter(item.initValue)
                : item.initInput
            : getAsValue(inputFunc, item.value, data);
    try {
        const theValue = item.parser(theInput);
        const newValue = item.coerce(theValue);
        const initValue = opts.initialization ? newValue : item.initValue;
        const sameValue =
            opts.compareValues &&
            strictEqual(item.value, newValue) &&
            strictEqual(theInput, item.input);
        if (sameValue && strictEqual(theValue, item.value)) {
            return item;
        }
        const initInput = opts.initialization ? theInput : item.initInput;
        const input = theInput;
        const validInput = input;
        const isValidInput = true;
        const errors = item.validator(newValue);

        const result = setFieldFromNewValue(
            assignOrSame(item, {
                value: newValue,
                initValue,
                initInput,
                input,
                validInput,
                isValidInput,
                errors
            }),
            opts,
            sameValue
        );

        // log('RESULT AFTER SUCCESS', printObj(result));

        return result;
    } catch (error) {
        // const newValue = item.value;
        const initInput = opts.initialization ? theInput : item.initInput;
        const input = theInput;
        const isValidInput = false;
        const errors = [item.parserErrorText || errorToString(error)];

        const result = setFieldFromNewValue(
            assignOrSame(item, {
                errors,
                initInput,
                input,
                isValidInput,
                isTouched: true
            }),
            opts, // assign(opts, { compareValues: false }),
            false
        );

        // log('RESULT AFTER ERROR', printObj(result));

        return result;
    }
};

const setFieldValueInternal = <T>(
    item: FormField<T>,
    value: ValueOrFunc,
    opts: SetValueOptions,
    data: UpdateFormItemData
): FormField<T> => {
    const theValue =
        value === undefined
            ? item.initValue
            : getAsValue(value, item.value, data);
    const newValue = item.coerce(theValue);
    const sameValue = opts.compareValues && item.value === newValue;
    if (sameValue && theValue === item.value) {
        return item;
    }

    const initValue = opts.initialization ? newValue : item.initValue;
    const input = item.formatter(newValue);
    const validInput = input;
    const isValidInput = true;
    const errors = item.validator(newValue);

    return setFieldFromNewValue(
        assignOrSame(item, {
            value: newValue,
            initValue,
            input,
            validInput,
            isValidInput,
            errors
        }),
        opts,
        sameValue
    );
};

const createNewGroupFieldsFromDirectValue = <T>(
    item: FormGroup<T>,
    value: ValueOrFunc,
    opts: SetValueOptions,
    data: UpdateFormItemData
): FormGroupFields => {
    // If path is empty, the assignment is directed to this group
    const theValue =
        value === undefined
            ? item.initValue
            : getAsValue(value, item.value, data);

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

const createNewListingFieldsFromDirectValue = <T extends unknown[]>(
    item: FormListing<T>,
    value: ValueOrFunc<T>,
    opts: SetValueOptions,
    data: UpdateFormItemData
): FormListingFields<T> => {
    // If path is empty, the assignment is directed to this group
    const theValue =
        value === undefined
            ? item.initValue
            : getAsValue(value, item.value, data);

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

// const createNewGroupFieldsFromChildValue = <T>(
//     item: FormGroup<T>,
//     value: ValueOrFunc,
//     path: string,
//     opts: SetValueOptions
// ): FormGroupFields => {
//     const [name, child, restOfPath] = locateInGroupOrFail(item, path);
//     const newChild = setValueInternal(child, value, restOfPath, opts);
//     return assignOrSame(item.fields, { [name]: newChild });
// };

// const createNewListingFieldsFromChildValue = <T extends any[]>(
//     item: FormListing<T>,
//     value: ValueOrFunc,
//     path: string,
//     opts: SetValueOptions
// ): FormListingFields => {
//     const [index, child, restOfPath] = locateInListingOrFail(item, path);
//     const newChild = setValueInternal(child, value, restOfPath, opts);
//     return assignArrayOrSame(<FormItem[]>item.fields, [index, [newChild]]);
// };

const updateFinalGroupFields = <T>(item: FormGroup<T>) => {
    const computedValue = createGroupValue(item.fields);
    const computedInitValue = createGroupInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = Object.keys(item.fields).some(k => item.fields[k].isDirty);
    const isTouched = Object.keys(item.fields).some(
        k => item.fields[k].isTouched
    );

    // log(
    //     `isDirty: ${isDirty} and isTouched: ${isTouched} \n${printObj(
    //         item.fields
    //     )}`
    // );

    // Derived
    const isValid =
        errors.length === 0 &&
        Object.keys(item.fields).every(k => item.fields[k].isValid);
    const showErrors = errors.length !== 0 && isTouched;

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

const updateFinalListingFields = <T extends unknown[]>(
    item: FormListing<T>
) => {
    const computedValue = createListingValue(item.fields);
    const computedInitValue = createListingInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = (<FormItem[]>item.fields).some(f => f.isDirty);
    const isTouched = (<FormItem[]>item.fields).some(f => f.isTouched);

    // Derived
    const isValid =
        errors.length === 0 && (<FormItem[]>item.fields).every(f => f.isValid);
    const showErrors = errors.length !== 0 && isTouched;

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

const updateGroupFieldsAux = <T>(
    item: FormGroup<T>,
    newFields: FormGroupFields<T>,
    opts: SetValueOptions
) => {
    if (newFields === null) {
        // log('    New group fields is null. No changes.');
        return item;
    }

    // If none of the group's children changed after the assignment,
    // then, and only then can the group evaluate the rest of it's
    // state. Much care must be taken to avoid a stack overflow.
    if (deepEqual(newFields, item.fields)) {
        // log('    Group fields are deep equal. No changes.');
        return updateFinalGroupFields(item);
    } else {
        const computedValue = createGroupValue(newFields);
        // log('    Computing from new group fields.');
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

const updateListingFieldsAux = <T extends unknown[]>(
    item: FormListing<T>,
    newFields: FormListingFields<T>,
    opts: SetValueOptions
) => {
    if (newFields === null) {
        return item;
    }

    // If none of the listings' children changed after the assignment,
    // then, and only then can the listing evaluate the rest of it's
    // state. Much care must be taken to avoid a stack overflow.
    if (deepEqual(newFields, item.fields)) {
        return updateFinalListingFields(item);
    } else {
        const computedValue = createListingValue(newFields);
        return setValueInternal(
            assignOrSame(item, { fields: newFields }),
            computedValue,
            '',
            assign(opts, {
                compareValues: true,
                initialization: true
            })
        ) as FormListing<T>;
    }
};

const updateFormItemInternalRec = (
    item: FormItem,
    path: PathStep[],
    updater: ValueOrFunc<FormItem>,
    opts: SetValueOptions,
    data: UpdateFormItemData
) => {
    // try {
    //     log(`updateRec ${JSON.stringify(path)} on ${item.type}`);
    if (path.length === 0) {
        const newItem = getAsValue(updater, item, data);
        if (!newItem || shallowEqualStrict(newItem, item)) {
            return item;
        }
        return newItem;
    } else {
        switch (item.type) {
            case 'field': {
                // debug(`updateRec: field '${path}'`);
                throw new Error(
                    'Unexpected path accessing this field: ' +
                        JSON.stringify(createPath(path))
                );
            }

            case 'group': {
                // debug(`updateRec: group '${path}'`);
                const nameOrWildcard = path[0];
                if (typeof nameOrWildcard !== 'string') {
                    throw new Error(
                        'Unexpected path accessing this group: ' +
                            JSON.stringify(createPath(path))
                    );
                }

                const names =
                    nameOrWildcard === '*'
                        ? Object.keys(item.fields)
                        : [nameOrWildcard];

                const restOfPath = path.slice(1);

                const newFields = names.reduce((prevFields, name) => {
                    const child = prevFields[name];
                    if (!child) {
                        throw new Error(
                            `Unexpected field name accessing this group: ` +
                                JSON.stringify(name)
                        );
                    }

                    // log(`    Down to ${name}`);
                    const newField = updateFormItemInternalRec(
                        child,
                        restOfPath,
                        updater,
                        opts,
                        assign(data, {
                            relativePath: appendGroupPath(
                                data.relativePath,
                                name
                            )
                        })
                    );

                    if (newField && newField !== child) {
                        // If newField is not null and not the same as previous
                        // child, then set [name] to newField
                        return assignOrSame(prevFields, <any>{
                            [name]: newField
                        });
                    } else if (!newField && child) {
                        // If newField is null and there was a previous child,
                        // then remove child from fields
                        return Object.keys(prevFields)
                            .filter(key => key !== name)
                            .reduce(
                                (fs, key) =>
                                    Object.assign(fs, { [key]: newField }),
                                <FormGroupFields>{}
                            );
                    } else {
                        return prevFields;
                    }
                }, item.fields);

                const result = updateGroupFieldsAux(item, newFields, opts);
                // log(`    UP FROM ${nameOrWildcard}:  ${printObj(result)}`);
                return result;
            }

            case 'listing': {
                const indexOrWildcard = path[0];
                if (typeof indexOrWildcard !== 'number') {
                    throw new Error(
                        'Unexpected path accessing this listing: ' +
                            JSON.stringify(createPath(path))
                    );
                }
                const indices = isNaN(indexOrWildcard)
                    ? Array.from({ length: item.fields.length }).map(
                          (_, i) => i
                      )
                    : [indexOrWildcard];

                const restOfPath = path.slice(1);

                // log(`    Down to ${indexOrWildcard}`);
                const newFields = indices.reduce((prevFields, index) => {
                    const child = prevFields[index];
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
                        opts,
                        assign(data, {
                            relativePath: appendListingPath(
                                data.relativePath,
                                index
                            )
                        })
                    );

                    if (newField) {
                        // If newField is not null and not the same as previous
                        // child, then set [name] to newField
                        return assignArrayOrSame(prevFields, [
                            index,
                            [newField]
                        ]);
                    } else if (!newField) {
                        // If newField is null and there was a previous child,
                        // then remove child from fields
                        return prevFields
                            .slice(0, index)
                            .concat(prevFields.slice(index + 1));
                    } else {
                        return prevFields;
                    }
                }, item.fields);

                const result = updateListingFieldsAux(item, newFields, opts);
                // log(
                //     !!path.length,
                //     `    UP FROM ${indexOrWildcard}:  ${printObj(result)}`
                // );
                return result;
            }

            default:
                break;
        }
    }
    // } catch (error) {
    //     const msg = `${errorToString(error)} ON ${data.relativePath}`;
    //     log(error.stack);
    //     throw new Error(msg);
    // }
};

const setValueUpdater =
    <T>(value: ValueOrFunc<T>, opts: SetValueOptions) =>
    (item: FormItem<T>, data: UpdateFormItemData): FormItem => {
        switch (item.type) {
            case 'field':
                return setFieldValueInternal(item, value, opts, data);

            case 'group': {
                return updateGroupFieldsAux(
                    item,
                    createNewGroupFieldsFromDirectValue(
                        item,
                        value,
                        opts,
                        data
                    ),
                    opts
                );
            }

            case 'listing': {
                return updateListingFieldsAux(
                    item,
                    createNewListingFieldsFromDirectValue(
                        item,
                        value as ValueOrFunc<(typeof item)['value']>,
                        opts,
                        data
                    ),
                    opts
                );
            }

            default:
                throw new Error(
                    'Unknown form item type: ' +
                        JSON.stringify((<any>item).type)
                );
        }
    };

export function setValueInternal<T extends FormItem>(
    item: T,
    value: ValueOrFunc<unknown>,
    path: string,
    options?: Partial<SetValueOptions>
): T {
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
        extractPath(path, true),
        setValueUpdater(value, opts),
        opts,
        { relativePath: '' }
    );
}

const setInputUpdater =
    (input: ValueOrFunc, opts: SetValueOptions) =>
    (item: FormItem, data: UpdateFormItemData): FormItem => {
        switch (item.type) {
            case 'field':
                return setFieldInputInternal(item, input, opts, data);

            case 'group': {
                throw new Error('Cannot set input value to a group');
            }

            case 'listing': {
                throw new Error('Cannot set input value to a listing');
            }

            default:
                throw new Error(
                    'Unknown form item type: ' +
                        JSON.stringify((<any>item).type)
                );
        }
    };

export function setInputInternal(
    item: FormItem,
    input: ValueOrFunc,
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
        extractPath(path, true),
        setInputUpdater(input, opts),
        opts,
        { relativePath: '' }
    );
}

const setInfoUpdater =
    (infoFunc: ValueOrFunc, opts: SetValueOptions) =>
    (item: FormItem, data: UpdateFormItemData): FormItem => {
        const theInfo = getAsValue(infoFunc, item.info, data, item);
        return assignOrSame(item, { info: theInfo });
    };

export function setInfoInternal(
    item: FormItem,
    info: ValueOrFunc,
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
        extractPath(path, true),
        setInfoUpdater(info, opts),
        opts,
        { relativePath: '' }
    );
}

const setGroupFieldUpdater =
    (
        fieldName: string,
        formItem: ValueOrFunc<FormItem>,
        opts: SetValueOptions
    ) =>
    (item: FormItem, data: UpdateFormItemData): FormItem => {
        switch (item.type) {
            case 'field':
                throw new Error('Expected to find a group but found a field');

            case 'group': {
                const child = item.fields[fieldName];
                const newField = getAsValue(formItem, child, data);
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
                    'Unknown form item type: ' +
                        JSON.stringify((<any>item).type)
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

    let newPath = extractPath(path, true);
    const fieldName =
        newPath.length >= 1 ? newPath[newPath.length - 1] : undefined;
    if (typeof fieldName !== 'string') {
        throw new Error(
            'Missing field name at the end of path: ' + JSON.stringify(path)
        );
    }
    if (fieldName === '*') {
        throw new Error(
            'Last field name cannot be a wildcard: ' + JSON.stringify(path)
        );
    }
    newPath = newPath.slice(0, newPath.length - 1);

    return updateFormItemInternalRec(
        item,
        newPath,
        setGroupFieldUpdater(fieldName, formItem, opts),
        opts,
        { relativePath: '' }
    );
};

const updateListingFieldsUpdater =
    (
        fields: ValueOrFunc<FormListingFields & Array<FormItem>>,
        opts: SetValueOptions
    ) =>
    (item: FormItem, data: UpdateFormItemData): FormItem => {
        switch (item.type) {
            case 'field':
                throw new Error('Expected to find a group but found a field');

            case 'listing': {
                const newFields = getAsValue(fields, item.fields, data);
                return updateListingFieldsAux(item, newFields, opts);
            }

            case 'group':
                throw new Error('Expected to find a listing but found a group');

            default:
                throw new Error(
                    'Unknown form item type: ' +
                        JSON.stringify((<any>item).type)
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
        extractPath(path, true),
        updateListingFieldsUpdater(fields, opts),
        opts,
        { relativePath: '' }
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
            const fieldErrors = Object.keys(item.fields).flatMap(key =>
                getAllErrorsInternalRec(
                    item.fields[key],
                    appendGroupPath(path, key)
                )
            );
            return currentErrors.concat(fieldErrors);
        }

        case 'listing': {
            const fieldErrors = item.fields.flatMap((field, index) =>
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
): I => <I>updateFormItemInternalRec(
        item,
        extractPath(pathToFormItem, true),
        (formItem: FormItem, data: UpdateFormItemData) => {
            const newInfo = getAsValue(updater, formItem, data);
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
        {
            affectDirty: false,
            initialization: false,
            compareValues: false
        },
        { relativePath: '' }
    );

export const getAllErrorsInternal = (item: FormItem) =>
    getAllErrorsInternalRec(item, '');
