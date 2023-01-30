import * as common from '../../src/utils/common';
import type { Validator } from '../../src/utils/validation';
import {
    checkCondition,
    emptyValidator,
    makeValidator,
    mergeValidators,
    shouldBe,
    shouldBeANumber,
    shouldBeAString,
    shouldBeBetweenValues,
    shouldBeGreaterThan,
    shouldBeGreaterThanOrEqualTo,
    shouldBeLessThan,
    shouldBeLessThanOrEqualTo,
    shouldBeLongerThan,
    shouldBeShorterThan,
    shouldMatch,
    shouldNotBe,
    shouldNotBeBetweenValues,
    shouldNotBeBlank,
    shouldNotBeEmpty,
    shouldNotBeGreaterThan,
    shouldNotBeGreaterThanOrEqualTo,
    shouldNotBeLessThan,
    shouldNotBeLessThanOrEqualTo,
    shouldNotBeLongerThan,
    shouldNotBeShorterThan,
    shouldNotMatch
} from '../../src/utils/validation';

function expectErrors(
    fun: Validator,
    name: string,
    expectations: (any | [any, string[]])[]
) {
    name = name || fun.name;
    expectations.forEach(element => {
        const [value, errors] =
            element instanceof Array ? <[any, string[]]>element : [element, []];
        const text =
            `${name}(${JSON.stringify(value)}) should ` +
            (!errors || !errors.length
                ? 'not return any error'
                : `return ${errors.length} error(s)`);
        it(text, () => expect(fun(value)).toEqual(errors));
    });
}

function expectParamErrors(
    fun: (...params: any[]) => Validator,
    name: string,
    // expectations: [any[], (string | any[]), any, string[]][],
    expectations: {
        value: any;
        params?: any[];
        paramStr?: string | any[];
        errors?: string[];
    }[]
) {
    name = name || fun.name;
    // expectations.forEach(([params, paramStr, value, errors]) => {
    expectations.forEach(({ params, paramStr, value, errors }) => {
        if (typeof paramStr === 'string') {
            paramStr = paramStr;
        } else {
            const paramArr = (params || []).map(p => JSON.stringify(p));
            if (paramStr instanceof Array) {
                for (
                    let index = 0;
                    index < paramStr.length && index < paramArr.length;
                    index++
                ) {
                    if (
                        paramStr[index] !== undefined &&
                        paramStr[index] !== null
                    ) {
                        paramArr[index] = paramStr[index];
                    }
                }
                paramStr = common.joinStr(', ', paramArr);
            }
        }
        expectErrors(fun(...(params || [])), `${name}(${paramStr})`, [
            [value, errors || []]
        ]);
    });
}

const allValues = [
    undefined,
    null,
    0,
    20,
    true,
    false,
    '',
    'hello',
    new Date()
];

////////////////////////////////////////////////////////////////
//                                                            //
//                     Common Validators                      //
//                                                            //
////////////////////////////////////////////////////////////////

describe('Utils', () => {
    describe('Validation Tests', () => {
        describe('emptyValidator', () => {
            it('should be a function', () =>
                expect(emptyValidator).toBeInstanceOf(Function));

            expectErrors(emptyValidator, 'emptyValidator', allValues);
        });

        describe('makeValidator', () => {
            it('should be a function', () =>
                expect(makeValidator).toBeInstanceOf(Function));

            expectParamErrors(makeValidator, 'makeValidator', [
                {
                    value: 'any value',
                    params: [undefined]
                },
                {
                    value: 'any value',
                    params: [() => ''],
                    paramStr: ["() => ''"]
                },
                {
                    value: 'any value',
                    params: [() => '    '],
                    paramStr: ["() => '    '"]
                },
                {
                    value: 'any value',
                    params: [() => []],
                    paramStr: ['() => []']
                },
                {
                    value: 'any value',
                    params: [() => 'mistake'],
                    paramStr: ["() => 'mistake'"],
                    errors: ['mistake']
                },
                {
                    value: 'any value',
                    params: [() => ['mistake1', 'mistake2']],
                    paramStr: ['() => [errors]'],
                    errors: ['mistake1', 'mistake2']
                },
                {
                    value: 'any value',
                    params: [
                        () => {
                            throw new Error('mistake');
                        }
                    ],
                    paramStr: ['() => {throw}'],
                    errors: ['mistake']
                }
            ]);
        });

        describe('mergeValidators', () => {
            it('should be a function', () =>
                expect(mergeValidators).toBeInstanceOf(Function));

            expectParamErrors(mergeValidators, 'mergeValidators', [
                {
                    value: 'any value',
                    params: [[]],
                    paramStr: ['[]']
                },
                {
                    value: 'any value',
                    params: [() => ''],
                    paramStr: ['no error']
                },
                {
                    value: 'any value',
                    params: [() => 'mistake'],
                    paramStr: ['error'],
                    errors: ['mistake']
                },
                {
                    value: 'any value',
                    params: [[() => '', () => []]],
                    paramStr: ['no errors']
                },
                {
                    value: 'any value',
                    params: [
                        [() => 'mistake1', () => ['mistake2', 'mistake3']]
                    ],
                    paramStr: ['multiple errors'],
                    errors: ['mistake1', 'mistake2', 'mistake3']
                }
            ]);
        });

        describe('checkCondition', () => {
            it('should be a function', () =>
                expect(checkCondition).toBeInstanceOf(Function));

            expectParamErrors(checkCondition, 'checkCondition', [
                {
                    value: 10,
                    params: [x => true, 'default'],
                    paramStr: ['...true']
                },
                {
                    value: 10,
                    params: [x => true, 'default', 'mistake'],
                    paramStr: ['...true']
                },
                {
                    value: 10,
                    params: [x => false, 'default'],
                    paramStr: ['...false'],
                    errors: ['default']
                },
                {
                    value: 10,
                    params: [x => false, 'default', 'mistake'],
                    paramStr: ['...false'],
                    errors: ['mistake']
                },
                {
                    value: 10,
                    params: [
                        x => false,
                        'default',
                        (a, b, v) => `${a} + ${b} = ${v}`,
                        [3, 7]
                    ],
                    paramStr: ['...false', null, 'param. message'],
                    errors: ['3 + 7 = 10']
                }
            ]);
        });

        describe('shouldBe', () => {
            it('should be a function', () =>
                expect(shouldBe).toBeInstanceOf(Function));

            expectParamErrors(shouldBe, 'shouldBe', [
                {
                    value: 10,
                    params: [x => false, 'mistake'],
                    paramStr: ['...false'],
                    errors: ['mistake']
                },
                {
                    value: 10,
                    params: [x => true, 'mistake'],
                    paramStr: ['...true']
                },
                {
                    value: 10,
                    params: [
                        x => false,
                        (a, b, v) => `${a} + ${b} = ${v}`,
                        3,
                        7
                    ],
                    paramStr: ['...false'],
                    errors: ['3 + 7 = 10']
                }
            ]);
        });

        describe('shouldNotBe', () => {
            it('should be a function', () =>
                expect(shouldNotBe).toBeInstanceOf(Function));

            expectParamErrors(shouldNotBe, 'shouldNotBe', [
                {
                    value: 10,
                    params: [x => true, 'mistake'],
                    paramStr: ['...true'],
                    errors: ['mistake']
                },
                {
                    value: 10,
                    params: [x => false, 'mistake'],
                    paramStr: ['...false']
                },
                {
                    value: 10,
                    params: [
                        x => true,
                        (a, b, v) => `${a} + ${b} = ${v}`,
                        3,
                        7
                    ],
                    paramStr: ['...true'],
                    errors: ['3 + 7 = 10']
                }
            ]);
        });

        ////////////////////////////////////////////////////////////////
        //                                                            //
        //                     String validators                      //
        //                                                            //
        ////////////////////////////////////////////////////////////////

        describe('shouldBeAString', () => {
            it('should be a function', () =>
                expect(shouldBeAString).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeAString()).toBeInstanceOf(Function));

            expectParamErrors(shouldBeAString, 'shouldBeAString', [
                { value: 'hello' },
                { value: '' },
                { value: 'hello', params: ['mistake'] },
                { value: undefined, errors: ['Should be a string'] },
                { value: null, errors: ['Should be a string'] },
                { value: 0, errors: ['Should be a string'] },
                { value: true, errors: ['Should be a string'] },
                { value: new Date(), errors: ['Should be a string'] },
                {
                    value: 5,
                    params: ['mistake'],
                    errors: ['mistake']
                },
                {
                    value: 'hello',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7]
                },
                {
                    value: 10,
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7],
                    errors: ['3 + 7 = 10']
                }
            ]);
        });

        describe('shouldNotBeEmpty', () => {
            it('should be a function', () =>
                expect(shouldNotBeEmpty).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeEmpty()).toBeInstanceOf(Function));

            expectParamErrors(shouldNotBeEmpty, 'shouldNotBeEmpty', [
                { value: 'hello' },
                { value: '', errors: ['Should not be empty'] },
                { value: 'hello', params: ['mistake'] },
                { value: 0, errors: ['Should be a string'] },
                {
                    value: '',
                    params: ['mistake'],
                    errors: ['mistake']
                },
                {
                    value: 'hello',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7]
                },
                {
                    value: '',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7],
                    errors: ['3 + 7 =']
                }
            ]);
        });

        describe('shouldNotBeBlank', () => {
            it('should be a function', () =>
                expect(shouldNotBeBlank).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeBlank()).toBeInstanceOf(Function));

            expectParamErrors(shouldNotBeBlank, 'shouldNotBeBlank', [
                { value: 'hello' },
                { value: '  hello\tworld\r\n  ' },
                { value: '', errors: ['Should not be blank'] },
                { value: '    ', errors: ['Should not be blank'] },
                { value: ' \t\r\n ', errors: ['Should not be blank'] },
                { value: 'hello', params: ['mistake'] },
                { value: 0, errors: ['Should be a string'] },
                {
                    value: '',
                    params: ['mistake'],
                    errors: ['mistake']
                },
                {
                    value: 'hello',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7]
                },
                {
                    value: '',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7],
                    errors: ['3 + 7 =']
                }
            ]);
        });

        describe('shouldMatch', () => {
            it('should be a function', () =>
                expect(shouldMatch).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldMatch(/.*/)).toBeInstanceOf(Function));

            expectParamErrors(shouldMatch, 'shouldMatch', [
                {
                    value: 'hello',
                    params: [/^.*$/],
                    paramStr: ['/^.*$/']
                },
                {
                    value: 'hello',
                    params: [/^[\d]+$/],
                    paramStr: ['/^[d]+$/'],
                    errors: ['Should match given pattern']
                },
                {
                    value: 0,
                    params: [/^[\d]+$/],
                    paramStr: ['/^[d]+$/'],
                    errors: ['Should be a string']
                },
                {
                    value: 'hello',
                    params: [/^[\d]+$/, 'mistake'],
                    paramStr: ['/^[d]+$/'],
                    errors: ['mistake']
                },
                {
                    value: 'hello',
                    params: [
                        /^[\d]+$/,
                        (a, b, v) => `${a} + ${b} = ${v}`,
                        'he',
                        'llo'
                    ],
                    paramStr: ['/^[d]+$/'],
                    errors: ['he + llo = hello']
                }
            ]);
        });

        describe('shouldNotMatch', () => {
            it('should be a function', () =>
                expect(shouldNotMatch).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotMatch(/.*/)).toBeInstanceOf(Function));

            expectParamErrors(shouldNotMatch, 'shouldNotMatch', [
                {
                    value: '',
                    params: [/^.+$/],
                    paramStr: ['/^.+$/']
                },
                {
                    value: '123456',
                    params: [/^[\d]+$/],
                    paramStr: ['/^[d]+$/'],
                    errors: ['Should not match given pattern']
                },
                {
                    value: 0,
                    params: [/^[\d]+$/],
                    paramStr: ['/^[d]+$/'],
                    errors: ['Should be a string']
                },
                {
                    value: 'abcdef',
                    params: [/^[\d]+$/],
                    paramStr: ['/^[d]+$/']
                },
                {
                    value: '123456',
                    params: [/^[\d]+$/, 'mistake'],
                    paramStr: ['/^[d]+$/'],
                    errors: ['mistake']
                },
                {
                    value: '123456',
                    params: [
                        /^[\d]+$/,
                        (a, b, v) => `${a} + ${b} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: ['/^[d]+$/', 'custom message'],
                    errors: ['123 + 456 = 123456']
                }
            ]);
        });

        describe('shouldNotBeShorterThan', () => {
            it('should be a function', () =>
                expect(shouldNotBeShorterThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeShorterThan(5)).toBeInstanceOf(Function));

            expectParamErrors(
                shouldNotBeShorterThan,
                'shouldNotBeShorterThan',
                [
                    {
                        value: 'hello',
                        params: [5]
                    },
                    {
                        value: 'hello world',
                        params: [5]
                    },
                    {
                        value: 'hi',
                        params: [5],
                        paramStr: [],
                        errors: ['Should not be shorter than 5 characters']
                    },
                    {
                        value: 0,
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a string']
                    },
                    {
                        value: 'hi',
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 'hi',
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = hi']
                    }
                ]
            );
        });

        describe('shouldBeLongerThan', () => {
            it('should be a function', () =>
                expect(shouldBeLongerThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeLongerThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldBeLongerThan, 'shouldBeLongerThan', [
                {
                    value: 'hello!',
                    params: [5]
                },
                {
                    value: 'hello world',
                    params: [5]
                },
                {
                    value: 'hi',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be longer than 5 characters']
                },
                {
                    value: 0,
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a string']
                },
                {
                    value: 'hello',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be longer than 5 characters']
                },
                {
                    value: 'hi',
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 'hi',
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = hi']
                }
            ]);
        });

        describe('shouldBeShorterThan', () => {
            it('should be a function', () =>
                expect(shouldBeShorterThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeShorterThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldBeShorterThan, 'shouldBeShorterThan', [
                {
                    value: '',
                    params: [5]
                },
                {
                    value: 'hi',
                    params: [5]
                },
                {
                    value: 'hello',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be shorter than 5 characters']
                },
                {
                    value: 0,
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a string']
                },
                {
                    value: 'hello',
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 'hello',
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = hello']
                }
            ]);
        });

        describe('shouldNotBeLongerThan', () => {
            it('should be a function', () =>
                expect(shouldNotBeLongerThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeLongerThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldNotBeLongerThan, 'shouldNotBeLongerThan', [
                {
                    value: '',
                    params: [5]
                },
                {
                    value: 'hi',
                    params: [5]
                },
                {
                    value: 'hello',
                    params: [5]
                },
                {
                    value: 'hello!',
                    params: [5],
                    paramStr: [],
                    errors: ['Should not be longer than 5 characters']
                },
                {
                    value: 0,
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a string']
                },
                {
                    value: 'hello!',
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 'hello!',
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = hello!']
                }
            ]);
        });

        ////////////////////////////////////////////////////////////////
        //                                                            //
        //                     Numeric validators                     //
        //                                                            //
        ////////////////////////////////////////////////////////////////

        describe('shouldBeANumber', () => {
            it('should be a function', () =>
                expect(shouldBeANumber).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeANumber()).toBeInstanceOf(Function));

            expectParamErrors(shouldBeANumber, 'shouldBeANumber', [
                { value: 10 },
                { value: 0 },
                { value: 10, params: ['mistake'] },
                { value: undefined, errors: ['Should be a number'] },
                { value: null, errors: ['Should be a number'] },
                { value: 'hello', errors: ['Should be a number'] },
                { value: true, errors: ['Should be a number'] },
                { value: new Date(), errors: ['Should be a number'] },
                {
                    value: 'hello',
                    params: ['mistake'],
                    errors: ['mistake']
                },
                {
                    value: 10,
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 3, 7]
                },
                {
                    value: 'hello',
                    params: [(a, b, v) => `${a} + ${b} = ${v}`, 'he', 'llo'],
                    errors: ['he + llo = hello']
                }
            ]);
        });

        describe('shouldBeGreaterThan', () => {
            it('should be a function', () =>
                expect(shouldBeGreaterThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeGreaterThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldBeGreaterThan, 'shouldBeGreaterThan', [
                {
                    value: 10,
                    params: [5]
                },
                {
                    value: 6,
                    params: [5]
                },
                {
                    value: 'hello',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a number']
                },
                {
                    value: 3,
                    params: [5],
                    paramStr: [],
                    errors: ['Should be greater than 5']
                },
                {
                    value: 3,
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 3,
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = 3']
                }
            ]);
        });

        describe('shouldNotBeLessThanOrEqualTo', () => {
            it('should be a function', () =>
                expect(shouldNotBeLessThanOrEqualTo).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeLessThanOrEqualTo(5)).toBeInstanceOf(
                    Function
                ));

            expectParamErrors(
                shouldNotBeLessThanOrEqualTo,
                'shouldNotBeLessThanOrEqualTo',
                [
                    {
                        value: 10,
                        params: [5]
                    },
                    {
                        value: 6,
                        params: [5]
                    },
                    {
                        value: 3,
                        params: [5],
                        paramStr: [],
                        errors: ['Should not be less than or equal to 5']
                    },
                    {
                        value: 'hello',
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 3,
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 3,
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = 3']
                    }
                ]
            );
        });

        describe('shouldBeGreaterThanOrEqualTo', () => {
            it('should be a function', () =>
                expect(shouldBeGreaterThanOrEqualTo).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeGreaterThanOrEqualTo(5)).toBeInstanceOf(
                    Function
                ));

            expectParamErrors(
                shouldBeGreaterThanOrEqualTo,
                'shouldBeGreaterThanOrEqualTo',
                [
                    {
                        value: 10,
                        params: [5]
                    },
                    {
                        value: 5,
                        params: [5]
                    },
                    {
                        value: 3,
                        params: [5],
                        paramStr: [],
                        errors: ['Should be greater than or equal to 5']
                    },
                    {
                        value: 'hello',
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 3,
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 3,
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = 3']
                    }
                ]
            );
        });

        describe('shouldNotBeLessThan', () => {
            it('should be a function', () =>
                expect(shouldNotBeLessThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeLessThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldNotBeLessThan, 'shouldNotBeLessThan', [
                {
                    value: 10,
                    params: [5]
                },
                {
                    value: 5,
                    params: [5]
                },
                {
                    value: 3,
                    params: [5],
                    paramStr: [],
                    errors: ['Should not be less than 5']
                },
                {
                    value: 'hello',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a number']
                },
                {
                    value: 3,
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 3,
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = 3']
                }
            ]);
        });

        describe('shouldBeLessThan', () => {
            it('should be a function', () =>
                expect(shouldBeLessThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeLessThan(5)).toBeInstanceOf(Function));

            expectParamErrors(shouldBeLessThan, 'shouldBeLessThan', [
                {
                    value: 3,
                    params: [5]
                },
                {
                    value: 4,
                    params: [5]
                },
                {
                    value: 'hello',
                    params: [5],
                    paramStr: [],
                    errors: ['Should be a number']
                },
                {
                    value: 10,
                    params: [5],
                    paramStr: [],
                    errors: ['Should be less than 5']
                },
                {
                    value: 10,
                    params: [5, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 10,
                    params: [
                        5,
                        (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 = 10']
                }
            ]);
        });

        describe('shouldNotBeGreaterThanOrEqualTo', () => {
            it('should be a function', () =>
                expect(shouldNotBeGreaterThanOrEqualTo).toBeInstanceOf(
                    Function
                ));

            it('should return a function', () =>
                expect(shouldNotBeGreaterThanOrEqualTo(5)).toBeInstanceOf(
                    Function
                ));

            expectParamErrors(
                shouldNotBeGreaterThanOrEqualTo,
                'shouldNotBeGreaterThanOrEqualTo',
                [
                    {
                        value: 3,
                        params: [5]
                    },
                    {
                        value: 4,
                        params: [5]
                    },
                    {
                        value: 'hello',
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 10,
                        params: [5],
                        paramStr: [],
                        errors: ['Should not be greater than or equal to 5']
                    },
                    {
                        value: 10,
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 10,
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = 10']
                    }
                ]
            );
        });

        describe('shouldNotBeGreaterThan', () => {
            it('should be a function', () =>
                expect(shouldNotBeGreaterThan).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeGreaterThan(5)).toBeInstanceOf(Function));

            expectParamErrors(
                shouldNotBeGreaterThan,
                'shouldNotBeGreaterThan',
                [
                    {
                        value: 3,
                        params: [5]
                    },
                    {
                        value: 4,
                        params: [5]
                    },
                    {
                        value: 'hello',
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 10,
                        params: [5],
                        paramStr: [],
                        errors: ['Should not be greater than 5']
                    },
                    {
                        value: 10,
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 10,
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = 10']
                    }
                ]
            );
        });

        describe('shouldBeLessThanOrEqualTo', () => {
            it('should be a function', () =>
                expect(shouldBeLessThanOrEqualTo).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeLessThanOrEqualTo(5)).toBeInstanceOf(Function));

            expectParamErrors(
                shouldBeLessThanOrEqualTo,
                'shouldBeLessThanOrEqualTo',
                [
                    {
                        value: 3,
                        params: [5]
                    },
                    {
                        value: 4,
                        params: [5]
                    },
                    {
                        value: 'hello',
                        params: [5],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 10,
                        params: [5],
                        paramStr: [],
                        errors: ['Should be less than or equal to 5']
                    },
                    {
                        value: 10,
                        params: [5, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 10,
                        params: [
                            5,
                            (a, b, len, v) => `${a} + ${b} + ${len} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 = 10']
                    }
                ]
            );
        });

        describe('shouldBeBetweenValues', () => {
            it('should be a function', () =>
                expect(shouldBeBetweenValues).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldBeBetweenValues(5, 10)).toBeInstanceOf(Function));

            expectParamErrors(shouldBeBetweenValues, 'shouldBeBetweenValues', [
                {
                    value: 5,
                    params: [5, 10]
                },
                {
                    value: 8,
                    params: [5, 10]
                },
                {
                    value: 10,
                    params: [5, 10]
                },
                {
                    value: 'hello',
                    params: [5, 10],
                    paramStr: [],
                    errors: ['Should be a number']
                },
                {
                    value: 4,
                    params: [5, 10],
                    paramStr: [],
                    errors: ['Should be between 5 and 10']
                },
                {
                    value: 11,
                    params: [5, 10],
                    paramStr: [],
                    errors: ['Should be between 5 and 10']
                },
                {
                    value: 20,
                    params: [5, 10, 'mistake'],
                    paramStr: [],
                    errors: ['mistake']
                },
                {
                    value: 20,
                    params: [
                        5,
                        10,
                        (a, b, min, max, v) =>
                            `${a} + ${b} + ${min} + ${max} = ${v}`,
                        '123',
                        '456'
                    ],
                    paramStr: [null, 'custom message'],
                    errors: ['123 + 456 + 5 + 10 = 20']
                }
            ]);
        });

        describe('shouldNotBeBetweenValues', () => {
            it('should be a function', () =>
                expect(shouldNotBeBetweenValues).toBeInstanceOf(Function));

            it('should return a function', () =>
                expect(shouldNotBeBetweenValues(5, 10)).toBeInstanceOf(
                    Function
                ));

            expectParamErrors(
                shouldNotBeBetweenValues,
                'shouldNotBeBetweenValues',
                [
                    {
                        value: 4,
                        params: [5, 10]
                    },
                    {
                        value: 11,
                        params: [5, 10]
                    },
                    {
                        value: 'hello',
                        params: [5, 10],
                        paramStr: [],
                        errors: ['Should be a number']
                    },
                    {
                        value: 5,
                        params: [5, 10],
                        paramStr: [],
                        errors: ['Should not be between 5 and 10']
                    },
                    {
                        value: 8,
                        params: [5, 10],
                        paramStr: [],
                        errors: ['Should not be between 5 and 10']
                    },
                    {
                        value: 10,
                        params: [5, 10],
                        paramStr: [],
                        errors: ['Should not be between 5 and 10']
                    },
                    {
                        value: 8,
                        params: [5, 10, 'mistake'],
                        paramStr: [],
                        errors: ['mistake']
                    },
                    {
                        value: 8,
                        params: [
                            5,
                            10,
                            (a, b, min, max, v) =>
                                `${a} + ${b} + ${min} + ${max} = ${v}`,
                            '123',
                            '456'
                        ],
                        paramStr: [null, 'custom message'],
                        errors: ['123 + 456 + 5 + 10 = 8']
                    }
                ]
            );
        });
    });
});
