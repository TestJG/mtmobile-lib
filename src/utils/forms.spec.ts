import { assignIfMany } from './common';
import {
    FormItemConfig,
    FormItemState,
    FormItem,
    FormItemType,
    FormField
} from './forms.interfaces';
import {
    field,
    group,
    setValue,
    getValue,
    getFormItem,
    existFormItem
} from './forms';
import {
    Coerce,
    mustNotBeBelow,
    mustNotBeAbove,
    mustBeBetween
} from './coercion';
import {
    Validator,
    shouldNotBeEmpty,
    shouldBeGreaterThanOrEqualTo,
    shouldBeLessThanOrEqualTo,
    shouldBeBetweenValues
} from './validation';
import {
    shallowEqualStrict,
    shouldNotBeGreaterThanOrEqualTo
} from '../mtmobile-lib';

interface Person {
    firstName: string;
    lastName: string;
    age: number;
}

const expectType = (item: FormItemConfig, expectedType: FormItemType) => {
    it('it should be defined', () => expect(item).not.toBeUndefined());

    it(`it's type should be ${expectedType}`, () =>
        expect(item.type).toBe(expectedType));
};

const expectConfig = <T>(
    item: FormItemConfig<T>,
    expected: Partial<{
        caption: string;
        description: string;
        initValue: T;
        validator: [T, string[]][] | Function;
        coerce: [T, T][] | Function;
    }>
) => {
    if (expected.caption !== undefined) {
        it(`it's caption should be ${JSON.stringify(expected.caption)}`, () =>
            expect(item.caption).toBe(expected.caption));
    }
    if (expected.description !== undefined) {
        it(`it's description should be ${JSON.stringify(
            expected.description
        )}`, () => expect(item.description).toBe(expected.description));
    }
    if (expected.initValue !== undefined) {
        it(`it's initValue should be ${JSON.stringify(
            expected.initValue
        )}`, () => expect(item.initValue).toEqual(expected.initValue));
    }
    if (expected.coerce !== undefined) {
        if (typeof expected.coerce === 'function') {
            it(`it's coerce should be the same as the given function`, () =>
                expect(item.coerce).toBe(expected.coerce));
        } else {
            it(`it's coerce should be a function`, () =>
                expect(item.coerce).toBeInstanceOf(Function));

            for (const [value, expectedValue] of expected.coerce) {
                it(`it's coerce(${JSON.stringify(
                    value
                )}) should return ${JSON.stringify(expectedValue)}`, () =>
                    expect(item.coerce(value)).toEqual(expectedValue));
            }
        }
    }
    if (expected.validator !== undefined) {
        if (typeof expected.validator === 'function') {
            it(`it's validator should be the same as the given function`, () =>
                expect(item.validator).toBe(expected.validator));
        } else {
            it(`it's validator should be a function`, () =>
                expect(item.validator).toBeInstanceOf(Function));

            for (const [value, expectedErrors] of expected.validator) {
                if (expectedErrors && expectedErrors.length) {
                    it(`it's validator(${JSON.stringify(
                        value
                    )}) should return some errors`, () =>
                        expect(item.validator(value)).toEqual(expectedErrors));
                } else {
                    it(`it's validator(${JSON.stringify(
                        value
                    )}) should not return any error`, () =>
                        expect(item.validator(value)).toEqual(expectedErrors));
                }
            }
        }
    }
};

const expectState = <T>(
    item: FormItemState<T>,
    expected: Partial<{
        value: T;
        isDirty: boolean;
        isTouched: boolean;
        errors: string[];
    }>
) => {
    if (expected.isDirty !== undefined) {
        it(`it's isDirty should be ${JSON.stringify(expected.isDirty)}`, () =>
            expect(item.isDirty).toBe(expected.isDirty));
    }
    if (expected.isTouched !== undefined) {
        it(`it's isTouched should be ${JSON.stringify(
            expected.isTouched
        )}`, () => expect(item.isTouched).toBe(expected.isTouched));
    }
    if (expected.value !== undefined) {
        it(`it's value should be ${JSON.stringify(expected.value)}`, () =>
            expect(item.value).toEqual(expected.value));
    }
    if (expected.errors !== undefined) {
        if (expected.errors.length) {
            it(`it's errors should contain errors`, () =>
                expect(item.errors).toEqual(expected.errors));
        } else {
            it(`it's errors should be empty`, () =>
                expect(item.errors).toEqual(expected.errors));
        }
    }
};

const expectDerived = <T>(
    item: FormItem<T>,
    expected: Partial<{
        isValid: boolean;
        showErrors: boolean;
    }>
) => {
    if (expected.isValid !== undefined) {
        it(`it's isValid should be ${JSON.stringify(expected.isValid)}`, () =>
            expect(item.isValid).toBe(expected.isValid));
    }
    if (expected.showErrors !== undefined) {
        it(`it's showErrors should be ${JSON.stringify(
            expected.showErrors
        )}`, () => expect(item.showErrors).toBe(expected.showErrors));
    }
};

// field
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('field', () => {
            it('should be a function', () =>
                expect(field).toBeInstanceOf(Function));

            describe('When a text field is created with default options', () => {
                const nameField = field('');

                expectType(nameField, 'field');

                expectConfig(nameField, {
                    caption: '',
                    description: '',
                    initValue: '',
                    coerce: [['', ''], ['abc', 'abc']],
                    validator: [['', []], ['abc', []]]
                });

                expectState(nameField, {
                    value: '',
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(nameField, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a numeric field is created with default options', () => {
                const ageField = field(10);

                expectType(ageField, 'field');

                expectConfig(ageField, {
                    caption: '',
                    description: '',
                    initValue: 10,
                    coerce: [[0, 0], [20, 20]],
                    validator: [[0, []], [20, []]]
                });

                expectState(ageField, {
                    value: 10,
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(ageField, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created with caption and description', () => {
                const ageField = field(10, {
                    caption: 'Age',
                    description: 'Age of the person'
                });

                expectConfig(ageField, {
                    caption: 'Age',
                    description: 'Age of the person'
                });
            });

            describe('When a field is created with coerce function and an initValue inside the coercion range', () => {
                const ageField = field(24, { coerce: mustNotBeBelow(18) });

                expectConfig(ageField, {
                    initValue: 24,
                    coerce: [[0, 18], [18, 18], [19, 19], [30, 30]]
                });

                expectState(ageField, { value: 24 });
            });

            describe('When a field is created with coerce function and an initValue outside the coercion range', () => {
                const ageField = field(10, { coerce: mustNotBeBelow(18) });

                expectConfig(ageField, { initValue: 10 });

                expectState(ageField, {
                    value: 18,
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(ageField, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created with coerce collection and an initValue outside the coercion range', () => {
                const ageField = field(30, {
                    coerce: [mustNotBeBelow(18), mustNotBeAbove(20)]
                });

                expectConfig(ageField, {
                    initValue: 30,
                    coerce: [[0, 18], [18, 18], [19, 19], [20, 20], [30, 20]]
                });

                expectState(ageField, {
                    value: 20,
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(ageField, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created with validator function and an initValue inside the validation range', () => {
                const ageField = field(24, {
                    validations: shouldBeGreaterThanOrEqualTo(18)
                });

                expectConfig(ageField, {
                    initValue: 24,
                    validator: [
                        [0, ['Should be greater than or equal to 18']],
                        [18, []],
                        [19, []],
                        [30, []]
                    ]
                });

                expectState(ageField, {
                    value: 24,
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });
            });

            describe('When a field is created with validator function and an initValue outside the validation range', () => {
                const ageField = field(10, {
                    validations: shouldBeGreaterThanOrEqualTo(18)
                });

                expectConfig(ageField, { initValue: 10 });

                expectState(ageField, {
                    value: 10,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be greater than or equal to 18']
                });

                expectDerived(ageField, {
                    isValid: false,
                    showErrors: false
                });
            });

            describe('When a field is created with validator collection and an initValue outside the validation range', () => {
                const ageField = field(30, {
                    validations: [
                        shouldBeGreaterThanOrEqualTo(18),
                        shouldBeLessThanOrEqualTo(20)
                    ]
                });

                expectConfig(ageField, {
                    initValue: 30,
                    validator: [
                        [0, ['Should be greater than or equal to 18']],
                        [18, []],
                        [19, []],
                        [20, []],
                        [30, ['Should be less than or equal to 20']]
                    ]
                });

                expectState(ageField, {
                    value: 30,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be less than or equal to 20']
                });

                expectDerived(ageField, {
                    isValid: false,
                    showErrors: false
                });
            });
        });
    });
});

// group
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('group', () => {
            it('should be a function', () =>
                expect(group).toBeInstanceOf(Function));

            describe('When a group is created with no fields and default options', () => {
                const aGroup = group({});

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: {},
                    coerce: [[{}, {}], [{ x: 1, y: 2 }, { x: 1, y: 2 }]],
                    validator: [[{}, []], [{ x: 1, y: 2 }, []]]
                });

                expectState(aGroup, {
                    value: {},
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(aGroup, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a group is created with caption and description', () => {
                const aGroup = group(
                    {},
                    {
                        caption: 'Personal',
                        description: 'Personal information'
                    }
                );

                expectConfig(aGroup, {
                    caption: 'Personal',
                    description: 'Personal information'
                });
            });

            describe('When a group is created with fields and no initValue', () => {
                const aGroup = group({
                    firstName: field(''),
                    lastName: field(''),
                    age: field(20)
                });

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: { firstName: '', lastName: '', age: 20 },
                    coerce: [[{}, {}], [{ x: 1, y: 2 }, { x: 1, y: 2 }]],
                    validator: [[{}, []], [{ x: 1, y: 2 }, []]]
                });

                expectState(aGroup, {
                    value: { firstName: '', lastName: '', age: 20 },
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(aGroup, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a group is created with initValue', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    {
                        initValue: <Person>{
                            firstName: 'John',
                            lastName: 'Smith',
                            age: 40
                        }
                    }
                );

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: { firstName: 'John', lastName: 'Smith', age: 40 }
                });

                expectState(aGroup, {
                    value: { firstName: 'John', lastName: 'Smith', age: 40 },
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(aGroup, {
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectState(aGroup.fields.firstName, {
                        value: 'John',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.firstName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectState(aGroup.fields.lastName, {
                        value: 'Smith',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.lastName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectState(aGroup.fields.age, {
                        value: 40,
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.age, {
                        isValid: true,
                        showErrors: false
                    });
                });
            });

            describe('When a group is created with coerce and initValue', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(10, { coerce: mustNotBeBelow(18) })
                    },
                    {
                        initValue: <Person>{
                            firstName: '',
                            lastName: '',
                            age: -40
                        },
                        coerce: person =>
                            assignIfMany(
                                person,
                                [!person.firstName, { firstName: 'Jane' }],
                                [!person.lastName, { lastName: 'Doe' }],
                                [person.age < 18, { age: 18 }]
                            )
                    }
                );

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: { firstName: '', lastName: '', age: -40 }
                });

                expectState(aGroup, {
                    value: { firstName: 'Jane', lastName: 'Doe', age: 18 },
                    isDirty: false,
                    isTouched: false,
                    errors: []
                });

                expectDerived(aGroup, {
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectState(aGroup.fields.firstName, {
                        value: 'Jane',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.firstName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectState(aGroup.fields.lastName, {
                        value: 'Doe',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.lastName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectState(aGroup.fields.age, {
                        value: 18,
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.age, {
                        isValid: true,
                        showErrors: false
                    });
                });
            });

            describe('When a group is created with validations and initValue', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(10, {
                            validations: shouldBeGreaterThanOrEqualTo(18)
                        })
                    },
                    {
                        initValue: <Person>{
                            firstName: '',
                            lastName: '',
                            age: -40
                        },
                        validations: [
                            person =>
                                shouldNotBeEmpty(
                                    'firstName should not be empty'
                                )(person.firstName),
                            person =>
                                shouldNotBeEmpty(
                                    'lastName should not be empty'
                                )(person.lastName),
                            person =>
                                shouldBeGreaterThanOrEqualTo(
                                    18,
                                    'age should be greater than 18'
                                )(person.age)
                        ]
                    }
                );

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: { firstName: '', lastName: '', age: -40 }
                });

                expectState(aGroup, {
                    value: { firstName: '', lastName: '', age: -40 },
                    isDirty: false,
                    isTouched: false,
                    errors: [
                        'firstName should not be empty',
                        'lastName should not be empty',
                        'age should be greater than 18'
                    ]
                });

                expectDerived(aGroup, {
                    isValid: false,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectState(aGroup.fields.firstName, {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.firstName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectState(aGroup.fields.lastName, {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: []
                    });

                    expectDerived(aGroup.fields.lastName, {
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectState(aGroup.fields.age, {
                        value: -40,
                        isDirty: false,
                        isTouched: false,
                        errors: ["Should be greater than or equal to 18"]
                    });

                    expectDerived(aGroup.fields.age, {
                        isValid: false,
                        showErrors: false
                    });
                });
            });

            // describe('When a group is created with coerce function and an initValue inside the coercion range', () => {
            //     const ageField = group(24, { coerce: mustNotBeBelow(18) });

            //     expectConfig(ageField, {
            //         initValue: 24,
            //         coerce: [[0, 18], [18, 18], [19, 19], [30, 30]]
            //     });

            //     expectState(ageField, { value: 24 });
            // });

            // describe('When a group is created with coerce function and an initValue outside the coercion range', () => {
            //     const ageField = group(10, { coerce: mustNotBeBelow(18) });

            //     expectConfig(ageField, { initValue: 10 });

            //     expectState(ageField, {
            //         value: 18,
            //         isDirty: false,
            //         isTouched: false,
            //         errors: []
            //     });

            //     expectDerived(ageField, {
            //         isValid: true,
            //         showErrors: false
            //     });
            // });

            // describe('When a group is created with coerce collection and an initValue outside the coercion range', () => {
            //     const ageField = group(30, {
            //         coerce: [mustNotBeBelow(18), mustNotBeAbove(20)]
            //     });

            //     expectConfig(ageField, {
            //         initValue: 30,
            //         coerce: [[0, 18], [18, 18], [19, 19], [20, 20], [30, 20]]
            //     });

            //     expectState(ageField, {
            //         value: 20,
            //         isDirty: false,
            //         isTouched: false,
            //         errors: []
            //     });

            //     expectDerived(ageField, {
            //         isValid: true,
            //         showErrors: false
            //     });
            // });

            // describe('When a group is created with validator function and an initValue inside the validation range', () => {
            //     const ageField = group(24, {
            //         validations: shouldBeGreaterThanOrEqualTo(18)
            //     });

            //     expectConfig(ageField, {
            //         initValue: 24,
            //         validator: [
            //             [0, ['Should be greater than or equal to 18']],
            //             [18, []],
            //             [19, []],
            //             [30, []]
            //         ]
            //     });

            //     expectState(ageField, {
            //         value: 24,
            //         isDirty: false,
            //         isTouched: false,
            //         errors: []
            //     });
            // });

            // describe('When a group is created with validator function and an initValue outside the validation range', () => {
            //     const ageField = group(10, {
            //         validations: shouldBeGreaterThanOrEqualTo(18)
            //     });

            //     expectConfig(ageField, { initValue: 10 });

            //     expectState(ageField, {
            //         value: 10,
            //         isDirty: false,
            //         isTouched: false,
            //         errors: ['Should be greater than or equal to 18']
            //     });

            //     expectDerived(ageField, {
            //         isValid: false,
            //         showErrors: false
            //     });
            // });

            // describe('When a group is created with validator collection and an initValue outside the validation range', () => {
            //     const ageField = group(30, {
            //         validations: [
            //             shouldBeGreaterThanOrEqualTo(18),
            //             shouldBeLessThanOrEqualTo(20)
            //         ]
            //     });

            //     expectConfig(ageField, {
            //         initValue: 30,
            //         validator: [
            //             [0, ['Should be greater than or equal to 18']],
            //             [18, []],
            //             [19, []],
            //             [20, []],
            //             [30, ['Should be less than or equal to 20']]
            //         ]
            //     });

            //     expectState(ageField, {
            //         value: 30,
            //         isDirty: false,
            //         isTouched: false,
            //         errors: ['Should be less than or equal to 20']
            //     });

            //     expectDerived(ageField, {
            //         isValid: false,
            //         showErrors: false
            //     });
            // });
        });
    });
});

// setValue
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('setValue', () => {
            it('should be a function', () =>
                expect(setValue).toBeInstanceOf(Function));

            describe('When a field is created and a the same init value is assigned', () => {
                const ageField = field(40, {
                    coerce: [mustNotBeBelow(0), mustNotBeAbove(100)],
                    validations: [
                        shouldBeGreaterThanOrEqualTo(18),
                        shouldBeLessThanOrEqualTo(60)
                    ]
                });
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeField = setValue(ageField, 40);

                it('the new field should be the same as the original one', () =>
                    expect(newAgeField).toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));
            });

            describe('When a field is created and a new distinct valid value is assigned', () => {
                const ageField = field(40, {
                    coerce: [mustNotBeBelow(0), mustNotBeAbove(100)],
                    validations: [
                        shouldBeGreaterThanOrEqualTo(18),
                        shouldBeLessThanOrEqualTo(60)
                    ]
                });
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeField = setValue(ageField, 50);

                it('the new field should be distinct from the original one', () =>
                    expect(newAgeField).not.toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));

                expectConfig(newAgeField, {
                    initValue: 40,
                    coerce: ageField.coerce,
                    validator: ageField.validator
                });

                expectState(newAgeField, {
                    value: 50,
                    isDirty: true,
                    isTouched: true,
                    errors: []
                });

                expectDerived(newAgeField, {
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created and a new distinct invalid value is assigned', () => {
                const ageField = field(40, {
                    coerce: [mustNotBeBelow(0), mustNotBeAbove(100)],
                    validations: [
                        shouldBeGreaterThanOrEqualTo(18),
                        shouldBeLessThanOrEqualTo(60)
                    ]
                });
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeField = setValue(ageField, 10);

                it('the new field should be distinct from the original one', () =>
                    expect(newAgeField).not.toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));

                expectConfig(newAgeField, {
                    initValue: 40,
                    coerce: ageField.coerce,
                    validator: ageField.validator
                });

                expectState(newAgeField, {
                    value: 10,
                    isDirty: true,
                    isTouched: true,
                    errors: ['Should be greater than or equal to 18']
                });

                expectDerived(newAgeField, {
                    isValid: false,
                    showErrors: true
                });
            });

            describe('When a field is created and a coerceable value to the same old value is assigned', () => {
                const ageField = field(0, {
                    coerce: [mustNotBeBelow(0), mustNotBeAbove(100)],
                    validations: [
                        shouldBeGreaterThanOrEqualTo(18),
                        shouldBeLessThanOrEqualTo(60)
                    ]
                });
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeField = setValue(ageField, -10);

                it('the new field should be distinct from the original one', () =>
                    expect(newAgeField).not.toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));

                expectConfig(newAgeField, {
                    initValue: 0,
                    coerce: ageField.coerce,
                    validator: ageField.validator
                });

                expectState(newAgeField, {
                    value: 0,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be greater than or equal to 18']
                });

                expectDerived(newAgeField, {
                    isValid: false,
                    showErrors: false
                });
            });
        });
    });
});

// getValue
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('getValue', () => {
            it('should be a function', () =>
                expect(getValue).toBeInstanceOf(Function));

            describe('When a field is created', () => {
                const ageField = field(40);

                it("it should return the field's value", () =>
                    expect(getValue(ageField)).toBe(40));
            });
        });
    });
});

// getFormItem
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('getFormItem', () => {
            it('should be a function', () =>
                expect(getFormItem).toBeInstanceOf(Function));

            describe('When a field is created', () => {
                const ageField = field(40);

                it("with path '' it should return the field itself", () =>
                    expect(getFormItem(ageField, '')).toBe(ageField));
            });
        });
    });
});

// existFormItem
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('existFormItem', () => {
            it('should be a function', () =>
                expect(existFormItem).toBeInstanceOf(Function));

            describe('When a field is created', () => {
                const ageField = field(40);

                it("with path '' it should return the field itself", () =>
                    expect(existFormItem(ageField, '')).toBeTruthy());
            });
        });
    });
});
