import _ from 'lodash';
import { deepEqual, shallowEqualStrict } from './equality';
import { assign, assignOrSame, assignArrayOrSame, assignIfMany, objMapValues, joinStr, getAsValue, errorToString } from './common';
export const matchGroupPath = (path, allowPatterns = false) => {
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
export const matchListingPath = (path, allowPatterns = false) => {
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
export const appendGroupPath = (groupPath, fieldName) => joinStr('.', [groupPath, fieldName]);
export const appendListingPath = (listingPath, childIndex) => joinStr('', [listingPath, `[${isNaN(childIndex) ? '*' : childIndex}]`]);
export const createPath = (steps) => steps.reduce((path, step) => typeof step === 'number'
    ? appendListingPath(path, step)
    : appendGroupPath(path, step), '');
export const createPathOf = (...steps) => createPath(steps);
export const extractPath = (path, allowPatterns = false) => {
    const arr = [];
    while (path !== '') {
        const match = matchListingPath(path, allowPatterns) ||
            matchGroupPath(path, allowPatterns);
        if (match === null) {
            throw new Error('Invalid form path: ' + JSON.stringify(path));
        }
        arr.push(match.step);
        path = match.rest;
    }
    return arr;
};
export const checkPathInField = (path) => {
    if (!!path) {
        throw new Error(`Unexpected path accessing this field: ${JSON.stringify(path)}`);
    }
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Field Manipulation                     //
//                                                            //
////////////////////////////////////////////////////////////////
export const locateInGroupOrFail = (item, path, failIfNoChild = true) => {
    const match = matchGroupPath(path);
    if (!match) {
        throw new Error(`Unexpected path accessing this group: ${JSON.stringify(path)}`);
    }
    const child = item.fields[match.step];
    if (!child && failIfNoChild) {
        throw new Error(`Unexpected field name accessing this group: ${JSON.stringify(match.step)}`);
    }
    return [match.step, child, match.rest];
};
export const locateInListingOrFail = (item, path, failIfNoChild = true) => {
    const match = matchListingPath(path);
    if (!match) {
        throw new Error(`Unexpected path accessing this listing: ${JSON.stringify(path)}`);
    }
    const child = item.fields[match.step];
    if (!child && failIfNoChild) {
        throw new Error(`Unexpected field name accessing this group: ${JSON.stringify(match.step)}`);
    }
    return [match.step, child, match.rest];
};
const checkGroupValue = (value) => {
    if (!(value instanceof Object) || value.constructor !== Object) {
        throw new Error('Group value must be a plain JS object.');
    }
};
const checkListingValue = (value) => {
    if (!(value instanceof Array)) {
        throw new Error('Listing value must be a plain JS array.');
    }
};
const validateGroupValue = (value, fields) => {
    checkGroupValue(value);
    const valueNames = Object.keys(value).sort();
    const fieldNames = Object.keys(fields).sort();
    if (valueNames.length === fieldNames.length) {
        if (fieldNames.every((fn, i) => fn === valueNames[i])) {
            return;
        }
    }
    throw new Error(`A group value must have the same names than the group fields. ` +
        `Expected fields ${JSON.stringify(fieldNames)} but got value names ${JSON.stringify(valueNames)}`);
};
const validateListingValue = (value, fields) => {
    checkListingValue(value);
    const valueArr = value;
    const fieldsArr = fields;
    if (valueArr.length !== fieldsArr.length) {
        throw new Error(`A listing value must have the same length than the listing fields. ` +
            `Expected fields length ${JSON.stringify(fieldsArr.length)} but got values length ${JSON.stringify(valueArr.length)}`);
    }
};
export const createGroupValue = (fields) => objMapValues((f) => f.value)(fields);
export const createGroupInitValue = (fields) => objMapValues((f) => f.initValue)(fields);
export const createListingValue = (fields) => fields.map(f => f.value);
export const createListingInitValue = (fields) => fields.map(f => f.initValue);
const updateGroupFields = (value, fields, opts) => Object.keys(fields).reduce((fs, key) => assignOrSame(fs, {
    [key]: setValueInternal(fs[key], value[key], '', opts)
}), fields);
const updateListingFields = (value, fields, opts) => assignArrayOrSame(fields, [
    0,
    fields.map((f, index) => setValueInternal(f, value[index], '', opts))
]);
const setFieldValueInternal = (item, value, opts, data) => {
    const theValue = value === undefined
        ? item.initValue
        : getAsValue(value, item.value, data);
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
    const showErrors = errors.length !== 0 && isTouched;
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
const createNewGroupFieldsFromDirectValue = (item, value, opts, data) => {
    // If path is empty, the assignment is directed to this group
    const theValue = value === undefined
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
const createNewListingFieldsFromDirectValue = (item, value, opts, data) => {
    // If path is empty, the assignment is directed to this group
    const theValue = value === undefined
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
const createNewGroupFieldsFromChildValue = (item, value, path, opts) => {
    const [name, child, restOfPath] = locateInGroupOrFail(item, path);
    const newChild = setValueInternal(child, value, restOfPath, opts);
    return assignOrSame(item.fields, { [name]: newChild });
};
const createNewListingFieldsFromChildValue = (item, value, path, opts) => {
    const [index, child, restOfPath] = locateInListingOrFail(item, path);
    const newChild = setValueInternal(child, value, restOfPath, opts);
    return assignArrayOrSame(item.fields, [index, [newChild]]);
};
const updateFinalGroupFields = (item) => {
    const computedValue = createGroupValue(item.fields);
    const computedInitValue = createGroupInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = Object.keys(item.fields).some(k => item.fields[k].isDirty);
    const isTouched = Object.keys(item.fields).some(k => item.fields[k].isTouched);
    // Derived
    const isValid = errors.length === 0 &&
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
const updateFinalListingFields = (item) => {
    const computedValue = createListingValue(item.fields);
    const computedInitValue = createListingInitValue(item.fields);
    const errors = item.validator(computedValue);
    const isDirty = item.fields.some(f => f.isDirty);
    const isTouched = item.fields.some(f => f.isTouched);
    // Derived
    const isValid = errors.length === 0 && item.fields.every(f => f.isValid);
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
const updateGroupFieldsAux = (item, newFields, opts) => {
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
    }
    else {
        const computedValue = createGroupValue(newFields);
        return setValueInternal(assignOrSame(item, {
            fields: newFields
        }), computedValue, '', assign(opts, {
            compareValues: true,
            initialization: true
        }));
    }
};
const updateListingFieldsAux = (item, newFields, opts) => {
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
    }
    else {
        const computedValue = createListingValue(newFields);
        return setValueInternal(assignOrSame(item, {
            fields: newFields
        }), computedValue, '', assign(opts, {
            compareValues: true,
            initialization: true
        }));
    }
};
const updateFormItemInternalRec = (item, path, updater, opts, data) => {
    try {
        if (path.length === 0) {
            const newItem = getAsValue(updater, item, data);
            if (!newItem || shallowEqualStrict(newItem, item)) {
                return item;
            }
            return newItem;
        }
        else {
            switch (item.type) {
                case 'field': {
                    throw new Error('Unexpected path accessing this field: ' +
                        JSON.stringify(createPath(path)));
                }
                case 'group': {
                    const nameOrWildcard = path[0];
                    if (typeof nameOrWildcard !== 'string') {
                        throw new Error('Unexpected path accessing this group: ' +
                            JSON.stringify(createPath(path)));
                    }
                    const names = nameOrWildcard === '*'
                        ? Object.keys(item.fields)
                        : [nameOrWildcard];
                    const restOfPath = path.slice(1);
                    const newFields = names.reduce((prevFields, name) => {
                        const child = prevFields[name];
                        if (!child) {
                            throw new Error(`Unexpected field name accessing this group: ` +
                                JSON.stringify(name));
                        }
                        const newField = updateFormItemInternalRec(child, restOfPath, updater, opts, assign(data, {
                            relativePath: appendGroupPath(data.relativePath, name)
                        }));
                        if (newField && newField !== child) {
                            // If newField is not null and not the same as previous
                            // child, then set [name] to newField
                            return assignOrSame(prevFields, {
                                [name]: newField
                            });
                        }
                        else if (!newField && child) {
                            // If newField is null and there was a previous child,
                            // then remove child from fields
                            return Object.keys(prevFields)
                                .filter(key => key !== name)
                                .reduce((fs, key) => Object.assign(fs, { [key]: newField }), {});
                        }
                        else {
                            return prevFields;
                        }
                    }, item.fields);
                    return updateGroupFieldsAux(item, newFields, opts);
                }
                case 'listing': {
                    const indexOrWildcard = path[0];
                    if (typeof indexOrWildcard !== 'number') {
                        throw new Error('Unexpected path accessing this listing: ' +
                            JSON.stringify(createPath(path)));
                    }
                    const indices = isNaN(indexOrWildcard)
                        ? _.range(item.fields.length)
                        : [indexOrWildcard];
                    const restOfPath = path.slice(1);
                    const newFields = indices.reduce((prevFields, index) => {
                        const child = prevFields[index];
                        if (!child) {
                            throw new Error(`Unexpected field index accessing this listing: ` +
                                JSON.stringify(index));
                        }
                        const newField = updateFormItemInternalRec(child, restOfPath, updater, opts, assign(data, {
                            relativePath: appendListingPath(data.relativePath, index)
                        }));
                        if (newField) {
                            // If newField is not null and not the same as previous
                            // child, then set [name] to newField
                            return assignArrayOrSame(prevFields, [
                                index,
                                [newField]
                            ]);
                        }
                        else if (!newField) {
                            // If newField is null and there was a previous child,
                            // then remove child from fields
                            return prevFields
                                .slice(0, index)
                                .concat(prevFields.slice(index + 1));
                        }
                        else {
                            return prevFields;
                        }
                    }, item.fields);
                    return updateListingFieldsAux(item, newFields, opts);
                }
                default:
                    break;
            }
        }
    }
    catch (error) {
        const msg = `${errorToString(error)} ON ${data.relativePath}`;
        throw new Error(msg);
    }
};
const setValueUpdater = (value, opts) => (item, data) => {
    switch (item.type) {
        case 'field':
            return setFieldValueInternal(item, value, opts, data);
        case 'group': {
            return updateGroupFieldsAux(item, createNewGroupFieldsFromDirectValue(item, value, opts, data), opts);
        }
        case 'listing': {
            return updateListingFieldsAux(item, createNewListingFieldsFromDirectValue(item, value, opts, data), opts);
        }
        default:
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
};
export function setValueInternal(item, value, path, options) {
    const opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false
    }, options);
    return updateFormItemInternalRec(item, extractPath(path, true), setValueUpdater(value, opts), opts, { relativePath: '' });
}
const setGroupFieldUpdater = (fieldName, formItem, opts) => (item, data) => {
    switch (item.type) {
        case 'field':
            throw new Error('Expected to find a group but found a field');
        case 'group': {
            const child = item.fields[fieldName];
            const newField = getAsValue(formItem, child, data);
            let newFields = null;
            if (newField && newField !== child) {
                // If newField is not null and not the same as previous
                // child, then set [fieldName] to newField
                newFields = assignOrSame(item.fields, {
                    [fieldName]: newField
                });
            }
            else if (!newField && child) {
                // If newField is null and there was a previous child,
                // then remove child from fields
                newFields = Object.keys(item.fields)
                    .filter(key => key !== fieldName)
                    .reduce((fs, key) => Object.assign(fs, { [key]: newField }), {});
            }
            return updateGroupFieldsAux(item, newFields, opts);
        }
        case 'listing':
            throw new Error('Expected to find a group but found a listing');
        default:
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
};
export const setGroupFieldInternal = (item, path, formItem, options) => {
    const opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false
    }, options);
    let newPath = extractPath(path, true);
    const fieldName = newPath.length >= 1 ? newPath[newPath.length - 1] : undefined;
    if (typeof fieldName !== 'string') {
        throw new Error('Missing field name at the end of path: ' + JSON.stringify(path));
    }
    if (fieldName === '*') {
        throw new Error('Last field name cannot be a wildcard: ' + JSON.stringify(path));
    }
    newPath = newPath.slice(0, newPath.length - 1);
    return updateFormItemInternalRec(item, newPath, setGroupFieldUpdater(fieldName, formItem, opts), opts, { relativePath: '' });
};
const updateListingFieldsUpdater = (fields, opts) => (item, data) => {
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
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
};
export const updateListingFieldsInternal = (item, path, fields, options) => {
    const opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false
    }, options);
    return updateFormItemInternalRec(item, extractPath(path, true), updateListingFieldsUpdater(fields, opts), opts, { relativePath: '' });
};
export const getAllErrorsInternalRec = (item, path) => {
    const currentErrors = !item.errors.length
        ? []
        : [{ path, item, errors: item.errors }];
    switch (item.type) {
        case 'field': {
            return currentErrors;
        }
        case 'group': {
            const fieldErrors = _.flatMap(Object.keys(item.fields), key => getAllErrorsInternalRec(item.fields[key], appendGroupPath(path, key)));
            return currentErrors.concat(fieldErrors);
        }
        case 'listing': {
            const fieldErrors = _.flatMap(item.fields, (field, index) => getAllErrorsInternalRec(field, appendListingPath(path, index)));
            return currentErrors.concat(fieldErrors);
        }
    }
};
export const updateFormInfoInternal = (item, pathToFormItem, updater) => {
    return updateFormItemInternalRec(item, extractPath(pathToFormItem, true), (formItem, data) => {
        const newInfo = getAsValue(updater, formItem, data);
        return assignIfMany(formItem, [newInfo.caption !== undefined, { caption: newInfo.caption }], [
            newInfo.description !== undefined,
            { description: newInfo.description }
        ], [newInfo.info !== undefined, { info: newInfo.info }]);
    }, { affectDirty: false, initialization: false, compareValues: false }, { relativePath: '' });
};
export const getAllErrorsInternal = (item) => getAllErrorsInternalRec(item, '');
//# sourceMappingURL=forms.utils.js.map