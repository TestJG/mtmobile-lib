import {
    coerceAll,
    mustBeBetween,
    mustNotBeAbove,
    mustNotBeBelow
} from '../../src/utils/coercion';

describe('Utils', () => {
    describe('Coercion Tests', () => {
        describe('mergeCoerceList', () => {
            it('should be a function', () =>
                expect(coerceAll).toBeInstanceOf(Function));
        });

        describe('mustNotBeBelow', () => {
            it('should be a function', () =>
                expect(mustNotBeBelow).toBeInstanceOf(Function));

            it('when called with a number should return a function', () =>
                expect(mustNotBeBelow(100)).toBeInstanceOf(Function));

            [0, 99, 100, 101, 120].forEach(value => {
                const expected = value < 100 ? 100 : value;
                it(`mustNotBeBelow(100)(${value}) should return ${expected}`, () =>
                    expect(mustNotBeBelow(100)(value)).toBe(expected));
            });
        });

        describe('mustNotBeAbove', () => {
            it('should be a function', () =>
                expect(mustNotBeAbove).toBeInstanceOf(Function));

            it('when called with a number should return a function', () =>
                expect(mustNotBeAbove(100)).toBeInstanceOf(Function));

            [0, 99, 100, 101, 120].forEach(value => {
                const expected = value > 100 ? 100 : value;
                it(`mustNotBeAbove(100)(${value}) should return ${expected}`, () =>
                    expect(mustNotBeAbove(100)(value)).toBe(expected));
            });
        });

        describe('mustBeBetween', () => {
            it('should be a function', () =>
                expect(mustBeBetween).toBeInstanceOf(Function));

            it('when called with two numbers should return a function', () =>
                expect(mustBeBetween(50, 100)).toBeInstanceOf(Function));

            [0, 49, 50, 51, 99, 100, 101, 120].forEach(value => {
                const expected = value < 50 ? 50 : value > 100 ? 100 : value;
                it(`mustBeBetween(50, 100)(${value}) should return ${expected}`, () =>
                    expect(mustBeBetween(50, 100)(value)).toBe(expected));
            });
        });
    });
});
