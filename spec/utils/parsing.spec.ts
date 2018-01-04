import {
    Parser,
    numberParser,
    integerParser,
    decimalParser
} from '../../src/utils/parsing';

describe('Utils', () => {
    describe('Parsing Tests', () => {
        describe('numberParser', () => {
            it('should be a function', () =>
                expect(numberParser).toBeInstanceOf(Function));

            it('should parse an integer', () =>
                expect(numberParser('1234')).toBe(1234));

            it('should parse a float', () =>
                expect(numberParser('12.34')).toBe(12.34));

            it('should parse a scientific number', () =>
                expect(numberParser('12.34e18')).toBe(12.34e18));

            it('should fail parsing a bad number', () =>
                expect(() => numberParser('xdfgj')).toThrowError());
        });

        describe('decimalParser', () => {
            it('should be a function', () =>
                expect(decimalParser).toBeInstanceOf(Function));

            it('should parse an integer', () =>
                expect(decimalParser('1234')).toBe(1234));

            it('should parse a float', () =>
                expect(decimalParser('12.34')).toBe(12));

            it('should parse a scientific number', () =>
                expect(decimalParser('12.34e18')).toBe(12));

            it('should fail parsing a bad number', () =>
                expect(() => decimalParser('xdfgj')).toThrowError());
        });
    });

        describe('integerParser', () => {
            it('should be a function', () =>
                expect(integerParser).toBeInstanceOf(Function));

            it('should parse an integer', () =>
                expect(integerParser(16)('1234')).toBe(0x1234));

            it('should parse a float', () =>
                expect(integerParser(16)('123.34')).toBe(0x123));

            it('should parse a scientific number', () =>
                expect(integerParser(16)('123.34e18')).toBe(0x123));

            it('should fail parsing a bad number', () =>
                expect(() => integerParser(16)('xdfgj')).toThrowError());
        });
    });
});
