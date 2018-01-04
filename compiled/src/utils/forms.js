import { id, assign, getAsValue } from './common';
import { coerceAll } from './coercion';
import { mergeValidators } from './validation';
import { checkPathInField, createGroupValue, createListingValue, getAllErrorsInternal, locateInGroupOrFail, locateInListingOrFail, setGroupFieldInternal, setValueInternal, updateListingFieldsInternal, updateFormInfoInternal } from './forms.utils';
////////////////////////////////////////////////////////////////
//                                                            //
//                     Initializations                        //
//                                                            //
////////////////////////////////////////////////////////////////
export const field = (initValue, options) => {
    const { caption, description, info, coerce: coerceInit, validations: validatorInit } = assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initInput: undefined,
        parser: id,
    }, options);
    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const result = {
        // Type
        type: 'field',
        // Config
        caption,
        description,
        info,
        initValue,
        coerce,
        validator,
        // State
        value: undefined,
        errors: [],
        isDirty: false,
        isTouched: false,
        // Derived
        isValid: true,
        showErrors: false
    };
    return setValueInternal(result, initValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};
export const group = (fields, options) => {
    if (!(fields instanceof Object) || fields.constructor !== Object) {
        throw new Error('Group fields must be a plain JS object.');
    }
    const { caption, description, info, coerce: coerceInit, validations: validatorInit, initValue } = assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initValue: undefined
    }, options);
    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const theFields = Object.assign({}, fields);
    const theInitValue = initValue || createGroupValue(theFields);
    const result = {
        // Type
        type: 'group',
        // Config
        caption,
        description,
        info,
        initValue: theInitValue,
        coerce,
        validator,
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
    return setValueInternal(result, theInitValue, '', {
        affectDirty: false,
        compareValues: false,
        initialization: true
    });
};
export const listing = (fields, options) => {
    if (!(fields instanceof Array)) {
        throw new Error('Listing fields must be a plain JS Array.');
    }
    const { caption, description, info, coerce: coerceInit, validations: validatorInit, initValue } = assign({
        caption: '',
        description: '',
        info: undefined,
        coerce: undefined,
        validations: undefined,
        initValue: undefined
    }, options);
    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const theFields = fields.slice();
    const theInitValue = initValue || createListingValue(theFields);
    const result = {
        // Type
        type: 'listing',
        // Config
        caption,
        description,
        info,
        initValue: theInitValue,
        coerce,
        validator,
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
    return setValueInternal(result, theInitValue, '', {
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
export const getFormItem = (item, path = '') => {
    switch (item.type) {
        case 'field': {
            checkPathInField(path);
            return item;
        }
        case 'group': {
            if (!path) {
                return item;
            }
            const [_, child, restOfPath] = locateInGroupOrFail(item, path);
            return getFormItem(child, restOfPath);
        }
        case 'listing': {
            if (!path) {
                return item;
            }
            const [_, child, restOfPath] = locateInListingOrFail(item, path);
            return getFormItem(child, restOfPath);
        }
        default:
            throw new Error('getFormItem: Not implemented');
    }
};
export const getValue = (item, path = '') => {
    const child = getFormItem(item, path);
    if (!child) {
        return undefined;
    }
    return child.value;
};
export const existFormItem = (item, path) => {
    try {
        return !!getFormItem(item, path);
    }
    catch (error) {
        return false;
    }
};
export const setValue = (item, value, pathToField = '') => setValueInternal(item, value, pathToField);
export const setValueDoNotTouch = (item, value, pathToField = '') => setValueInternal(item, value, pathToField, {
    affectDirty: false
});
export const resetValue = (item, value = undefined, pathToField = '') => setValueInternal(item, value, pathToField, {
    initialization: true,
    compareValues: false,
});
export const setGroupField = (item, pathToGroupField, formItem) => setGroupFieldInternal(item, pathToGroupField, formItem);
export const insertListingFields = (item, pathToListing, newFields, atPosition) => {
    return updateListingFieldsInternal(item, pathToListing, (fields) => {
        let theNewFields = getAsValue(newFields);
        if (!(theNewFields instanceof Array)) {
            theNewFields = [theNewFields];
        }
        if (typeof atPosition !== 'number' || atPosition >= fields.length) {
            return fields.concat(theNewFields);
        }
        else {
            const pos = atPosition < 0 ? 0 : atPosition;
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
export const removeListingFields = (item, pathToListing, atPosition, count = 1) => {
    return updateListingFieldsInternal(item, pathToListing, (fields) => {
        return fields
            .slice(0, atPosition)
            .concat(fields.slice(atPosition + count));
    });
};
export const updateFormInfo = (item, pathToFormItem, updater) => updateFormInfoInternal(item, pathToFormItem, updater);
export const getAllErrors = (item) => getAllErrorsInternal(item);
//# sourceMappingURL=forms.js.map