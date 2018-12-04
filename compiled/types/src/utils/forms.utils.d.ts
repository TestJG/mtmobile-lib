import { ValueOrFunc } from './common';
import { FormGroup, FormGroupFields, FormListing, FormItem, FormError, ExtraFormInfo } from './forms.interfaces';
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
export declare const locateInGroupOrFail: <T>(item: FormGroup<T>, path: string, failIfNoChild?: boolean) => [keyof T, FormItem<T[keyof T]>, string];
export declare const locateInListingOrFail: <T extends any[]>(item: FormListing<T>, path: string, failIfNoChild?: boolean) => [number, FormItem<T[0]>, string];
export declare const createGroupValue: (fields: FormGroupFields<any>) => any;
export declare const createGroupInitValue: (fields: FormGroupFields<any>) => any;
export declare const createListingValue: <T>(fields: FormItem<T>[]) => T[];
export declare const createListingInitValue: <T extends any[]>(fields: FormItem<T[0]>[]) => (T[0] | T[0][])[];
export interface SetValueOptions {
    affectDirty: boolean;
    compareValues: boolean;
    initialization: boolean;
}
export declare function setValueInternal<T = any>(item: FormItem<T>, value: ValueOrFunc<T>, path: string, options?: Partial<SetValueOptions>): FormItem<T>;
export declare function setInputInternal(item: FormItem, input: ValueOrFunc, path: string, options?: Partial<SetValueOptions>): FormItem;
export declare function setInfoInternal(item: FormItem, info: ValueOrFunc, path: string, options?: Partial<SetValueOptions>): FormItem;
export declare const setGroupFieldInternal: (item: FormItem<any>, path: string, formItem: ValueOrFunc<FormItem<any>>, options?: Partial<SetValueOptions>) => FormItem<any>;
export declare const updateListingFieldsInternal: (item: FormItem<any>, path: string, fields: ValueOrFunc<FormItem<any>[]>, options?: Partial<SetValueOptions>) => FormItem<any>;
export declare const getAllErrorsInternalRec: (item: FormItem<any>, path: string) => FormError[];
export declare const updateFormInfoInternal: <I extends FormItem<any> = FormItem<any>>(item: I, pathToFormItem: string, updater: ValueOrFunc<Partial<ExtraFormInfo>>) => I;
export declare const getAllErrorsInternal: (item: FormItem<any>) => FormError[];
