import * as common from './common';
import {
    field,
    group,
    list,
    FormField,
    FormGroup,
    FormList
} from './formUtils';

describe('Utils', () => {
    describe('Form Utils Tests', () => {
        describe('field', () => {
            it('should be a function', () => {
                expect(field).toBeInstanceOf(Function);
            });
            describe('when a field with no options is created', () => {
                let ageField: FormField<number>;
                beforeAll(() => (ageField = field(18)));
                it('it should not be undefined', () =>
                    expect(ageField).not.toBeUndefined());
                it('it should have type "field"', () =>
                    expect(ageField.type).toEqual('field'));
                it('it should have init value 18', () =>
                    expect(ageField.initValue).toEqual(18));
                it('it should have value 18', () =>
                    expect(ageField.value).toEqual(18));
                it('it should have empty caption', () =>
                    expect(ageField.caption).toEqual(''));
                it('it should have empty description', () =>
                    expect(ageField.description).toEqual(''));
                it('it should not be dirty', () =>
                    expect(ageField.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(ageField.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(ageField.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(ageField.showError).not.toBeTruthy());
                it("it's errors should be an empty array", () =>
                    expect(ageField.errors).toEqual([]));
                it("it's validators should be a function", () =>
                    expect(ageField.validator).toBeInstanceOf(Function));
                it("it's sameValue should be a function", () =>
                    expect(ageField.sameValue).toBeInstanceOf(Function));
                it("it's coerce should be a function", () =>
                    expect(ageField.coerce).toBeInstanceOf(Function));
                it('any value should be coerced to the same value', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(ageField.coerce(v)).toEqual(v)
                    ));
                it('any value should be valid', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(ageField.validator(v)).toEqual([])
                    ));
            });
            describe('when a field with caption and description is created', () => {
                let ageField: FormField<number>;
                beforeAll(() => ageField = field(18, {
                    caption: 'Age',
                    description: 'Age of the person'
                }));
                it("it's caption should be the same as the option's", () =>
                    expect(ageField.caption).toEqual('Age'));
                it("it's description should be the same as the option's", () =>
                    expect(ageField.description).toEqual('Age of the person'));
            });
            describe('when a field with coerce function is created', () => {
                let ageField: FormField<number>;
                beforeAll(() => ageField = field(10, {
                    coerce: age => Math.max(18, age)
                }));
                it('it should have init value 10', () =>
                    expect(ageField.initValue).toEqual(10));
                it('it should have a coerced value 18', () =>
                    expect(ageField.value).toEqual(18));
                it("it's coerce should be a function", () =>
                    expect(ageField.coerce).toBeInstanceOf(Function));
                it('it should not be dirty', () =>
                    expect(ageField.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(ageField.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(ageField.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(ageField.showError).not.toBeTruthy());
                it('any value should be coerced a valid value', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(ageField.coerce(v)).toBeGreaterThanOrEqual(18)
                    ));
            });
            describe('when a field with coerce function array is created', () => {
                let ageField: FormField<number>;
                beforeAll(() => ageField = field(100, {
                    coerce: [age => Math.max(18, age), age => Math.min(90, age)]
                }));
                it('it should have init value 100', () =>
                    expect(ageField.initValue).toEqual(100));
                it('it should have a coerced value 90', () =>
                    expect(ageField.value).toEqual(90));
                it("it's coerce should be a function", () =>
                    expect(ageField.coerce).toBeInstanceOf(Function));
                it('it should not be dirty', () =>
                    expect(ageField.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(ageField.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(ageField.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(ageField.showError).not.toBeTruthy());
                it('any value should be coerced a valid value', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v => {
                        expect(ageField.coerce(v)).toBeGreaterThanOrEqual(18);
                        expect(ageField.coerce(v)).toBeLessThanOrEqual(90);
                    }));
            });
        });
        describe('group', () => {
            it('should be a function', () => {
                expect(group).toBeInstanceOf(Function);
            });
            describe('when a group with no options is created', () => {
                let aGroup: FormGroup<any>;
                beforeAll(() => aGroup = group({}));
                it('it should not be undefined', () =>
                    expect(aGroup).not.toBeUndefined());
                it('it should have type "group"', () =>
                    expect(aGroup.type).toEqual('group'));
                it('it should have init value undefined', () =>
                    expect(aGroup.initValue).toEqual(undefined));
                it('it should have value {}', () =>
                    expect(aGroup.value).toEqual({}));
                it('it should have empty caption', () =>
                    expect(aGroup.caption).toEqual(''));
                it('it should have empty description', () =>
                    expect(aGroup.description).toEqual(''));
                it('it should not be dirty', () =>
                    expect(aGroup.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(aGroup.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(aGroup.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(aGroup.showError).not.toBeTruthy());
                it("it's errors should be an empty array", () =>
                    expect(aGroup.errors).toEqual([]));
                it("it's sameValue should be a function", () =>
                    expect(aGroup.sameValue).toBeInstanceOf(Function));
                it("it's validators should be a function", () =>
                    expect(aGroup.validator).toBeInstanceOf(Function));
                it("it's coerce should be a function", () =>
                    expect(aGroup.coerce).toBeInstanceOf(Function));
                it('any value should be coerced to the same value', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(aGroup.coerce(v)).toEqual(v)
                    ));
                it('any value should be valid', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(aGroup.validator(v)).toEqual([])
                    ));
            });
            describe('when a group with caption and description is created', () => {
                let aGroup: FormGroup<any>;
                beforeAll(() => aGroup = group(
                    {},
                    {
                        caption: 'Person',
                        description: 'Personal description'
                    }
                ));
                it("it's caption should be the same as the option's", () =>
                    expect(aGroup.caption).toEqual('Person'));
                it("it's description should be the same as the option's", () =>
                    expect(aGroup.description).toEqual('Personal description'));
            });
            describe('when a group with fields is created', () => {
                let aGroup: FormGroup<any>;
                beforeAll(() => aGroup = group({
                    firstName: field(''),
                    lastName: field(''),
                    age: field(18)
                }));
                it('it should have init value undefined', () =>
                    expect(aGroup.initValue).toEqual(undefined));
                it('it should have value with given fields', () =>
                    expect(aGroup.value).toEqual({
                        firstName: '',
                        lastName: '',
                        age: 18
                    }));
                it('it should not be dirty', () =>
                    expect(aGroup.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(aGroup.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(aGroup.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(aGroup.showError).not.toBeTruthy());
            });
        });
        describe('list', () => {
            it('should be a function', () => {
                expect(list).toBeInstanceOf(Function);
            });
            describe('when a list with no options is created', () => {
                let aList: FormList<any>;
                beforeAll(() => aList = list([]));
                it('it should not be undefined', () =>
                    expect(aList).not.toBeUndefined());
                it('it should have type "list"', () =>
                    expect(aList.type).toEqual('list'));
                it('it should have init value undefined', () =>
                    expect(aList.initValue).toEqual(undefined));
                it('it should have value {}', () =>
                    expect(aList.value).toEqual({}));
                it('it should have empty caption', () =>
                    expect(aList.caption).toEqual(''));
                it('it should have empty description', () =>
                    expect(aList.description).toEqual(''));
                it('it should not be dirty', () =>
                    expect(aList.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(aList.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(aList.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(aList.showError).not.toBeTruthy());
                it("it's errors should be an empty array", () =>
                    expect(aList.errors).toEqual([]));
                it("it's sameValue should be a function", () =>
                    expect(aList.sameValue).toBeInstanceOf(Function));
                it("it's validators should be a function", () =>
                    expect(aList.validator).toBeInstanceOf(Function));
                it("it's coerce should be a function", () =>
                    expect(aList.coerce).toBeInstanceOf(Function));
                it('any value should be coerced to the same value', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(aList.coerce(v)).toEqual(v)
                    ));
                it('any value should be valid', () =>
                    [0, 1, -1, 100, -100, 1e20, 1e-20].forEach(v =>
                        expect(aList.validator(v)).toEqual([])
                    ));
            });
            describe('when a list with caption and description is created', () => {
                let aList: FormList<any>;
                beforeAll(() => aList = list([], {
                    caption: 'Person',
                    description: 'Personal description'
                }));
                it("it's caption should be the same as the option's", () =>
                    expect(aList.caption).toEqual('Person'));
                it("it's description should be the same as the option's", () =>
                    expect(aList.description).toEqual('Personal description'));
            });
            describe('when a list with fields is created', () => {
                let aList: FormList<any>;
                beforeAll(() => aList = list([field(''), field(''), field(18)]));
                it('it should have init value undefined', () =>
                    expect(aList.initValue).toEqual(undefined));
                it('it should have value with given fields', () =>
                    expect(aList.value).toEqual({
                        firstName: '',
                        lastName: '',
                        age: 18
                    }));
                it('it should not be dirty', () =>
                    expect(aList.isDirty).toBeFalsy());
                it('it should not be touched', () =>
                    expect(aList.isTouched).toBeFalsy());
                it('it should be valid', () =>
                    expect(aList.isValid).toBeTruthy());
                it('it should not show errors', () =>
                    expect(aList.showError).not.toBeTruthy());
            });
        });
    });
});
