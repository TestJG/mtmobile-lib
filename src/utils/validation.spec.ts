import * as common from './common';
import {
    Validator,
    emptyValidator,
    makeValidator,
    mergeValidators,
    checkCondition,
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
            `${name}(${value}) should ` +
            (!errors.length
                ? 'not return any error'
                : `return ${errors.length} error(s)`);
        it(text, () => expect(fun(value)).toEqual(errors));
    });
}

describe('Utils', () => {
    describe('Validation Tests', () => {
        describe('emptyValidator', () => {
            it('should be a function', () =>
                expect(emptyValidator).toBeInstanceOf(Function));

            expectErrors(emptyValidator, null, [
                undefined,
                null,
                0,
                20,
                true,
                false,
                '',
                'hello',
                new Date()
            ]);
        });

        describe('emptyValidator', () => {
            it('should be a function', () =>
                expect(emptyValidator).toBeInstanceOf(Function));
        });
    });
});
