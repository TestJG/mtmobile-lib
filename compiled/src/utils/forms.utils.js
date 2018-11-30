"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var equality_1 = require("./equality");
var common_1 = require("./common");
exports.matchGroupPath = function (path, allowPatterns) {
    if (allowPatterns === void 0) { allowPatterns = false; }
    var match = !allowPatterns
        ? path.match(/^([^\[\.*]+)(\.([^\.].*)|(\[.*)|())$/)
        : path.match(/^(\*|[^\[\.*]+)(\.([^\.].*)|(\[.*)|())$/);
    if (!match) {
        return null;
    }
    var step = match[1];
    var rest = match[3] || match[4] || match[5];
    return { step: step, rest: rest };
};
exports.matchListingPath = function (path, allowPatterns) {
    if (allowPatterns === void 0) { allowPatterns = false; }
    var match = !allowPatterns
        ? path.match(/^\[([\d]+)\](\.([^\.].*)|(\[.*)|())$/)
        : path.match(/^\[(\*|[\d]+)\](\.([^\.].*)|(\[.*)|())$/);
    if (!match) {
        return null;
    }
    var step = parseInt(match[1], 10);
    var rest = match[3] || match[4] || match[5];
    return { step: step, rest: rest };
};
exports.appendGroupPath = function (groupPath, fieldName) {
    return common_1.joinStr('.', [groupPath, fieldName]);
};
exports.appendListingPath = function (listingPath, childIndex) {
    return common_1.joinStr('', [listingPath, "[" + (isNaN(childIndex) ? '*' : childIndex) + "]"]);
};
exports.createPath = function (steps) {
    return steps.reduce(function (path, step) {
        return typeof step === 'number'
            ? exports.appendListingPath(path, step)
            : exports.appendGroupPath(path, step);
    }, '');
};
exports.createPathOf = function () {
    var steps = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        steps[_i] = arguments[_i];
    }
    return exports.createPath(steps);
};
exports.extractPath = function (path, allowPatterns) {
    if (allowPatterns === void 0) { allowPatterns = false; }
    var arr = [];
    while (path !== '') {
        var match = exports.matchListingPath(path, allowPatterns) ||
            exports.matchGroupPath(path, allowPatterns);
        if (match === null) {
            throw new Error('Invalid form path: ' + JSON.stringify(path));
        }
        arr.push(match.step);
        path = match.rest;
    }
    return arr;
};
exports.checkPathInField = function (path) {
    if (!!path) {
        throw new Error("Unexpected path accessing this field: " + JSON.stringify(path));
    }
};
////////////////////////////////////////////////////////////////
//                                                            //
//                     Field Manipulation                     //
//                                                            //
////////////////////////////////////////////////////////////////
exports.locateInGroupOrFail = function (item, path, failIfNoChild) {
    if (failIfNoChild === void 0) { failIfNoChild = true; }
    var match = exports.matchGroupPath(path);
    if (!match) {
        throw new Error("Unexpected path accessing this group: " + JSON.stringify(path));
    }
    var child = item.fields[match.step];
    if (!child && failIfNoChild) {
        throw new Error("Unexpected field name accessing this group: " + JSON.stringify(match.step));
    }
    return [
        match.step,
        child,
        match.rest,
    ];
};
exports.locateInListingOrFail = function (item, path, failIfNoChild) {
    if (failIfNoChild === void 0) { failIfNoChild = true; }
    var match = exports.matchListingPath(path);
    if (!match) {
        throw new Error("Unexpected path accessing this listing: " + JSON.stringify(path));
    }
    var child = item.fields[match.step];
    if (!child && failIfNoChild) {
        throw new Error("Unexpected field name accessing this group: " + JSON.stringify(match.step));
    }
    return [match.step, child, match.rest];
};
var checkGroupValue = function (value) {
    if (!(value instanceof Object) || value.constructor !== Object) {
        throw new Error('Group value must be a plain JS object.');
    }
};
var checkListingValue = function (value) {
    if (!(value instanceof Array)) {
        throw new Error('Listing value must be a plain JS array.');
    }
};
var validateGroupValue = function (value, fields) {
    checkGroupValue(value);
    var valueNames = Object.keys(value).sort();
    var fieldNames = Object.keys(fields).sort();
    if (valueNames.length === fieldNames.length) {
        if (fieldNames.every(function (fn, i) { return fn === valueNames[i]; })) {
            return;
        }
    }
    throw new Error("A group value must have the same names than the group fields. " +
        ("Expected fields " + JSON.stringify(fieldNames) + " but got value names " + JSON.stringify(valueNames)));
};
var validateListingValue = function (value, fields) {
    checkListingValue(value);
    var valueArr = value;
    var fieldsArr = fields;
    if (valueArr.length !== fieldsArr.length) {
        throw new Error("A listing value must have the same length than the listing fields. " +
            ("Expected fields length " + JSON.stringify(fieldsArr.length) + " but got values length " + JSON.stringify(valueArr.length)));
    }
};
exports.createGroupValue = function (fields) {
    return common_1.objMapValues(function (f) { return f.value; })(fields);
};
exports.createGroupInitValue = function (fields) {
    return common_1.objMapValues(function (f) { return f.initValue; })(fields);
};
exports.createListingValue = function (fields) { return fields.map(function (f) { return f.value; }); };
exports.createListingInitValue = function (fields) { return fields.map(function (f) { return f.initValue; }); };
var updateGroupFields = function (value, fields, opts) {
    return Object.keys(fields).reduce(function (fs, key) {
        var _a;
        return common_1.assignOrSame(fs, (_a = {},
            _a[key] = setValueInternal(fs[key], value[key], '', opts),
            _a));
    }, fields);
};
var updateListingFields = function (value, fields, opts) {
    return common_1.assignArrayOrSame(fields, [
        0,
        fields.map(function (f, index) { return setValueInternal(f, value[index], '', opts); }),
    ]);
};
var setFieldFromNewValue = function (item, 
// newValue: any,
opts, sameValue) {
    var isDirty = opts.initialization
        ? false
        : item.isDirty || (opts.affectDirty ? !sameValue : false);
    var isTouched = opts.initialization ? false : isDirty || item.isTouched;
    // Derived
    var isValid = item.errors.length === 0;
    var showErrors = item.errors.length !== 0 && isTouched;
    var newItem = common_1.assignOrSame(item, {
        // value: newValue,
        isDirty: isDirty,
        isTouched: isTouched,
        isValid: isValid,
        showErrors: showErrors,
    });
    return newItem;
};
var setFieldInputInternal = function (item, inputFunc, opts, data) {
    var theInput = inputFunc === undefined
        ? item.initInput === null
            ? item.formatter(item.initValue)
            : item.initInput
        : common_1.getAsValue(inputFunc, item.value, data);
    try {
        var theValue = item.parser(theInput);
        var newValue = item.coerce(theValue);
        var initValue = opts.initialization ? newValue : item.initValue;
        var sameValue = opts.compareValues &&
            equality_1.strictEqual(item.value, newValue) &&
            equality_1.strictEqual(theInput, item.input);
        if (sameValue && equality_1.strictEqual(theValue, item.value)) {
            return item;
        }
        var initInput = opts.initialization ? theInput : item.initInput;
        var input = theInput;
        var validInput = input;
        var isValidInput = true;
        var errors = item.validator(newValue);
        var result = setFieldFromNewValue(common_1.assignOrSame(item, {
            value: newValue,
            initValue: initValue,
            initInput: initInput,
            input: input,
            validInput: validInput,
            isValidInput: isValidInput,
            errors: errors,
        }), opts, sameValue);
        // log('RESULT AFTER SUCCESS', printObj(result));
        return result;
    }
    catch (error) {
        // const newValue = item.value;
        var initInput = opts.initialization ? theInput : item.initInput;
        var input = theInput;
        var isValidInput = false;
        var errors = [item.parserErrorText || common_1.errorToString(error)];
        var result = setFieldFromNewValue(common_1.assignOrSame(item, {
            errors: errors,
            initInput: initInput,
            input: input,
            isValidInput: isValidInput,
            isTouched: true,
        }), opts, // assign(opts, { compareValues: false }),
        false);
        // log('RESULT AFTER ERROR', printObj(result));
        return result;
    }
};
var setFieldValueInternal = function (item, value, opts, data) {
    var theValue = value === undefined
        ? item.initValue
        : common_1.getAsValue(value, item.value, data);
    var newValue = item.coerce(theValue);
    var sameValue = opts.compareValues && item.value === newValue;
    if (sameValue && theValue === item.value) {
        return item;
    }
    var initValue = opts.initialization ? newValue : item.initValue;
    var input = item.formatter(newValue);
    var validInput = input;
    var isValidInput = true;
    var errors = item.validator(newValue);
    return setFieldFromNewValue(common_1.assignOrSame(item, {
        value: newValue,
        initValue: initValue,
        input: input,
        validInput: validInput,
        isValidInput: isValidInput,
        errors: errors,
    }), opts, sameValue);
};
var createNewGroupFieldsFromDirectValue = function (item, value, opts, data) {
    // If path is empty, the assignment is directed to this group
    var theValue = value === undefined
        ? item.initValue
        : common_1.getAsValue(value, item.value, data);
    validateGroupValue(theValue, item.fields);
    var newValue = item.coerce(theValue);
    validateGroupValue(newValue, item.fields);
    var sameValue = opts.compareValues && equality_1.deepEqual(item.value, newValue);
    if (sameValue && equality_1.deepEqual(theValue, item.value)) {
        return null;
    }
    // compute the new fields object, assigning values to the
    // group's children
    return updateGroupFields(newValue, item.fields, opts);
};
var createNewListingFieldsFromDirectValue = function (item, value, opts, data) {
    // If path is empty, the assignment is directed to this group
    var theValue = value === undefined
        ? item.initValue
        : common_1.getAsValue(value, item.value, data);
    validateListingValue(theValue, item.fields);
    var newValue = item.coerce(theValue);
    validateListingValue(newValue, item.fields);
    var sameValue = opts.compareValues && equality_1.deepEqual(item.value, newValue);
    if (sameValue && equality_1.deepEqual(theValue, item.value)) {
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
var updateFinalGroupFields = function (item) {
    var computedValue = exports.createGroupValue(item.fields);
    var computedInitValue = exports.createGroupInitValue(item.fields);
    var errors = item.validator(computedValue);
    var isDirty = Object.keys(item.fields).some(function (k) { return item.fields[k].isDirty; });
    var isTouched = Object.keys(item.fields).some(function (k) { return item.fields[k].isTouched; });
    // log(`isDirty: ${isDirty} and isTouched: ${isTouched} \n${printObj(item.fields)}`);
    // Derived
    var isValid = errors.length === 0 &&
        Object.keys(item.fields).every(function (k) { return item.fields[k].isValid; });
    var showErrors = errors.length !== 0 && isTouched;
    return common_1.assignOrSame(item, {
        // Config
        initValue: computedInitValue,
        // State
        value: computedValue,
        errors: errors,
        isDirty: isDirty,
        isTouched: isTouched,
        // Derived
        isValid: isValid,
        showErrors: showErrors,
    });
};
var updateFinalListingFields = function (item) {
    var computedValue = exports.createListingValue(item.fields);
    var computedInitValue = exports.createListingInitValue(item.fields);
    var errors = item.validator(computedValue);
    var isDirty = item.fields.some(function (f) { return f.isDirty; });
    var isTouched = item.fields.some(function (f) { return f.isTouched; });
    // Derived
    var isValid = errors.length === 0 && item.fields.every(function (f) { return f.isValid; });
    var showErrors = errors.length !== 0 && isTouched;
    return common_1.assignOrSame(item, {
        // Config
        initValue: computedInitValue,
        // State
        value: computedValue,
        errors: errors,
        isDirty: isDirty,
        isTouched: isTouched,
        // Derived
        isValid: isValid,
        showErrors: showErrors,
    });
};
var updateGroupFieldsAux = function (item, newFields, opts) {
    if (newFields === null) {
        // log('    New group fields is null. No changes.');
        return item;
    }
    // If none of the group's children changed after the assignment,
    // then, and only then can the group evaluate the rest of it's
    // state. Much care must be taken to avoid a stack overflow.
    if (equality_1.deepEqual(newFields, item.fields)) {
        // log('    Group fields are deep equal. No changes.');
        return updateFinalGroupFields(item);
    }
    else {
        var computedValue = exports.createGroupValue(newFields);
        // log('    Computing from new group fields.');
        return setValueInternal(common_1.assignOrSame(item, {
            fields: newFields,
        }), computedValue, '', common_1.assign(opts, {
            compareValues: true,
            initialization: true,
        }));
    }
};
var updateListingFieldsAux = function (item, newFields, opts) {
    if (newFields === null) {
        return item;
    }
    // If none of the listings' children changed after the assignment,
    // then, and only then can the listing evaluate the rest of it's
    // state. Much care must be taken to avoid a stack overflow.
    if (equality_1.deepEqual(newFields, item.fields)) {
        return updateFinalListingFields(item);
    }
    else {
        var computedValue = exports.createListingValue(newFields);
        return setValueInternal(common_1.assignOrSame(item, { fields: newFields }), computedValue, '', common_1.assign(opts, {
            compareValues: true,
            initialization: true,
        }));
    }
};
var updateFormItemInternalRec = function (item, path, updater, opts, data) {
    // try {
    //     log(`updateRec ${JSON.stringify(path)} on ${item.type}`);
    if (path.length === 0) {
        var newItem = common_1.getAsValue(updater, item, data);
        if (!newItem || equality_1.shallowEqualStrict(newItem, item)) {
            return item;
        }
        return newItem;
    }
    else {
        switch (item.type) {
            case 'field': {
                // debug(`updateRec: field '${path}'`);
                throw new Error('Unexpected path accessing this field: ' +
                    JSON.stringify(exports.createPath(path)));
            }
            case 'group': {
                // debug(`updateRec: group '${path}'`);
                var nameOrWildcard = path[0];
                if (typeof nameOrWildcard !== 'string') {
                    throw new Error('Unexpected path accessing this group: ' +
                        JSON.stringify(exports.createPath(path)));
                }
                var names = nameOrWildcard === '*'
                    ? Object.keys(item.fields)
                    : [nameOrWildcard];
                var restOfPath_1 = path.slice(1);
                var newFields = names.reduce(function (prevFields, name) {
                    var _a;
                    var child = prevFields[name];
                    if (!child) {
                        throw new Error("Unexpected field name accessing this group: " +
                            JSON.stringify(name));
                    }
                    // log(`    Down to ${name}`);
                    var newField = updateFormItemInternalRec(child, restOfPath_1, updater, opts, common_1.assign(data, {
                        relativePath: exports.appendGroupPath(data.relativePath, name),
                    }));
                    if (newField && newField !== child) {
                        // If newField is not null and not the same as previous
                        // child, then set [name] to newField
                        return common_1.assignOrSame(prevFields, (_a = {},
                            _a[name] = newField,
                            _a));
                    }
                    else if (!newField && child) {
                        // If newField is null and there was a previous child,
                        // then remove child from fields
                        return Object.keys(prevFields)
                            .filter(function (key) { return key !== name; })
                            .reduce(function (fs, key) {
                            var _a;
                            return Object.assign(fs, (_a = {}, _a[key] = newField, _a));
                        }, {});
                    }
                    else {
                        return prevFields;
                    }
                }, item.fields);
                var result = updateGroupFieldsAux(item, newFields, opts);
                // log(`    UP FROM ${nameOrWildcard}:  ${printObj(result)}`);
                return result;
            }
            case 'listing': {
                var indexOrWildcard = path[0];
                if (typeof indexOrWildcard !== 'number') {
                    throw new Error('Unexpected path accessing this listing: ' +
                        JSON.stringify(exports.createPath(path)));
                }
                var indices = isNaN(indexOrWildcard)
                    ? _.range(item.fields.length)
                    : [indexOrWildcard];
                var restOfPath_2 = path.slice(1);
                // log(`    Down to ${indexOrWildcard}`);
                var newFields = indices.reduce(function (prevFields, index) {
                    var child = prevFields[index];
                    if (!child) {
                        throw new Error("Unexpected field index accessing this listing: " +
                            JSON.stringify(index));
                    }
                    var newField = updateFormItemInternalRec(child, restOfPath_2, updater, opts, common_1.assign(data, {
                        relativePath: exports.appendListingPath(data.relativePath, index),
                    }));
                    if (newField) {
                        // If newField is not null and not the same as previous
                        // child, then set [name] to newField
                        return common_1.assignArrayOrSame(prevFields, [
                            index,
                            [newField],
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
                var result = updateListingFieldsAux(item, newFields, opts);
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
var setValueUpdater = function (value, opts) { return function (item, data) {
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
}; };
function setValueInternal(item, value, path, options) {
    var opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false,
    }, options);
    return updateFormItemInternalRec(item, exports.extractPath(path, true), setValueUpdater(value, opts), opts, { relativePath: '' });
}
exports.setValueInternal = setValueInternal;
var setInputUpdater = function (input, opts) { return function (item, data) {
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
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
}; };
function setInputInternal(item, input, path, options) {
    var opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false,
    }, options);
    return updateFormItemInternalRec(item, exports.extractPath(path, true), setInputUpdater(input, opts), opts, { relativePath: '' });
}
exports.setInputInternal = setInputInternal;
var setInfoUpdater = function (infoFunc, opts) { return function (item, data) {
    var theInfo = common_1.getAsValue(infoFunc, item.info, data, item);
    return common_1.assignOrSame(item, { info: theInfo });
}; };
function setInfoInternal(item, info, path, options) {
    var opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false,
    }, options);
    return updateFormItemInternalRec(item, exports.extractPath(path, true), setInfoUpdater(info, opts), opts, { relativePath: '' });
}
exports.setInfoInternal = setInfoInternal;
var setGroupFieldUpdater = function (fieldName, formItem, opts) { return function (item, data) {
    var _a;
    switch (item.type) {
        case 'field':
            throw new Error('Expected to find a group but found a field');
        case 'group': {
            var child = item.fields[fieldName];
            var newField_1 = common_1.getAsValue(formItem, child, data);
            var newFields = null;
            if (newField_1 && newField_1 !== child) {
                // If newField is not null and not the same as previous
                // child, then set [fieldName] to newField
                newFields = common_1.assignOrSame(item.fields, (_a = {},
                    _a[fieldName] = newField_1,
                    _a));
            }
            else if (!newField_1 && child) {
                // If newField is null and there was a previous child,
                // then remove child from fields
                newFields = Object.keys(item.fields)
                    .filter(function (key) { return key !== fieldName; })
                    .reduce(function (fs, key) {
                    var _a;
                    return Object.assign(fs, (_a = {}, _a[key] = newField_1, _a));
                }, {});
            }
            return updateGroupFieldsAux(item, newFields, opts);
        }
        case 'listing':
            throw new Error('Expected to find a group but found a listing');
        default:
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
}; };
exports.setGroupFieldInternal = function (item, path, formItem, options) {
    var opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false,
    }, options);
    var newPath = exports.extractPath(path, true);
    var fieldName = newPath.length >= 1 ? newPath[newPath.length - 1] : undefined;
    if (typeof fieldName !== 'string') {
        throw new Error('Missing field name at the end of path: ' + JSON.stringify(path));
    }
    if (fieldName === '*') {
        throw new Error('Last field name cannot be a wildcard: ' + JSON.stringify(path));
    }
    newPath = newPath.slice(0, newPath.length - 1);
    return updateFormItemInternalRec(item, newPath, setGroupFieldUpdater(fieldName, formItem, opts), opts, { relativePath: '' });
};
var updateListingFieldsUpdater = function (fields, opts) { return function (item, data) {
    switch (item.type) {
        case 'field':
            throw new Error('Expected to find a group but found a field');
        case 'listing': {
            var newFields = common_1.getAsValue(fields, item.fields, data);
            return updateListingFieldsAux(item, newFields, opts);
        }
        case 'group':
            throw new Error('Expected to find a listing but found a group');
        default:
            throw new Error('Unknown form item type: ' + JSON.stringify(item.type));
    }
}; };
exports.updateListingFieldsInternal = function (item, path, fields, options) {
    var opts = Object.assign({
        affectDirty: true,
        compareValues: true,
        initialization: false,
    }, options);
    return updateFormItemInternalRec(item, exports.extractPath(path, true), updateListingFieldsUpdater(fields, opts), opts, { relativePath: '' });
};
exports.getAllErrorsInternalRec = function (item, path) {
    var currentErrors = !item.errors.length
        ? []
        : [{ path: path, item: item, errors: item.errors }];
    switch (item.type) {
        case 'field': {
            return currentErrors;
        }
        case 'group': {
            var fieldErrors = _.flatMap(Object.keys(item.fields), function (key) {
                return exports.getAllErrorsInternalRec(item.fields[key], exports.appendGroupPath(path, key));
            });
            return currentErrors.concat(fieldErrors);
        }
        case 'listing': {
            var fieldErrors = _.flatMap(item.fields, function (field, index) {
                return exports.getAllErrorsInternalRec(field, exports.appendListingPath(path, index));
            });
            return currentErrors.concat(fieldErrors);
        }
    }
};
exports.updateFormInfoInternal = function (item, pathToFormItem, updater) {
    return updateFormItemInternalRec(item, exports.extractPath(pathToFormItem, true), function (formItem, data) {
        var newInfo = common_1.getAsValue(updater, formItem, data);
        return common_1.assignIfMany(formItem, [newInfo.caption !== undefined, { caption: newInfo.caption }], [
            newInfo.description !== undefined,
            { description: newInfo.description },
        ], [newInfo.info !== undefined, { info: newInfo.info }]);
    }, {
        affectDirty: false,
        initialization: false,
        compareValues: false,
    }, { relativePath: '' });
};
exports.getAllErrorsInternal = function (item) {
    return exports.getAllErrorsInternalRec(item, '');
};
//# sourceMappingURL=forms.utils.js.map