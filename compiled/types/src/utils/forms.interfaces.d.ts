import { Coerce, CoerceInit } from './coercion';
import { Validator, ValidatorInit } from './validation';
export interface ExtraFormInfo {
    caption: string;
    description: string;
    info: any;
}
export interface FormPartInit<T = any> extends ExtraFormInfo {
    validations: ValidatorInit<T>;
    coerce: CoerceInit<T>;
}
export interface FormPartConfig<T = any> extends ExtraFormInfo {
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
export interface UpdateFormItemData {
    relativePath: string;
}
export interface FormFieldInit<T = any> extends FormPartInit<T> {
}
export interface FormFieldConfig<T = any> extends FormPartConfig<T> {
    type: 'field';
}
export interface FormFieldState<T = any> extends FormFieldConfig<T>, FormPartState<T> {
}
export interface FormField<T = any> extends FormFieldState<T>, FormPart<T> {
}
export interface FormGroupValuesMapping {
    [name: string]: any;
}
export interface FormGroupFieldStates {
    [name: string]: FormItemState;
}
export interface FormGroupFields {
    [name: string]: FormItem;
}
export interface FormGroupInit<T = any> extends FormPartInit<T> {
    initValue: T;
}
export interface FormGroupConfig<T = any> extends FormPartConfig<T> {
    type: 'group';
}
export interface FormGroupState<T = any, F extends FormGroupFieldStates = FormGroupFieldStates> extends FormGroupConfig<T>, FormPartState<T> {
    fields: F;
}
export interface FormGroup<T = any, F extends FormGroupFields = FormGroupFields> extends FormGroupState<T>, FormPart<T> {
    fields: F;
}
export declare type FormListingValuesMapping = Array<any>;
export interface FormListingFieldStates {
    [index: number]: FormItemState;
}
export interface FormListingFields {
    [index: number]: FormItem;
}
export interface FormListingInit<T = any> extends FormPartInit<T> {
    initValue: T;
}
export interface FormListingConfig<T = any> extends FormPartConfig<T> {
    type: 'listing';
}
export interface FormListingState<T = any, F extends FormListingFieldStates = FormListingFieldStates> extends FormListingConfig<T>, FormPartState<T> {
    fields: F;
}
export interface FormListing<T = any, F extends FormListingFields = FormListingFields> extends FormListingState<T>, FormPart<T> {
    fields: F;
}
export declare type FormItemType = 'field' | 'group' | 'listing';
export declare type FormItemConfig<T = any> = FormFieldConfig<T> | FormGroupConfig<T> | FormListingConfig<T>;
export declare type FormItemState<T = any> = FormFieldState<T> | FormGroupState<T> | FormListingState<T>;
export declare type FormItem<T = any> = FormField<T> | FormGroup<T> | FormListing<T>;
export interface FormError {
    path: string;
    item: FormItem;
    errors: string[];
}
