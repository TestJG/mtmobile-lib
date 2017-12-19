import {
    assignIfMany,
    assignArrayIfMany,
    assignOrSame,
    assignArrayOrSame,
    FormItemConfig,
    FormItemState,
    FormItem,
    FormItemType,
    FormField,
    FormError,
    field,
    group,
    listing,
    setValue,
    setValueDoNotTouch,
    resetValue,
    getValue,
    getFormItem,
    existFormItem,
    setGroupField,
    insertListingFields,
    removeListingFields,
    getAllErrors,
    Coerce,
    mustNotBeBelow,
    mustNotBeAbove,
    mustBeBetween,
    Validator,
    shouldBe,
    shouldNotBeEmpty,
    shouldBeGreaterThanOrEqualTo,
    shouldBeLessThanOrEqualTo,
    shouldBeBetweenValues,
    shouldNotBeBlank,
    shouldBeLongerThan
} from '../../src/utils';

interface Person {
    firstName: string;
    lastName: string;
    age: number;
}

const newPers = (firstName: string, lastName: string, age: number): Person => ({
    firstName,
    lastName,
    age
});

const newPersPets = (
    firstName: string,
    lastName: string,
    age: number,
    pets: Pet[]
) => Object.assign(newPers(firstName, lastName, age), { pets });

interface Pet {
    name: string;
    kind: string;
}

const newPet = (name: string, kind: string): Pet => ({ name, kind });

type PersonArray = [string, string, number];
type PersonArrayForm = [
    FormField<string>,
    FormField<string>,
    FormField<number>
];

const expectType = (item: FormItemConfig, expectedType: FormItemType) => {
    it('it should be defined', () => expect(item).not.toBeUndefined());

    it(`it's type should be ${expectedType}`, () =>
        expect(item.type).toBe(expectedType));
};

const expectConfig = <T>(
    item: FormItem<T>,
    expected: Partial<{
        caption: string;
        description: string;
        initValue: T;
        validator: [T, string[]][] | Function;
        coerce: [T, T][] | Function;
        value: T;
        isDirty: boolean;
        isTouched: boolean;
        errors: string[];
        isValid: boolean;
        showErrors: boolean;
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
                    validator: [['', []], ['abc', []]],
                    value: '',
                    isDirty: false,
                    isTouched: false,
                    errors: [],
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
                    validator: [[0, []], [20, []]],
                    value: 10,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
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
                    coerce: [[0, 18], [18, 18], [19, 19], [30, 30]],
                    value: 24
                });
            });

            describe('When a field is created with coerce function and an initValue outside the coercion range', () => {
                const ageField = field(10, { coerce: mustNotBeBelow(18) });

                expectConfig(ageField, {
                    initValue: 18,
                    value: 18,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created with coerce collection and an initValue outside the coercion range', () => {
                const ageField = field(30, {
                    coerce: [mustNotBeBelow(18), mustNotBeAbove(20)]
                });

                expectConfig(ageField, {
                    initValue: 20,
                    coerce: [[0, 18], [18, 18], [19, 19], [20, 20], [30, 20]],
                    value: 20,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
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
                    ],
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

                expectConfig(ageField, {
                    initValue: 10,
                    value: 10,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be greater than or equal to 18'],
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
                    ],
                    value: 30,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be less than or equal to 20'],
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
                    validator: [[{}, []], [{ x: 1, y: 2 }, []]],
                    value: {},
                    isDirty: false,
                    isTouched: false,
                    errors: [],
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
                    initValue: newPers('', '', 20),
                    coerce: [[{}, {}], [{ x: 1, y: 2 }, { x: 1, y: 2 }]],
                    validator: [[{}, []], [{ x: 1, y: 2 }, []]],
                    value: newPers('', '', 20),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
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
                        initValue: newPers('John', 'Smith', 40)
                    }
                );

                expectType(aGroup, 'group');

                expectConfig(aGroup, {
                    caption: '',
                    description: '',
                    initValue: newPers('John', 'Smith', 40),
                    value: newPers('John', 'Smith', 40),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aGroup.fields.firstName, {
                        value: 'John',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aGroup.fields.lastName, {
                        value: 'Smith',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aGroup.fields.age, {
                        value: 40,
                        isDirty: false,
                        isTouched: false,
                        errors: [],
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
                        initValue: newPers('', '', -40),
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
                    initValue: newPers('Jane', 'Doe', 18),
                    value: newPers('Jane', 'Doe', 18),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aGroup.fields.firstName, {
                        initValue: 'Jane',
                        value: 'Jane',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aGroup.fields.lastName, {
                        initValue: 'Doe',
                        value: 'Doe',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aGroup.fields.age, {
                        initValue: 18,
                        value: 18,
                        isDirty: false,
                        isTouched: false,
                        errors: [],
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
                        initValue: newPers('', '', -40),
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
                    initValue: newPers('', '', -40),
                    value: newPers('', '', -40),
                    isDirty: false,
                    isTouched: false,
                    errors: [
                        'firstName should not be empty',
                        'lastName should not be empty',
                        'age should be greater than 18'
                    ],
                    isValid: false,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aGroup.fields.firstName, {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aGroup.fields.lastName, {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aGroup.fields.age, {
                        value: -40,
                        isDirty: false,
                        isTouched: false,
                        errors: ['Should be greater than or equal to 18'],
                        isValid: false,
                        showErrors: false
                    });
                });
            });
        });
    });
});

// listing
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('listing', () => {
            it('should be a function', () =>
                expect(listing).toBeInstanceOf(Function));

            describe('When a listing is created with no fields and default options', () => {
                const aListing = listing([]);

                expectType(aListing, 'listing');

                expectConfig(aListing, {
                    caption: '',
                    description: '',
                    initValue: [],
                    coerce: [[[], []], [[1, 2], [1, 2]]],
                    validator: [[[], []], [[1, 2], []]],
                    value: [],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created with caption and description', () => {
                const aListing = listing([], {
                    caption: 'Personal',
                    description: 'Personal information'
                });

                expectConfig(aListing, {
                    caption: 'Personal',
                    description: 'Personal information'
                });
            });

            describe('When a listing is created with fields and no initValue', () => {
                const aListing = listing([field(''), field(''), field(20)]);

                expectType(aListing, 'listing');

                expectConfig(aListing, {
                    initValue: ['', '', 20],
                    coerce: [[[], []], [[1, 2], [1, 2]]],
                    validator: [[[], []], [[1, 2], []]],
                    value: ['', '', 20],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created with initValue', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    {
                        initValue: <PersonArray>['John', 'Smith', 40]
                    }
                );

                expectType(aListing, 'listing');

                expectConfig(aListing, {
                    initValue: ['John', 'Smith', 40],
                    value: ['John', 'Smith', 40],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aListing.fields[0], {
                        value: 'John',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aListing.fields[1], {
                        value: 'Smith',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aListing.fields[2], {
                        value: 40,
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });
            });

            describe('When a listing is created with coerce and initValue', () => {
                const aListing = listing(
                    <PersonArrayForm>[
                        field(''),
                        field(''),
                        field(10, { coerce: mustNotBeBelow(18) })
                    ],
                    {
                        initValue: <PersonArray>['', '', -40],
                        coerce: (person: PersonArray) =>
                            assignArrayIfMany(
                                person,
                                [!person[0], [0, ['Jane']]],
                                [!person[1], [1, ['Doe']]],
                                [person[2] < 18, [2, [18]]]
                            )
                    }
                );

                expectType(aListing, 'listing');

                expectConfig(aListing, {
                    initValue: ['Jane', 'Doe', 18],
                    value: ['Jane', 'Doe', 18],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aListing.fields[0], {
                        initValue: 'Jane',
                        value: 'Jane',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aListing.fields[1], {
                        initValue: 'Doe',
                        value: 'Doe',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aListing.fields[2], {
                        initValue: 18,
                        value: 18,
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });
            });

            describe('When a listing is created with validations and initValue', () => {
                const aListing = listing(
                    <PersonArrayForm>[
                        field(''),
                        field(''),
                        field(10, {
                            validations: shouldBeGreaterThanOrEqualTo(18)
                        })
                    ],
                    {
                        initValue: <PersonArray>['', '', -40],
                        validations: [
                            person =>
                                shouldNotBeEmpty(
                                    'firstName should not be empty'
                                )(person[0]),
                            person =>
                                shouldNotBeEmpty(
                                    'lastName should not be empty'
                                )(person[1]),
                            person =>
                                shouldBeGreaterThanOrEqualTo(
                                    18,
                                    'age should be greater than 18'
                                )(person[2])
                        ]
                    }
                );

                expectType(aListing, 'listing');

                expectConfig(aListing, {
                    initValue: ['', '', -40],
                    value: ['', '', -40],
                    isDirty: false,
                    isTouched: false,
                    errors: [
                        'firstName should not be empty',
                        'lastName should not be empty',
                        'age should be greater than 18'
                    ],
                    isValid: false,
                    showErrors: false
                });

                describe('Then for the field firstName', () => {
                    expectConfig(aListing.fields[0], {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field lastName', () => {
                    expectConfig(aListing.fields[1], {
                        value: '',
                        isDirty: false,
                        isTouched: false,
                        errors: [],
                        isValid: true,
                        showErrors: false
                    });
                });

                describe('Then for the field age', () => {
                    expectConfig(aListing.fields[2], {
                        value: -40,
                        isDirty: false,
                        isTouched: false,
                        errors: ['Should be greater than or equal to 18'],
                        isValid: false,
                        showErrors: false
                    });
                });
            });
        });
    });
});

// setValue
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('setValue', () => {
            it('should be a function', () =>
                expect(setValue).toBeInstanceOf(Function));

            // field
            describe('When a field is created and the same init value is assigned', () => {
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
                    validator: ageField.validator,
                    value: 50,
                    isDirty: true,
                    isTouched: true,
                    errors: [],
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
                    validator: ageField.validator,
                    value: 10,
                    isDirty: true,
                    isTouched: true,
                    errors: ['Should be greater than or equal to 18'],
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
                    validator: ageField.validator,
                    value: 0,
                    isDirty: false,
                    isTouched: false,
                    errors: ['Should be greater than or equal to 18'],
                    isValid: false,
                    showErrors: false
                });
            });

            describe('When a field is created and a new distinct valid value is assigned with mode untouched', () => {
                const ageField = field(40);
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeField = setValueDoNotTouch(ageField, 50);

                it('the new field should be distinct from the original one', () =>
                    expect(newAgeField).not.toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));

                expectConfig(newAgeField, {
                    initValue: 40,
                    coerce: ageField.coerce,
                    validator: ageField.validator,
                    value: 50,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a field is created and a new distinct valid value is assigned with mode reset', () => {
                const ageField = field(40);
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeFieldDirty = setValue(ageField, 60, '');
                const newAgeField = resetValue(newAgeFieldDirty, 50);

                it('the new field should be distinct from the original one', () =>
                    expect(newAgeField).not.toBe(ageField));

                it('the original field should no be changed in place', () =>
                    expect(ageField).toEqual(ageFieldCopy));

                expectConfig(newAgeFieldDirty, {
                    initValue: 40,
                    value: 60,
                    isDirty: true,
                    isTouched: true
                });

                expectConfig(newAgeField, {
                    initValue: 50,
                    coerce: ageField.coerce,
                    validator: ageField.validator,
                    value: 50,
                    isDirty: false,
                    isTouched: false
                });
            });

            // group
            describe('When a group is created and the same init value is assigned', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroup = setValue(aGroup, newPers('', '', 20));

                it('the new group should be the same as the original one', () =>
                    expect(newGroup).toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));
            });

            describe('When a group is created and a modified value is assigned', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroup = setValue(aGroup, (p: Person) =>
                    assignOrSame(p, {
                        age: p.age + 10
                    })
                );

                it('the new group should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: newPers('', '', 20),
                    coerce: aGroup.coerce,
                    validator: aGroup.validator,
                    value: newPers('', '', 30),
                    isDirty: true,
                    isTouched: true,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a group is created and a modified value is assigned to one of its fields', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroup = setValue(
                    aGroup,
                    (age: number) => age + 10,
                    'age'
                );

                it('the new group should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: newPers('', '', 20),
                    coerce: aGroup.coerce,
                    validator: aGroup.validator,
                    value: newPers('', '', 30),
                    isDirty: true,
                    isTouched: true,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a group is created and a modified value is assigned with mode untouched', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroup = setValueDoNotTouch(aGroup, (p: Person) =>
                    assignOrSame(p, {
                        age: p.age + 10
                    })
                );

                it('the new group should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: newPers('', '', 20),
                    coerce: aGroup.coerce,
                    validator: aGroup.validator,
                    value: newPers('', '', 30),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            // listing
            describe('When a listing is created and the same init value is assigned', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    { initValue: <PersonArray>undefined }
                );
                const aListingCopy = Object.assign({}, aListing);
                const newListing = setValue(aListing, ['', '', 20]);

                it('the new listing should be the same as the original one', () =>
                    expect(newListing).toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));
            });

            describe('When a listing is created and a modified value is assigned', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    { initValue: <PersonArray>undefined }
                );
                const aListingCopy = Object.assign({}, aListing);
                const newListing = setValue(aListing, (p: PersonArray) =>
                    assignArrayOrSame(p, [2, [p[2] + 10]])
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: ['', '', 20],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: ['', '', 30],
                    isDirty: true,
                    isTouched: true,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and a modified value is assigned to one of its fields', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    { initValue: <PersonArray>undefined }
                );
                const aListingCopy = Object.assign({}, aListing);
                const newListing = setValue(
                    aListing,
                    (age: number) => age + 10,
                    '[2]'
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: ['', '', 20],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: ['', '', 30],
                    isDirty: true,
                    isTouched: true,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and a modified value is assigned with mode untouched', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    { initValue: <PersonArray>undefined }
                );
                const aListingCopy = Object.assign({}, aListing);
                const newListing = setValueDoNotTouch(
                    aListing,
                    (p: PersonArray) => assignArrayOrSame(p, [2, [p[2] + 10]]),
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: ['', '', 20],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: ['', '', 30],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            // combined

            describe('When a form is created and a modified value is assigned to one of its fields', () => {
                const aForm = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );
                const aGroupCopy = Object.assign({}, aForm);
                const newGroup = setValue(
                    aForm,
                    (name: string) => name.toUpperCase(),
                    'pets[0].name'
                );

                it('the new form should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aForm));

                it('the original form should no be changed in place', () =>
                    expect(aForm).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    coerce: aForm.coerce,
                    validator: aForm.validator,
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: true,
                    isTouched: true,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a form is created and a modified value is assigned to one of its fields with mode untouched', () => {
                const aForm = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );
                const aGroupCopy = Object.assign({}, aForm);
                const newGroup = setValueDoNotTouch(
                    aForm,
                    (name: string) => name.toUpperCase(),
                    'pets[0].name'
                );

                it('the new form should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aForm));

                it('the original form should no be changed in place', () =>
                    expect(aForm).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    coerce: aForm.coerce,
                    validator: aForm.validator,
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
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

            describe('When a form is created', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );

                it("with path empty it should return the form's value", () =>
                    expect(getValue(aForm)).toEqual(<any>newPersPets(
                        'John',
                        'Smith',
                        20,
                        [newPet('fido', 'dog'), newPet('garfield', 'cat')]
                    )));

                it('with simple path it should return the field value', () =>
                    expect(getValue(aForm, 'firstName')).toEqual('John'));

                it('with complex path it should return the field value', () =>
                    expect(getValue(aForm, 'pets[0].kind')).toEqual('dog'));

                it('with path invalid it should return undefined', () =>
                    expect(() => getValue(aForm, 'wrongPath')).toThrowError());
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

            describe('When a form is created', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );

                it('with path empty it should return the form itself', () =>
                    expect(getFormItem(aForm)).toBe(aForm));

                it('with simple path it should return the field', () =>
                    expect(getFormItem(aForm, 'firstName')).toBe(
                        aForm.fields.firstName
                    ));

                it('with complex path it should return the field', () =>
                    expect(getFormItem(aForm, 'pets[0].kind')).toBe(
                        aForm.fields.pets.fields[0].fields.kind
                    ));

                it('with path invalid it should return undefined', () =>
                    expect(() =>
                        getFormItem(aForm, 'wrongPath')
                    ).toThrowError());
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

            describe('When a form is created', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );

                it('with path empty it should return the form itself', () =>
                    expect(existFormItem(aForm, '')).toBeTruthy());

                it('with simple path it should return the field', () =>
                    expect(existFormItem(aForm, 'firstName')).toBeTruthy());

                it('with complex path it should return the field', () =>
                    expect(existFormItem(aForm, 'pets[0].kind')).toBeTruthy());

                it('with path invalid it should return undefined', () =>
                    expect(existFormItem(aForm, 'wrongPath')).toBeFalsy());
            });
        });
    });
});

// setGroupField
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('setGroupField', () => {
            it('should be a function', () =>
                expect(setGroupField).toBeInstanceOf(Function));

            describe('When a group is created and a new field is added', () => {
                const aGroup = group(
                    {
                        firstName: field('John'),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroup = setGroupField(
                    aGroup,
                    'lastName',
                    field('Smith')
                );

                it('the new group should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));

                expectConfig(newGroup, {
                    initValue: newPers('John', 'Smith', 20),
                    coerce: aGroup.coerce,
                    validator: aGroup.validator,
                    value: newPers('John', 'Smith', 20),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a form is created and a new field is added', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );
                const newForm = setGroupField(aForm, 'pets[1].age', field(3));

                expectConfig(newForm, {
                    initValue: <any>newPersPets('John', 'Smith', 20, [
                        newPet('fido', 'dog'),
                        Object.assign(newPet('garfield', 'cat'), { age: 3 })
                    ]),
                    coerce: aForm.coerce,
                    validator: aForm.validator,
                    value: <any>newPersPets('John', 'Smith', 20, [
                        newPet('fido', 'dog'),
                        Object.assign(newPet('garfield', 'cat'), { age: 3 })
                    ]),
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });
        });
    });
});

// insertListingFields
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('insertListingFields', () => {
            it('should be a function', () =>
                expect(insertListingFields).toBeInstanceOf(Function));

            describe('When a listing is created and a new field is inserted last as a single value', () => {
                const aListing = listing([field(1), field(2)]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = insertListingFields(aListing, '', field(5));

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 2, 5],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 2, 5],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and new fields are inserted last as an array', () => {
                const aListing = listing([field(1), field(2)]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = insertListingFields(aListing, '', [
                    field(5),
                    field(6),
                    field(7)
                ]);

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 2, 5, 6, 7],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 2, 5, 6, 7],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and a new field is inserted last as a single value func', () => {
                const aListing = listing([field(1), field(2)]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = insertListingFields(aListing, '', () =>
                    field(5)
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 2, 5],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 2, 5],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and new fields are inserted last as an array func', () => {
                const aListing = listing([field(1), field(2)]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = insertListingFields(aListing, '', () => [
                    field(5),
                    field(6),
                    field(7)
                ]);

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 2, 5, 6, 7],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 2, 5, 6, 7],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a listing is created and new fields are inserted mid as an array func', () => {
                const aListing = listing([field(1), field(2)]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = insertListingFields(
                    aListing,
                    '',
                    () => [field(5), field(6), field(7)],
                    1
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 5, 6, 7, 2],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 5, 6, 7, 2],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });

            describe('When a form is created and new fields are inserted to a listing, mid as an array func', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );
                const newForm = insertListingFields(
                    aForm,
                    'pets',
                    () => [field(5), field(6), field(7)],
                    1
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newForm).not.toBe(aForm));

                const expectedValue = <any>{
                    age: 20,
                    firstName: 'John',
                    lastName: 'Smith',
                    pets: [
                        { kind: 'dog', name: 'fido' },
                        5,
                        6,
                        7,
                        { kind: 'cat', name: 'garfield' }
                    ]
                };
                expectConfig(newForm, {
                    initValue: expectedValue,
                    coerce: aForm.coerce,
                    validator: aForm.validator,
                    value: expectedValue,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });
        });
    });
});

// removeListingFields
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('removeListingFields', () => {
            it('should be a function', () =>
                expect(removeListingFields).toBeInstanceOf(Function));

            describe('When a listing is created and a single field is removed', () => {
                const aListing = listing([
                    field(1),
                    field(2),
                    field(3),
                    field(4),
                    field(5)
                ]);
                const aListingCopy = Object.assign({}, aListing);
                const newListing = removeListingFields(aListing, '', 1);

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: [1, 3, 4, 5],
                    coerce: aListing.coerce,
                    validator: aListing.validator,
                    value: [1, 3, 4, 5],
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });
            describe('When a form is created and fields are removed from a listing', () => {
                const aForm = group(
                    {
                        firstName: field('John'),
                        lastName: field('Smith'),
                        age: field(20),
                        pets: listing(
                            [
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    { name: field(''), kind: field('') },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            { initValue: <Pet[]>undefined }
                        )
                    },
                    { initValue: <Person & { pet: Pet[] }>undefined }
                );
                const newForm = removeListingFields(aForm, 'pets', 0);

                it('the new listing should be distinct from the original one', () =>
                    expect(newForm).not.toBe(aForm));

                const expectedValue = <any>{
                    age: 20,
                    firstName: 'John',
                    lastName: 'Smith',
                    pets: [{ kind: 'cat', name: 'garfield' }]
                };
                expectConfig(newForm, {
                    initValue: expectedValue,
                    coerce: aForm.coerce,
                    validator: aForm.validator,
                    value: expectedValue,
                    isDirty: false,
                    isTouched: false,
                    errors: [],
                    isValid: true,
                    showErrors: false
                });
            });
        });
    });
});

// getAllErrors
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('getAllErrors', () => {
            it('should be a function', () =>
                expect(getAllErrors).toBeInstanceOf(Function));

            describe('When a group with valid fields is created', () => {
                const aGroup = group(
                    {
                        firstName: field('John', {
                            validations: shouldNotBeBlank()
                        }),
                        lastName: field('Smith', {
                            validations: [
                                shouldNotBeBlank(),
                                shouldBeLongerThan(3)
                            ]
                        }),
                        age: field(20, {
                            validations: shouldBeBetweenValues(18, 35)
                        })
                    },
                    {
                        initValue: <Person>undefined,
                        validations: [
                            shouldBe<Person>(
                                p => p.firstName.length <= p.age,
                                'Should meet this weird condition'
                            )
                        ]
                    }
                );

                it('getAllErrors should return an empty array', () =>
                    expect(getAllErrors(aGroup)).toEqual([]));
            });

            describe('When a group with invalid fields is created', () => {
                const aGroup = group(
                    {
                        firstName: field('', {
                            validations: shouldNotBeBlank('not blank')
                        }),
                        lastName: field('', {
                            validations: [
                                shouldNotBeBlank('not blank'),
                                shouldBeLongerThan(3, 'too short')
                            ]
                        }),
                        age: field(10, {
                            validations: shouldBeBetweenValues(
                                18,
                                35,
                                'outside'
                            )
                        })
                    },
                    {
                        initValue: <Person>undefined,
                        validations: [
                            shouldBe<Person>(
                                p => p.firstName.length >= p.age,
                                'weird'
                            )
                        ]
                    }
                );

                it('getAllErrors should return all errors in the group', () =>
                    expect(getAllErrors(aGroup)).toEqual(<FormError[]>[
                        {
                            path: '',
                            item: aGroup,
                            errors: ['weird']
                        },
                        {
                            path: 'firstName',
                            item: aGroup.fields.firstName,
                            errors: ['not blank']
                        },
                        {
                            path: 'lastName',
                            item: aGroup.fields.lastName,
                            errors: ['not blank', 'too short']
                        },
                        {
                            path: 'age',
                            item: aGroup.fields.age,
                            errors: ['outside']
                        }
                    ]));
            });

            describe('When a form with valid fields is created', () => {
                const aGroup = group(
                    {
                        firstName: field('John', {
                            validations: shouldNotBeBlank()
                        }),
                        lastName: field('Smith', {
                            validations: [
                                shouldNotBeBlank(),
                                shouldBeLongerThan(3)
                            ]
                        }),
                        age: field(20, {
                            validations: shouldBeBetweenValues(18, 35)
                        }),
                        pets: listing(
                            [
                                group(
                                    {
                                        name: field('', {
                                            validations: shouldNotBeBlank()
                                        }),
                                        kind: field('')
                                    },
                                    { initValue: newPet('fido', 'dog') }
                                ),
                                group(
                                    {
                                        name: field('', {
                                            validations: shouldNotBeBlank()
                                        }),
                                        kind: field('')
                                    },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            {
                                initValue: <Pet[]>undefined,
                                validations: pets =>
                                    pets.length === 2
                                        ? ''
                                        : 'Should have exactly two pets'
                            }
                        )
                    },
                    {
                        initValue: <Person>undefined,
                        validations: [
                            shouldBe<Person>(
                                p => p.firstName.length <= p.age,
                                'Should meet this weird condition'
                            )
                        ]
                    }
                );

                it('getAllErrors should return an empty array', () =>
                    expect(getAllErrors(aGroup)).toEqual([]));
            });

            describe('When a form with invalid fields is created', () => {
                const aGroup = group(
                    {
                        firstName: field('', {
                            validations: shouldNotBeBlank('not blank')
                        }),
                        lastName: field('', {
                            validations: [
                                shouldNotBeBlank('not blank'),
                                shouldBeLongerThan(3, 'too short')
                            ]
                        }),
                        age: field(10, {
                            validations: shouldBeBetweenValues(
                                18,
                                35,
                                'outside'
                            )
                        }),
                        pets: listing(
                            [
                                group(
                                    {
                                        name: field('', {
                                            validations: shouldNotBeBlank()
                                        }),
                                        kind: field('')
                                    },
                                    { initValue: newPet('', 'dog') }
                                ),
                                group(
                                    {
                                        name: field('', {
                                            validations: shouldNotBeBlank()
                                        }),
                                        kind: field('')
                                    },
                                    { initValue: newPet('garfield', 'cat') }
                                )
                            ],
                            {
                                initValue: <Pet[]>undefined,
                                validations: pets =>
                                    pets.length === 1
                                        ? ''
                                        : 'Should have exactly one pet'
                            }
                        )
                    },
                    {
                        initValue: <Person>undefined,
                        validations: [
                            shouldBe<Person>(
                                p => p.firstName.length >= p.age,
                                'weird'
                            )
                        ]
                    }
                );

                it('getAllErrors should return all errors in the form', () =>
                    expect(getAllErrors(aGroup)).toEqual(<FormError[]>[
                        {
                            path: '',
                            item: aGroup,
                            errors: ['weird']
                        },
                        {
                            path: 'firstName',
                            item: aGroup.fields.firstName,
                            errors: ['not blank']
                        },
                        {
                            path: 'lastName',
                            item: aGroup.fields.lastName,
                            errors: ['not blank', 'too short']
                        },
                        {
                            path: 'age',
                            item: aGroup.fields.age,
                            errors: ['outside']
                        },
                        {
                            path: 'pets',
                            item: aGroup.fields.pets,
                            errors: ['Should have exactly one pet']
                        },
                        {
                            path: 'pets[0].name',
                            item: aGroup.fields.pets.fields[0].fields.name,
                            errors: ['Should not be blank']
                        }
                    ]));
            });
        });
    });
});
