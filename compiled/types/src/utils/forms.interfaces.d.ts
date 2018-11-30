import { Coerce, CoerceInit } from './coercion';
import { Validator, ValidatorInit } from './validation';
import { Parser, Formatter } from './parsing';
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
    initInput: any;
    parser: Parser<T>;
    formatter: Formatter<T>;
    parserErrorText: string;
}
export interface FormFieldConfig<T = any> extends FormPartConfig<T> {
    type: 'field';
    initInput: any;
    parser: Parser<T>;
    formatter: Formatter<T>;
    parserErrorText: string;
}
export interface FormFieldState<T = any> extends FormFieldConfig<T>, FormPartState<T> {
    input: any;
    validInput: any;
    isValidInput: boolean;
}
export interface FormField<T> extends FormFieldState<T>, FormPart<T> {
}
export declare type FormGroupFields<T = any> = {
    [K in keyof T]: FormItem<T[K]>;
};
export interface FormGroupInit<T = any> extends FormPartInit<T> {
    initValue: T;
}
export interface FormGroup<T extends Object> extends FormPart<T> {
    type: "group";
    fields: FormGroupFields<T>;
}
export declare type FormListingFields<T = any> = FormItem<T>[];
export interface FormListingInit<T extends T[] = any[]> extends FormPartInit<T> {
    initValue: T;
}
export interface FormListing<T extends T[] = any[]> extends FormPart<T> {
    type: "listing";
    fields: FormListingFields<T[0]>;
}
export declare type FormItem<T = any> = FormField<T> | FormGroup<T> | FormListing;
export interface FormError {
    path: string;
    item: FormItem;
    errors: string[];
}
