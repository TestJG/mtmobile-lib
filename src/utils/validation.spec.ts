import * as common from './common';
import {
    Validator,
    emptyValidator,
    makeValidator,
    mergeValidators,
    checkCondition,
    shouldBe,
    shouldNotBe,
    shouldNotBeEmpty,
    shouldNotBeBlank,
    shouldMatch,
    shouldNotMatch,
    shouldNotBeShorterThan,
    shouldBeShorterThan,
    shouldNotBeLongerThan,
    shouldBeLongerThan,
    shouldBeGreaterThan,
    shouldBeLessThan,
    shouldBeLessThanOrEqualTo,
    shouldBeBetweenValues,
    shouldNotBeGreaterThan,
    shouldNotBeGreaterThanOrEqualTo,
    shouldNotBeLessThan,
    shouldNotBeLessThanOrEqualTo,
    shouldNotBeBetweenValues
} from './validation';
import { joinStr } from '../../index';

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
                paramStr = joinStr(', ', paramArr);
            }
        }
        expectErrors(fun(...(params || [])), `${name}(${paramStr})`, [
            [value, (errors || [])]
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

            expectErrors(makeValidator(undefined), 'makeValidator(undefined)', [
                'any value'
            ]);

            expectErrors(makeValidator(() => ''), "makeValidator(() => '')", [
                'any value'
            ]);

            expectErrors(
                makeValidator(() => '   '),
                "makeValidator(() => '   ')",
                ['any value']
            );

            expectErrors(makeValidator(() => []), 'makeValidator(() => [])', [
                'any value'
            ]);

            expectErrors(
                makeValidator(() => 'mistake'),
                'makeValidator(() => error)',
                [['any value', ['mistake']]]
            );

            expectErrors(
                makeValidator(() => ['mistake1', 'mistake2']),
                'makeValidator(() => [errors])',
                [['any value', ['mistake1', 'mistake2']]]
            );

            expectErrors(
                makeValidator(() => {
                    throw new Error('mistake');
                }),
                'makeValidator(() => {throw})',
                [['any value', ['mistake']]]
            );
        });

        describe('mergeValidators', () => {
            it('should be a function', () =>
                expect(mergeValidators).toBeInstanceOf(Function));

            expectErrors(mergeValidators([]), 'mergeValidators([])', [
                'any value'
            ]);

            expectErrors(
                mergeValidators(() => ''),
                "mergeValidators(() => '')",
                ['any value']
            );

            expectErrors(
                mergeValidators(() => 'mistake'),
                'mergeValidators(() => error)',
                [['any value', ['mistake']]]
            );

            expectErrors(
                mergeValidators([() => '', () => []]),
                'mergeValidators([...ok])',
                ['any value']
            );

            expectErrors(
                mergeValidators([
                    () => 'mistake1',
                    () => ['mistake2', 'mistake3']
                ]),
                'mergeValidators([...errors])',
                [['any value', ['mistake1', 'mistake2', 'mistake3']]]
            );
        });

        describe('checkCondition', () => {
            it('should be a function', () =>
                expect(checkCondition).toBeInstanceOf(Function));

            expectParamErrors(checkCondition, 'checkCondition', [
                {
                    value: 10,
                    params: [x => true, 'default'],
                    paramStr: ['...true'],
                },
                {
                    value: 10,
                    params: [x => true, 'default', 'mistake'],
                    paramStr: ['...true'],
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
                    params: [x => false, 'default', (a, b, v) => `${a} + ${b} = ${v}`, [3, 7]],
                    paramStr: ['...false', null, 'param. message'],
                    errors: ['3 + 7 = 10']
                },
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
                    paramStr: ['...true'],
                },
                {
                    value: 10,
                    params: [x => false, (a, b, v) => `${a} + ${b} = ${v}`, 3, 7],
                    paramStr: ['...false'],
                    errors: ['3 + 7 = 10']
                },
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
                    paramStr: ['...false'],
                },
                {
                    value: 10,
                    params: [x => true, (a, b, v) => `${a} + ${b} = ${v}`, 3, 7],
                    paramStr: ['...true'],
                    errors: ['3 + 7 = 10']
                },
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
    });
});
