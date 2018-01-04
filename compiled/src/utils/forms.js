"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
var coercion_1 = require("./coercion");
var validation_1 = require("./validation");
var forms_utils_1 = require("./forms.utils");
////////////////////////////////////////////////////////////////
//                                                            //
//                     Initializations                        //
//                                                            //
////////////////////////////////////////////////////////////////
exports.field = function (initValue, options) {
    var _a = common_1.assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initInput: undefined,
        parser: common_1.id,
    }, options), caption = _a.caption, description = _a.description, info = _a.info, coerceInit = _a.coerce, validatorInit = _a.validations;
    var coerce = coercion_1.coerceAll(coerceInit);
    var validator = validation_1.mergeValidators(validatorInit);
    var result = {
        // Type
        type: 'field',
        // Config
        caption: caption,
        description: description,
        info: info,
        initValue: initValue,
        coerce: coerce,
        validator: validator,
        // State
        value: undefined,
        errors: [],
        isDirty: false,
        isTouched: false,
        // Derived
        isValid: true,
        showErrors: false
    };
    return forms_utils_1.setValueInternal(result, initValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};
exports.group = function (fields, options) {
    if (!(fields instanceof Object) || fields.constructor !== Object) {
        throw new Error('Group fields must be a plain JS object.');
    }
    var _a = common_1.assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initValue: undefined
    }, options), caption = _a.caption, description = _a.description, info = _a.info, coerceInit = _a.coerce, validatorInit = _a.validations, initValue = _a.initValue;
    var coerce = coercion_1.coerceAll(coerceInit);
    var validator = validation_1.mergeValidators(validatorInit);
    var theFields = Object.assign({}, fields);
    var theInitValue = initValue || forms_utils_1.createGroupValue(theFields);
    var result = {
        // Type
        type: 'group',
        // Config
        caption: caption,
        description: description,
        info: info,
        initValue: theInitValue,
        coerce: coerce,
        validator: validator,
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
    return forms_utils_1.setValueInternal(result, theInitValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};
exports.listing = function (fields, options) {
    if (!(fields instanceof Array)) {
        throw new Error('Listing fields must be a plain JS Array.');
    }
    var _a = common_1.assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initValue: undefined
    }, options), caption = _a.caption, description = _a.description, info = _a.info, coerceInit = _a.coerce, validatorInit = _a.validations, initValue = _a.initValue;
    var coerce = coercion_1.coerceAll(coerceInit);
    var validator = validation_1.mergeValidators(validatorInit);
    var theFields = fields.slice();
    var theInitValue = initValue || forms_utils_1.createListingValue(theFields);
    var result = {
        // Type
        type: 'listing',
        // Config
        caption: caption,
        description: description,
        info: info,
        initValue: theInitValue,
        coerce: coerce,
        validator: validator,
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
    return forms_utils_1.setValueInternal(result, theInitValue, '', {
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
exports.getFormItem = function (item, path) {
    if (path === void 0) { path = ''; }
    switch (item.type) {
        case 'field': {
            forms_utils_1.checkPathInField(path);
            return item;
        }
        case 'group': {
            if (!path) {
                return item;
            }
            var _a = forms_utils_1.locateInGroupOrFail(item, path), _1 = _a[0], child = _a[1], restOfPath = _a[2];
            return exports.getFormItem(child, restOfPath);
        }
        case 'listing': {
            if (!path) {
                return item;
            }
            var _b = forms_utils_1.locateInListingOrFail(item, path), _2 = _b[0], child = _b[1], restOfPath = _b[2];
            return exports.getFormItem(child, restOfPath);
        }
        default:
            throw new Error('getFormItem: Not implemented');
    }
};
exports.getValue = function (item, path) {
    if (path === void 0) { path = ''; }
    var child = exports.getFormItem(item, path);
    if (!child) {
        return undefined;
    }
    return child.value;
};
exports.existFormItem = function (item, path) {
    try {
        return !!exports.getFormItem(item, path);
    }
    catch (error) {
        return false;
    }
};
exports.setValue = function (item, value, pathToField) {
    if (pathToField === void 0) { pathToField = ''; }
    return forms_utils_1.setValueInternal(item, value, pathToField);
};
exports.setValueDoNotTouch = function (item, value, pathToField) {
    if (pathToField === void 0) { pathToField = ''; }
    return forms_utils_1.setValueInternal(item, value, pathToField, {
        affectDirty: false
    });
};
exports.resetValue = function (item, value, pathToField) {
    if (value === void 0) { value = undefined; }
    if (pathToField === void 0) { pathToField = ''; }
    return forms_utils_1.setValueInternal(item, value, pathToField, {
        initialization: true,
        compareValues: false,
    });
};
exports.setGroupField = function (item, pathToGroupField, formItem) { return forms_utils_1.setGroupFieldInternal(item, pathToGroupField, formItem); };
exports.insertListingFields = function (item, pathToListing, newFields, atPosition) {
    return forms_utils_1.updateListingFieldsInternal(item, pathToListing, function (fields) {
        var theNewFields = common_1.getAsValue(newFields);
        if (!(theNewFields instanceof Array)) {
            theNewFields = [theNewFields];
        }
        if (typeof atPosition !== 'number' || atPosition >= fields.length) {
            return fields.concat(theNewFields);
        }
        else {
            var pos = atPosition < 0 ? 0 : atPosition;
            if (pos === 0) {
                return theNewFields.concat(fields);
            }
            else {
                return fields
                    .slice(0, pos)
                    .concat(theNewFields)
                    .concat(fields.slice(pos));
            }
        }
    });
};
exports.removeListingFields = function (item, pathToListing, atPosition, count) {
    if (count === void 0) { count = 1; }
    return forms_utils_1.updateListingFieldsInternal(item, pathToListing, function (fields) {
        return fields
            .slice(0, atPosition)
            .concat(fields.slice(atPosition + count));
    });
};
exports.updateFormInfo = function (item, pathToFormItem, updater) { return forms_utils_1.updateFormInfoInternal(item, pathToFormItem, updater); };
exports.getAllErrors = function (item) { return forms_utils_1.getAllErrorsInternal(item); };
//# sourceMappingURL=forms.js.map