import { Coerce, CoerceInit } from './coercion';
import { Validator, ValidatorInit } from './validation';
import { Parser, Formatter } from './parsing';

////////////////////////////////////////////////////////////////
//                                                            //
//                     Abstract Interfaces                    //
//                                                            //
////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////
//                                                            //
//                     Field Interfaces                       //
//                                                            //
////////////////////////////////////////////////////////////////

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

export interface FormFieldState<T = any>
    extends FormFieldConfig<T>,
        FormPartState<T> {
    input: any;
    validInput: any;
    isValidInput: boolean;
}

export interface FormField<T = any> extends FormFieldState<T>, FormPart<T> {}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Group Interfaces                       //
//                                                            //
////////////////////////////////////////////////////////////////

// export interface FormGroupValuesMapping {
//     [name: string]: any;
// }

// export interface FormGroupFieldStates {
//     [name: string]: FormItemState;
// }

export type FormGroupFields<T = any> = { [K in keyof T]: FormItem<T[K]> };

export interface FormGroupInit<T = any> extends FormPartInit<T> {
    initValue: T;
}

export interface FormGroupConfig<T = any> extends FormPartConfig<T> {
    type: 'group';
}

// export interface FormGroupState<
//     T = any,
//     F extends FormGroupFieldStates = FormGroupFieldStates
// > extends FormGroupConfig<T>, FormPartState<T> {
//     fields: F;
// }

export interface FormGroup<T extends Object = any> extends FormPart<T> {
    type: 'group';
    fields: FormGroupFields<T>;
}
// export interface FormGroup<
//     T = any,
//     F extends FormGroupFields = FormGroupFields
// > extends FormGroupState<T>, FormPart<T> {
//     fields: F;
// }

////////////////////////////////////////////////////////////////
//                                                            //
//                     Listing Interfaces                     //
//                                                            //
////////////////////////////////////////////////////////////////

// export type FormListingValuesMapping = Array<any>;

// export interface FormListingFieldStates {
//     [index: number]: FormItemState;
// }

// export interface FormListingFields {
//     [index: number]: FormItem;
// }

// type ArrayItem<T extends any[]> = T[keyof T];

export type FormListingFields<T extends unknown[] = any> = FormItem<T[number]>[];

export interface FormListingInit<T extends unknown[] = any> extends FormPartInit<T> {
    initValue: T;
}

export interface FormListingConfig<T extends unknown[] = any> extends FormPartConfig<T> {
    type: 'listing';
}

// export interface FormListingState<
//     T = any,
//     F extends FormListingFieldStates = FormListingFieldStates
// > extends FormListingConfig<T>, FormPartState<T> {
//     fields: F;
// }

export interface FormListing<T extends unknown[] = any>
    extends FormPart<T>,
        FormListingConfig<T> {
    fields: FormListingFields<T>;
}

////////////////////////////////////////////////////////////////
//                                                            //
//                     Combined Types                         //
//                                                            //
////////////////////////////////////////////////////////////////

export type FormItemType = 'field' | 'group' | 'listing';

export type FormItemConfig<T = any> =
    | FormFieldConfig<T>
    | FormGroupConfig<T>
    | (T extends unknown[] ? FormListingConfig<T> : never);

// export type FormItemState<T = any> =
//     | FormFieldState<T>
//     | FormGroupState<T>
//     | FormListingState<T>;

export type FormItem<T extends any = any> =
    | FormField<T>
    | FormGroup<T>
    | (T extends unknown[] ? FormListing<T> : never);

export interface FormError<T = any> {
    path: string;
    item: FormItem<T>;
    errors: string[];
}
