import { ValueOrFunc } from './common';
import { FormGroup, FormGroupFields, FormListing, FormListingFields, FormItem, FormError, ExtraFormInfo } from './forms.interfaces';
export declare type PathStep = string | number;
export declare const matchGroupPath: (path: string, allowPatterns?: boolean) => {
    step: string;
    rest: string;
};
export declare const matchListingPath: (path: string, allowPatterns?: boolean) => {
    step: number;
    rest: string;
};
export declare const appendGroupPath: (groupPath: string, fieldName: string) => string;
export declare const appendListingPath: (listingPath: string, childIndex: number) => string;
export declare const createPath: (steps: (string | number)[]) => string;
export declare const createPathOf: (...steps: (string | number)[]) => string;
export declare const extractPath: (path: string, allowPatterns?: boolean) => (string | number)[];
export declare const checkPathInField: (path: string) => void;
export declare const locateInGroupOrFail: (item: FormGroup<any, FormGroupFields>, path: string, failIfNoChild?: boolean) => [string, FormItem<any>, string];
export declare const locateInListingOrFail: (item: FormListing<any, FormListingFields>, path: string, failIfNoChild?: boolean) => [number, FormItem<any>, string];
export declare const createGroupValue: (fields: FormGroupFields) => any;
export declare const createGroupInitValue: (fields: FormGroupFields) => any;
export declare const createListingValue: (fields: FormListingFields) => any[];
export declare const createListingInitValue: (fields: FormListingFields) => any[];
export interface SetValueOptions {
    affectDirty: boolean;
    compareValues: boolean;
    initialization: boolean;
}
export declare function setValueInternal(item: FormItem, value: ValueOrFunc, path: string, options?: Partial<SetValueOptions>): FormItem;
export declare function setInputInternal(item: FormItem, input: ValueOrFunc, path: string, options?: Partial<SetValueOptions>): FormItem;
export declare function setInfoInternal(item: FormItem, info: ValueOrFunc, path: string, options?: Partial<SetValueOptions>): FormItem;
export declare const setGroupFieldInternal: (item: FormItem<any>, path: string, formItem: ValueOrFunc<FormItem<any>>, options?: Partial<SetValueOptions>) => FormItem<any>;
export declare const updateListingFieldsInternal: (item: FormItem<any>, path: string, fields: ValueOrFunc<FormListingFields & FormItem<any>[]>, options?: Partial<SetValueOptions>) => FormItem<any>;
export declare const getAllErrorsInternalRec: (item: FormItem<any>, path: string) => FormError[];
export declare const updateFormInfoInternal: <I extends FormItem<any> = FormItem<any>>(item: I, pathToFormItem: string, updater: ValueOrFunc<Partial<ExtraFormInfo>>) => I;
export declare const getAllErrorsInternal: (item: FormItem<any>) => FormError[];
