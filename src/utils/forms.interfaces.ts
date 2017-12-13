import { Coerce, CoerceInit } from './coercion';
import { Validator, ValidatorInit } from './validation';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Abstract Interfaces                    //
//                                                            //
////////////////////////////////////////////////////////////////

export interface FormPartInit<T = any> {
    caption: string;
    description: string;
    validations: ValidatorInit<T>;
    coerce: CoerceInit<T>;
}

export interface FormPartConfig<T = any> {
    caption: string;
    description: string;
    initValue: T;
    validator: Validator<T>;
    coerce: Coerce<T>;
}

export interface FormPartState<T = any> extends FormPartConfig<T> {
    value: T;
    isDirty: boolean;
    isTouched: boolean;
    errors: string[];
}

export interface FormPart<T = any> extends FormPartState<T> {
    isValid: boolean;
    showErrors: boolean;
}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Field Interfaces                       //
//                                                            //
////////////////////////////////////////////////////////////////

export interface FormFieldInit<T = any> extends FormPartInit<T> {}

export interface FormFieldConfig<T = any> extends FormPartConfig<T> {
    type: 'field';
}

export interface FormFieldState<T = any>
    extends FormFieldConfig<T>,
        FormPartState<T> {}

export interface FormField<T = any> extends FormFieldState<T>, FormPart<T> {}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Group Interfaces                       //
//                                                            //
////////////////////////////////////////////////////////////////

export interface FormGroupValuesMapping {
    [name: string]: any;
}

export interface FormGroupFieldStates {
    [name: string]: FormItemState;
}

export interface FormGroupFields {
    [name: string]: FormItem;
}

export interface FormGroupConfig<T = any> extends FormPartConfig<T> {
    type: 'group';
}

export interface FormGroupState<
    T = any,
    F extends FormGroupFieldStates = FormGroupFieldStates
> extends FormGroupConfig<T>, FormPartState<T> {
    fields: F;
}

export interface FormGroup<
    T = any,
    F extends FormGroupFields = FormGroupFields
> extends FormGroupState<T>, FormPart<T> {
    fields: F;
}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Listing Interfaces                     //
//                                                            //
////////////////////////////////////////////////////////////////

export type FormListingValuesMapping = Array<any>;

export type FormListingFieldStates = Array<FormItemState>;

export type FormListingFields = Array<FormItem>;

export interface FormListingConfig<T = any> extends FormPartConfig<T> {
    type: 'listing';
}

export interface FormListingState<T = any>
    extends FormListingConfig<T>,
        FormPartState<T> {
    fields: FormListingFieldStates;
}

export interface FormListing<T = any> extends FormListingState<T>, FormPart<T> {
    fields: FormListingFields;
}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Combined Types                         //
//                                                            //
////////////////////////////////////////////////////////////////

export type FormItemType = 'field' | 'group' | 'listing';

export type FormItemConfig<T = any> = FormFieldConfig<T>;

export type FormItemState<T = any> = FormFieldState<T>;

export type FormItem<T = any> = FormField<T>;
