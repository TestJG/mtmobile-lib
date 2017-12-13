import { flatMap } from 'lodash';
import { assign } from './common';
import { coerceAll } from './coercion';
import { mergeValidators } from './validation';
import {
    FormFieldInit,
    FormField,
    FormItem,
    FormItemState
} from './forms.interfaces';
import { updateDerived, setValueInternal } from './forms.utils';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Initializations                        //
//                                                            //
////////////////////////////////////////////////////////////////

export const field = <T = any>(
    initValue: T,
    options?: Partial<FormFieldInit<T>>
): FormField<T> => {
    const {
        caption,
        description,
        coerce: coerceInit,
        validations: validatorInit
    } = assign(
        <FormFieldInit<T>>{
            caption: '',
            description: '',
            coerce: undefined,
            validations: undefined
        },
        options
    );

    const coerce = coerceAll(coerceInit);
    const validator = mergeValidators(validatorInit);
    const value = coerce(initValue);
    const errors = validator(value);

    const result: FormField<T> = {
        // Type
        type: 'field',

        // Config
        caption,
        description,
        initValue,
        coerce,
        validator,

        // State
        value,
        errors,
        isDirty: false,
        isTouched: false,

        // Derived
        isValid: true,
        showErrors: false
    };

    return updateDerived(result);
};

export const setValue = <I extends FormItem = FormItem>(
    item: I,
    value: any,
    path: string = ''
): I => {
    return <I>setValueInternal(item, value, path);
};
