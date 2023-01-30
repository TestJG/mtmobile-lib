import { ArgumentOutOfRangeError } from 'rxjs';
import {
    defaultErrorFormatter,
    defaultTaskFormatter,
    defaultValueFormatter,
    logProcessor,
    logProcessorCore,
    task
} from '../../src/processes';

describe('Processes', () => {
    describe('logProcessor', () => {
        it('should be a function', () =>
            expect(logProcessor).toBeInstanceOf(Function));
    });

    describe('logProcessorCore', () => {
        it('should be a function', () =>
            expect(logProcessorCore).toBeInstanceOf(Function));
    });

    describe('defaultTaskFormatter', () => {
        it('should be a function', () =>
            expect(defaultTaskFormatter).toBeInstanceOf(Function));

        it('its result should be a function', () =>
            expect(defaultTaskFormatter()).toBeInstanceOf(Function));

        it('it should work as expected', () => {
            const item = task(
                'the-kind',
                'lorem ipsum dolor',
                '12345678-ABCD-WXYZ'
            );
            expect(defaultTaskFormatter(10, 4)(item, true)).toBe(
                'the-kind [1234] "lorem ...'
            );
            expect(defaultTaskFormatter(10)(item, true)).toBe(
                'the-kind [12345678-ABCD-WXYZ] "lorem ...'
            );
            expect(defaultTaskFormatter(10, 4)(item, false)).toBe(
                'the-kind [1234]'
            );
            expect(defaultTaskFormatter(10)(item, false)).toBe(
                'the-kind [12345678-ABCD-WXYZ]'
            );
        });
    });

    describe('defaultErrorFormatter', () => {
        it('should be a function', () =>
            expect(defaultErrorFormatter).toBeInstanceOf(Function));

        it('its result should be a function', () =>
            expect(defaultErrorFormatter()).toBeInstanceOf(Function));

        it('it should work as expected', () => {
            expect(
                defaultErrorFormatter(false)(new Error('Simple error'))
            ).toBe('Error: Simple error');
            expect(
                defaultErrorFormatter(true)(new Error('Simple error'))
            ).not.toBe('Error: Simple error');
            expect(
                defaultErrorFormatter(false)(new ArgumentOutOfRangeError())
            ).toBe('ArgumentOutOfRangeError: argument out of range');
        });
    });

    describe('defaultValueFormatter', () => {
        it('should be a function', () =>
            expect(defaultValueFormatter).toBeInstanceOf(Function));

        it('its result should be a function', () =>
            expect(defaultValueFormatter()).toBeInstanceOf(Function));

        it('it should work as expected', () => {
            const item = task(
                'the-kind',
                'lorem ipsum dolor',
                '12345678-ABCD-WXYZ'
            );
            expect(defaultValueFormatter(20)(item)).toBe(
                '{"kind":"the-kind...'
            );
            expect(defaultValueFormatter(10)(item)).toBe('{"kind"...');
        });
    });
});
