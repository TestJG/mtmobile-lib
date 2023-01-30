import type { ValueOrFunc } from '../../src/utils/common';
import { getAsValue } from '../../src/utils/common';
import type { EqualityComparer } from '../../src/utils/equality';
import {
    deepEqual,
    deepEqualStrict,
    relaxedEqual,
    shallowEqual,
    shallowEqualStrict,
    strictEqual
} from '../../src/utils/equality';

function testEquivalenceClasses(
    fun: EqualityComparer<any>,
    name: string,
    classes: Array<Array<ValueOrFunc>>
) {
    for (let index = 0; index < classes.length; index++) {
        const values = classes[index];

        // A value should be 'EQUAL' to other values in the same equivalence class
        values.map(getAsValue).forEach(copy1 =>
            values.map(getAsValue).forEach(copy2 => {
                it(`${JSON.stringify(
                    copy1
                )} should be ${name} to ${JSON.stringify(copy2)}`, () => {
                    expect(fun(copy1, copy2)).toBeTruthy();
                });
            })
        );

        // A value should not be 'EQUAL' to other values in different equivalence class
        for (let index2 = 0; index2 < classes.length; index2++) {
            if (index2 === index) {
                continue;
            }
            const otherValues = classes[index2];

            values.map(getAsValue).forEach(copy1 =>
                otherValues.map(getAsValue).forEach(copy2 => {
                    it(`${JSON.stringify(
                        copy1
                    )} should not be ${name} to ${JSON.stringify(
                        copy2
                    )}`, () => {
                        expect(fun(copy1, copy2)).toBeFalsy();
                    });
                })
            );
        }
    }
}

function testDeepObjects(
    fun: EqualityComparer<any>,
    name: string,
    shouldBeEqual: boolean,
    values: Array<ValueOrFunc>
) {
    values.forEach(value => {
        const copy1 = getAsValue(value);
        const copy2 = getAsValue(value);
        it(`${JSON.stringify(copy1)} should ${
            shouldBeEqual ? '' : 'not '
        }be ${name} to ${JSON.stringify(copy2)}`, () => {
            if (shouldBeEqual) {
                expect(fun(copy1, copy2)).toBeTruthy();
            } else {
                expect(fun(copy1, copy2)).toBeFalsy();
            }
        });
    });
}

describe('Utils', () => {
    describe('Equality Tests', () => {
        describe('strictEqual', () => {
            it('should be a function', () => {
                expect(strictEqual).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(strictEqual, 'strictEqual', [
                [undefined],
                [null],
                [false],
                [true],
                [0],
                [NaN],
                [''],
                [1234],
                ['abcd'],
                [[]],
                [{}],
                [[1, 2, 3, 5]],
                [{ a: 'one', b: 2 }],
                [new Date(2017, 1, 1)]
            ]);

            testDeepObjects(strictEqual, 'strictEqual', false, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });

        describe('relaxedEqual', () => {
            it('should be a function', () => {
                expect(relaxedEqual).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(relaxedEqual, 'relaxedEqual', [
                [undefined, null],
                [false, 0, '', []],
                [NaN],
                [true, 1, '1'],
                [1234, '1234'],
                [() => 'ab' + 'cd'],
                [{}],
                [[1, 2, 3, 5]],
                [{ a: 'one', b: 2 }],
                [new Date(2017, 1, 1)]
            ]);

            testDeepObjects(relaxedEqual, 'relaxedEqual', false, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });

        describe('shallowEqualStrict', () => {
            it('should be a function', () => {
                expect(shallowEqualStrict).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(shallowEqualStrict, 'shallowEqualStrict', [
                [undefined],
                [null],
                [false],
                [true],
                [0],
                [''],
                [1234],
                [() => 'ab' + 'cd'],
                [() => []],
                [() => ({})],
                [() => [1, 2, 3, 5]],
                [() => ({ a: 'one', b: 2 })],
                [() => new Date(2017, 1, 1)],
                [() => new Error('some error message')]
            ]);

            testDeepObjects(shallowEqualStrict, 'shallowEqualStrict', false, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });

        describe('shallowEqual', () => {
            it('should be a function', () => {
                expect(shallowEqual).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(shallowEqual, 'shallowEqual', [
                [undefined, null],
                [false, 0, '', []],
                [true, 1, '1'],
                [1234, '1234'],
                [() => 'ab' + 'cd'],
                [() => ({})],
                [() => [1, 2, 3, 5]],
                [() => ({ a: 'one', b: 2 })],
                [() => new Date(2017, 1, 1)]
            ]);

            testDeepObjects(shallowEqual, 'shallowEqual', false, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });

        describe('deepEqualStrict', () => {
            it('should be a function', () => {
                expect(deepEqualStrict).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(deepEqualStrict, 'deepEqualStrict', [
                [undefined],
                [null],
                [false],
                [true],
                [0],
                [''],
                [1234],
                [() => 'ab' + 'cd'],
                [() => []],
                [() => ({})],
                [() => [1, 2, 3, 5]],
                [() => ({ a: 'one', b: 2 })],
                [() => new Date(2017, 1, 1)]
            ]);

            testDeepObjects(deepEqualStrict, 'deepEqualStrict', true, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });

        describe('deepEqual', () => {
            it('should be a function', () => {
                expect(deepEqual).toBeInstanceOf(Function);
            });

            testEquivalenceClasses(deepEqual, 'deepEqual', [
                [undefined, null],
                [false, 0, '', []],
                [true, 1, '1'],
                [1234, '1234'],
                [() => 'ab' + 'cd'],
                [() => ({})],
                [() => [1, 2, 3, 5]],
                [() => ({ a: 'one', b: 2 })],
                [() => new Date(2017, 1, 1)]
            ]);

            testDeepObjects(deepEqual, 'deepEqual', true, [
                () => ({ a: { x: 1 }, b: 'hello' }),
                () => [{ x: 1 }, 'hello'],
                () => ({ a: [1, 2, 3], b: 'hello' }),
                () => [[1, 2, 3], 'hello']
            ]);
        });
    });
});
