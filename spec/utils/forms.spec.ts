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
    setInput,
    setInputDoNotTouch,
    setInfo,
    resetValue,
    getValue,
    getFormItem,
    existFormItem,
    setGroupField,
    insertListingFields,
    removeListingFields,
    updateFormInfo,
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
    shouldBeLongerThan,
    ExtraFormInfo,
    UpdateFormItemData,
    decimalParser,
    decimalFormatter,
    numberFormatter,
    numberParser,
    printObj
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
interface AgedPet extends Pet {
    age: number;
}

const newPet = (name: string, kind: string): Pet => ({ name, kind });
const newAgedPet = (name: string, kind: string, age: number): AgedPet => ({
    name,
    kind,
    age
});

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
        info: any;
        initValue: T;
        validator: [T, string[]][] | Function;
        coerce: [T, T][] | Function;
        value: T;
        isDirty: boolean;
        isTouched: boolean;
        errors: string[];
        isValid: boolean;
        showErrors: boolean;
        // Field-specific
        initInput: any;
        input: any;
        validInput: any;
        isValidInput: boolean;
        parser: ([any, T] | [any])[] | Function;
        formatter: [T, any][] | Function;
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
    if (expected.info !== undefined) {
        it(`it's info should be ${JSON.stringify(expected.info)}`, () =>
            expect(item.info).toEqual(expected.info));
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
    if (item.type === 'field') {
        if (expected.initInput !== undefined) {
            it(`it's initInput should be ${JSON.stringify(
                expected.initInput
            )}`, () => expect(item.initInput).toEqual(expected.initInput));
        }
        if (expected.validInput !== undefined) {
            it(`it's validInput should be ${JSON.stringify(
                expected.validInput
            )}`, () => expect(item.validInput).toEqual(expected.validInput));
        }
        if (expected.input !== undefined) {
            it(`it's input should be ${JSON.stringify(expected.input)}`, () =>
                expect(item.input).toEqual(expected.input));
        }
        if (expected.isValidInput !== undefined) {
            it(`it's isValidInput should be ${JSON.stringify(
                expected.isValidInput
            )}`, () => expect(item.isValidInput).toBe(expected.isValidInput));
        }
        if (expected.parser !== undefined) {
            if (typeof expected.parser === 'function') {
                it(`it's parser should be the same as the given function`, () =>
                    expect(item.parser).toBe(expected.parser));
            } else {
                it(`it's parser should be a function`, () =>
                    expect(item.parser).toBeInstanceOf(Function));

                for (const tuple of expected.parser) {
                    const input = tuple[0];
                    const expectedValue =
                        tuple.length === 2 ? tuple[1] : undefined;
                    if (expectedValue === undefined) {
                        it(`it's parser(${JSON.stringify(
                            input
                        )}) should return NaN`, () =>
                            expect(item.parser(input)).toBeNull());
                    } else {
                        it(`it's parser(${JSON.stringify(
                            input
                        )}) should return given value`, () =>
                            expect(item.parser(input)).toEqual(expectedValue));
                    }
                }
            }
        }
        if (expected.formatter !== undefined) {
            if (typeof expected.formatter === 'function') {
                it(`it's formatter should be the same as the given function`, () =>
                    expect(item.formatter).toBe(expected.formatter));
            } else {
                it(`it's formatter should be a function`, () =>
                    expect(item.formatter).toBeInstanceOf(Function));

                for (const [input, expectedText] of expected.formatter) {
                    it(`it's formatter(${JSON.stringify(
                        input
                    )}) should return given value`, () =>
                        expect(item.formatter(input)).toEqual(expectedText));
                }
            }
        }
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
                    initInput: null,
                    input: '',
                    validInput: '',
                    isValidInput: true,
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
                    initInput: null,
                    input: '10',
                    validInput: '10',
                    isValidInput: true,
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
                    description: 'Age of the person',
                    info: 'Some information'
                });

                expectConfig(ageField, {
                    caption: 'Age',
                    description: 'Age of the person',
                    info: 'Some information'
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

            describe('When a field is created with valid input and parse', () => {
                const ageField = field(0, {
                    initInput: '30',
                    parser: decimalParser,
                    formatter: decimalFormatter
                });

                expectConfig(ageField, {
                    initValue: 30,
                    initInput: '30',
                    input: '30',
                    validInput: '30',
                    isValidInput: true,
                    value: 30,
                    isDirty: false,
                    isTouched: false,
                    parser: [['0', 0], ['20', 20], ['abc']],
                    formatter: [[0, '0'], [20, '20']],
                    errors: [],
                    isValid: true,
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
                        description: 'Personal information',
                        info: 'Some information'
                    }
                );

                expectConfig(aGroup, {
                    caption: 'Personal',
                    description: 'Personal information',
                    info: 'Some information'
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
                    description: 'Personal information',
                    info: 'Some information'
                });

                expectConfig(aListing, {
                    caption: 'Personal',
                    description: 'Personal information',
                    info: 'Some information'
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

// setValue / setInput / reset / setInfo
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

            describe('When a text field is created and an empty value is assigned', () => {
                const nameField = field('John');
                const nameFieldCopy = Object.assign({}, nameField);
                const newNameField = setValue(nameField, '');

                it('the new field should be distinct from the original one', () =>
                    expect(newNameField).not.toBe(nameField));

                it('the original field should no be changed in place', () =>
                    expect(nameField).toEqual(nameFieldCopy));

                expectConfig(newNameField, {
                    initValue: 'John',
                    value: '',
                    isDirty: true,
                    isTouched: true
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
                const newAgeField = resetValue(newAgeFieldDirty, '', 50);

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

            describe('When a field is created and a new distinct valid value is assigned with mode reset', () => {
                const ageField = field(40);
                const ageFieldCopy = Object.assign({}, ageField);
                const newAgeFieldDirty = setValue(ageField, 60, '');
                const newAgeField = resetValue(newAgeFieldDirty);

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
                    initValue: 40,
                    coerce: ageField.coerce,
                    validator: ageField.validator,
                    value: 40,
                    isDirty: false,
                    isTouched: false
                });
            });

            describe('When a field is created with input, its value is changed and then it is reset', () => {
                const ageField = field(0, {
                    initInput: '30',
                    parser: decimalParser,
                    formatter: decimalFormatter
                });
                const ageFieldDirty = setValue(ageField, 20);
                const resetAgeField = resetValue(ageField);

                expectConfig(ageFieldDirty, {
                    initValue: 30,
                    initInput: '30',
                    input: '20',
                    validInput: '20',
                    isValidInput: true,
                    value: 20,
                    isDirty: true,
                    isTouched: true
                });

                expectConfig(resetAgeField, {
                    initValue: 30,
                    initInput: '30',
                    input: '30',
                    validInput: '30',
                    isValidInput: true,
                    value: 30,
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
                    value: newPers('', '', 30),
                    isDirty: true,
                    isTouched: true
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
                    value: newPers('', '', 30),
                    isDirty: true,
                    isTouched: true
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
                    value: newPers('', '', 30),
                    isDirty: false,
                    isTouched: false
                });
            });

            describe('When a group is created and a modified value is assigned with mode reset', () => {
                const aGroup = group(
                    {
                        firstName: field(''),
                        lastName: field(''),
                        age: field(20)
                    },
                    { initValue: <Person>undefined }
                );
                const aGroupCopy = Object.assign({}, aGroup);
                const newGroupDirty = setValue(
                    aGroup,
                    (age: number) => age + 10,
                    'age'
                );
                const newGroup = resetValue(newGroupDirty);

                it('the new group should be distinct from the original one', () =>
                    expect(newGroup).not.toBe(aGroup));

                it('the original group should no be changed in place', () =>
                    expect(aGroup).toEqual(aGroupCopy));

                expectConfig(newGroupDirty, {
                    initValue: newPers('', '', 20),
                    value: newPers('', '', 30),
                    isDirty: true,
                    isTouched: true
                });

                expectConfig(newGroup, {
                    initValue: newPers('', '', 20),
                    value: newPers('', '', 20),
                    isDirty: false,
                    isTouched: false
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
                    value: ['', '', 30],
                    isDirty: true,
                    isTouched: true
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
                    value: ['', '', 30],
                    isDirty: true,
                    isTouched: true
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
                    (p: PersonArray) => assignArrayOrSame(p, [2, [p[2] + 10]])
                );

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListing, {
                    initValue: ['', '', 20],
                    value: ['', '', 30],
                    isDirty: false,
                    isTouched: false
                });
            });

            describe('When a listing is created and a modified value is assigned with mode reset', () => {
                const aListing = listing(
                    <PersonArrayForm>[field(''), field(''), field(20)],
                    { initValue: <PersonArray>undefined }
                );
                const aListingCopy = Object.assign({}, aListing);
                const newListingDirty = setValue(
                    aListing,
                    (age: number) => age + 10,
                    '[2]'
                );
                const newListing = resetValue(newListingDirty, '', [
                    '',
                    '',
                    42
                ]);

                it('the new listing should be distinct from the original one', () =>
                    expect(newListing).not.toBe(aListing));

                it('the original listing should no be changed in place', () =>
                    expect(aListing).toEqual(aListingCopy));

                expectConfig(newListingDirty, {
                    initValue: ['', '', 20],
                    value: ['', '', 30],
                    isDirty: true,
                    isTouched: true
                });

                expectConfig(newListing, {
                    initValue: ['', '', 42],
                    value: ['', '', 42],
                    isDirty: false,
                    isTouched: false
                });
            });

            describe('When a listing is created with errors and then reset', () => {
                const aListing = listing(
                    <PersonArrayForm>[
                        field('John', { validations: shouldNotBeBlank() }),
                        field('Smith'),
                        field(20)
                    ],
                    { initValue: <PersonArray>undefined }
                );
                const newListingDirty = setValue(aListing, '', '[0]');
                const newListing = resetValue(newListingDirty);

                expectConfig(newListingDirty, {
                    initValue: ['John', 'Smith', 20],
                    value: ['', 'Smith', 20],
                    isDirty: true,
                    isTouched: true,
                    isValid: false,
                    showErrors: false
                });

                expectConfig(newListingDirty.fields[0], {
                    initValue: 'John',
                    value: '',
                    isDirty: true,
                    isTouched: true,
                    isValid: false,
                    showErrors: true
                });

                expectConfig(newListing, {
                    initValue: ['John', 'Smith', 20],
                    value: ['John', 'Smith', 20],
                    isDirty: false,
                    isTouched: false,
                    isValid: true,
                    showErrors: false
                });

                expectConfig(newListing.fields[0], {
                    initValue: 'John',
                    value: 'John',
                    isDirty: false,
                    isTouched: false,
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
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: true,
                    isTouched: true
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
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: false,
                    isTouched: false
                });
            });

            describe('When a form is created and a modified value is assigned to one of its fields with mode reset', () => {
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
                const newGroupDirty = setValue(
                    aForm,
                    (name: string) => name.toUpperCase(),
                    'pets[0].name'
                );
                const newGroup = resetValue(aForm);

                it('the new form should be distinct from the original one', () =>
                    expect(newGroupDirty).not.toBe(aForm));

                it('the original form should no be changed in place', () =>
                    expect(aForm).toEqual(aGroupCopy));

                expectConfig(newGroupDirty, {
                    initValue: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: true,
                    isTouched: true
                });

                expectConfig(newGroup, {
                    initValue: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    value: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    isDirty: false,
                    isTouched: false
                });
            });

            describe("When a form is created and an update is applied to all of its pet's fields", () => {
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
                const newGroup = setValue(
                    aForm,
                    (value: string, data: UpdateFormItemData) =>
                        `${value.toUpperCase()}/${data.relativePath}`,
                    'pets[*].*'
                );

                expectConfig(newGroup, {
                    initValue: <any>newPersPets('', '', 20, [
                        newPet('fido', 'dog'),
                        newPet('garfield', 'cat')
                    ]),
                    value: <any>newPersPets('', '', 20, [
                        newPet('FIDO/pets[0].name', 'DOG/pets[0].kind'),
                        newPet('GARFIELD/pets[1].name', 'CAT/pets[1].kind')
                    ]),
                    isDirty: true,
                    isTouched: true
                });
            });
        });

        describe('setInput', () => {
            it('should be a function', () =>
                expect(setInput).toBeInstanceOf(Function));

            describe('When a field is created with input, its value is changed and then new input is set', () => {
                const ageField = field(0, {
                    initInput: '30',
                    parser: decimalParser,
                    formatter: decimalFormatter
                });
                const ageFieldDirty = setInput(ageField, '50');

                expectConfig(ageFieldDirty, {
                    initValue: 30,
                    initInput: '30',
                    input: '50',
                    validInput: '50',
                    isValidInput: true,
                    value: 50,
                    isDirty: true,
                    isTouched: true,
                    isValid: true,
                    errors: [],
                    showErrors: false
                });
            });

            describe('When a field is created with input, its value is changed and then new incorrect input is set', () => {
                const ageField = field(0, {
                    initInput: '30',
                    parser: (t: string) => {
                        const result = decimalParser(t);
                        if (!isFinite(result)) {
                            throw new Error('Is not finite number');
                        }
                        return result;
                    },
                    formatter: decimalFormatter,
                    parserErrorText: 'Not a number'
                });
                const ageFieldDirty = setInput(ageField, 'xyz');

                expectConfig(ageFieldDirty, {
                    initValue: 30,
                    initInput: '30',
                    input: 'xyz',
                    validInput: 'xyz',
                    isValidInput: true,
                    value: null,
                    isDirty: true,
                    isTouched: true,
                    isValid: true,
                    errors: [],
                    showErrors: false
                });
            });

            describe('When a field is created with value, its value is changed and then new incorrect input is set', () => {
                const ageField = field<number>(10, {
                    parser: numberParser,
                    formatter: numberFormatter
                });
                const ageFieldDirty = setInput(ageField, '-');

                expectConfig(ageFieldDirty, {
                    initValue: 10,
                    initInput: null,
                    input: '-',
                    validInput: '-',
                    isValidInput: true,
                    value: null,
                    isDirty: true,
                    isTouched: true,
                    isValid: true,
                    errors: [],
                    showErrors: false
                });
            });

                describe(
                    'When a group is created and an input value is assigned to one of its fields',
                    () => {
                        const aForm =
                            group({
                                    name: field(''),
                                    kind: field(''),
                                    age: field(0, {
                                        parser: numberParser,
                                        formatter: numberFormatter
                                    })
                                },
                                {
                                    initValue: newAgedPet(
                                        'fido',
                                        'dog',
                                        5
                                    )
                                }
                            );
                        const fidosAge = aForm.fields.age;
                        const aGroupCopy = Object.assign({}, aForm);
                        const newGroup = setInput(
                            aForm,
                            '.',
                            'age'
                        );
                        const dirtyFidosAge = newGroup.fields.age;

                        it('the new form should be distinct from the original one', () =>
                            expect(newGroup).not.toBe(aForm));

                        it('the new form fields should be distinct from the original one', () =>
                            expect(dirtyFidosAge).not.toBe(fidosAge));

                        it('the original form should no be changed in place', () =>
                            expect(aForm).toEqual(aGroupCopy));


                        // console.log('FIDO\'S AGE: ', printObj(fidosAge));
                        // console.log('FORM: ', printObj(newGroup));

                        // expectConfig(dirtyFidosAge, {
                        //     initValue: 5,
                        //     initInput: null,
                        //     input: '.',
                        //     validInput: '5',
                        //     isValidInput: false,
                        //     value: 5,
                        //     isDirty: true,
                        //     isTouched: true,
                        //     isValid: false,
                        //     errors: ['Should be a number'],
                        //     showErrors: true
                        // });

                        // expectConfig(newGroup, {
                        //     initValue: newAgedPet('fido', 'dog', 5),
                        //     value: newAgedPet('fido', 'dog', 5),
                        //     isDirty: true,
                        //     isTouched: true,
                        //     isValid: false,
                        // });
                    }
                );

            describe(
                'When a form is created and an input value is assigned to one of its fields',
                () => {
                    const aForm = group(
                        {
                            firstName: field(''),
                            lastName: field(''),
                            age: field(20, {
                                parser: numberParser,
                                formatter: numberFormatter
                            }),
                            pets: listing(
                                [
                                    group(
                                        {
                                            name: field(''),
                                            kind: field(''),
                                            age: field(0, {
                                                parser: numberParser,
                                                formatter: numberFormatter
                                            })
                                        },
                                        {
                                            initValue: newAgedPet(
                                                'fido',
                                                'dog',
                                                5
                                            )
                                        }
                                    ),
                                    group(
                                        {
                                            name: field(''),
                                            kind: field(''),
                                            age: field(0, {
                                                parser: numberParser,
                                                formatter: numberFormatter
                                            })
                                        },
                                        {
                                            initValue: newAgedPet(
                                                'garfield',
                                                'cat',
                                                8
                                            )
                                        }
                                    )
                                ],
                                { initValue: <Pet[]>undefined }
                            )
                        },
                        { initValue: <Person & { pet: Pet[] }>undefined }
                    );
                    const aGroupCopy = Object.assign({}, aForm);
                    const newGroup = setInput(
                        aForm,
                        '.',
                        'pets[0].age'
                    );

                    it('the new form should be distinct from the original one', () =>
                        expect(newGroup).not.toBe(aForm));

                    it('the original form should no be changed in place', () =>
                        expect(aForm).toEqual(aGroupCopy));

                    const fido = newGroup.fields.pets.fields[0];
                    const fidosAge = fido.fields.age;

                    // console.log('FIDO\'S AGE: ', printObj(fidosAge));
                    // console.log('FIDO: ', printObj(fido));
                    // console.log('FORM: ', printObj(newGroup));

                    // expectConfig(fidosAge, {
                    //     initValue: 5,
                    //     initInput: null,
                    //     input: '.',
                    //     validInput: '5',
                    //     isValidInput: false,
                    //     value: 5,
                    //     isDirty: true,
                    //     isTouched: true,
                    //     isValid: false,
                    //     errors: ['Should be a number'],
                    //     showErrors: true
                    // });

                    // expectConfig(fido, {
                    //     initValue: newAgedPet('', '', 0),
                    //     initInput: null,
                    //     value: newAgedPet('', '', 0),
                    //     isDirty: true,
                    //     isTouched: true,
                    //     isValid: false,
                    //     errors: ['Should be a number'],
                    //     showErrors: true
                    // });

                    // expectConfig(newGroup, {
                    //     initValue: <any>newPersPets('', '', 20, [
                    //         newAgedPet('fido', 'dog', 5),
                    //         newAgedPet('garfield', 'cat', 8)
                    //     ]),
                    //     value: <any>newPersPets('', '', 20, [
                    //         newAgedPet('fido', 'dog', 5),
                    //         newAgedPet('garfield', 'cat', 8)
                    //     ]),
                    //     isDirty: true,
                    //     isTouched: true,
                    //     isValid: false,
                    // });
                }
            );
        });

        describe('setInfo', () => {
            it('should be a function', () =>
                expect(setInfo).toBeInstanceOf(Function));

            describe('When a field is created with info, its info is changed', () => {
                const ageField = field(30, { info: 42 });
                const ageFieldDirty = setInfo(
                    ageField,
                    (_info, data, _field) => _info + _field.value
                );

                expectConfig(ageFieldDirty, {
                    value: 30,
                    isDirty: false,
                    isTouched: false,
                    info: 42 + 30
                });
            });
        });
    });
});

// updateFormInfo
describe('Utils', () => {
    describe('Forms Tests', () => {
        describe('updateFormInfo', () => {
            it('should be a function', () =>
                expect(updateFormInfo).toBeInstanceOf(Function));

            // field
            describe('Given a field is created with custom info', () => {
                const aField = field(40, {
                    caption: 'Caption',
                    description: 'Desc',
                    info: 'Info'
                });

                it('When no changes are requested the new field should be the same as the original one', () =>
                    expect(updateFormInfo(aField, '', {})).toBe(aField));

                it('When caption change is requested the new caption should be be the given one', () => {
                    const newField = updateFormInfo(aField, '', {
                        caption: 'New Caption'
                    });
                    expect(newField.caption).toBe('New Caption');
                });

                it('When description change is requested the new description should be be the given one', () => {
                    const newField = updateFormInfo(aField, '', {
                        description: 'New Description'
                    });
                    expect(newField.description).toBe('New Description');
                });

                it('When info change is requested the new info should be be the given one', () => {
                    const newField = updateFormInfo(aField, '', {
                        info: 'New Info'
                    });
                    expect(newField.info).toBe('New Info');
                });

                it('When changes are requested as a function it should receive the previous extra form item info', () => {
                    const newField = updateFormInfo(
                        aField,
                        '',
                        (d: ExtraFormInfo) => ({
                            caption: 'New ' + d.caption.toLowerCase(),
                            description: 'New ' + d.description.toLowerCase(),
                            info: 'New ' + d.info.toLowerCase()
                        })
                    );
                    expect(newField.caption).toBe('New caption');
                    expect(newField.description).toBe('New desc');
                    expect(newField.info).toBe('New info');
                });

                it('When caption change is requested the field should not be dirty', () => {
                    const newField = updateFormInfo(aField, '', {
                        caption: 'New Caption'
                    });
                    expect(newField.isDirty).toBe(false);
                });
            });

            // combined
            describe('Given a field is created with custom info', () => {
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

                it('When changes are requested as a function it should receive the UpdateFormData', () => {
                    const newForm = updateFormInfo(
                        aForm,
                        'pets[1].name',
                        (d: FormItem, data: UpdateFormItemData) => ({
                            info: `${d.value}/${data.relativePath}`
                        })
                    );
                    expect(getFormItem(newForm, 'pets[1].name').info).toBe(
                        'garfield/pets[1].name'
                    );
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
                    expect(getValue(aForm)).toEqual(
                        <any>newPersPets('John', 'Smith', 20, [
                            newPet('fido', 'dog'),
                            newPet('garfield', 'cat')
                        ])
                    ));

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
                    expect(getAllErrors(aGroup)).toEqual(
                        <FormError[]>[
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
                        ]
                    ));
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
                    expect(getAllErrors(aGroup)).toEqual(
                        <FormError[]>[
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
                        ]
                    ));
            });
        });
    });
});
