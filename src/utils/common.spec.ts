import { assign, id } from './common';

describe('Utils', () => {
    describe('Common Tests', () => {
        describe('id', () => {
            it('should be a function', () => {
                expect(id).toBeInstanceOf(Function);
            });
            it('should return the same input value', () => {
                [1, 'hello', Date(), true, 3.14159].forEach(element => {
                    expect(id(element)).toEqual(element);
                });
            });
        });

        describe('assign', () => {
            it('should be a function', () => {
                expect(assign).toBeInstanceOf(Function);
            });
            it('should return the merged object result', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe',
                    age: 40
                };
                const actual = assign(init, { lastName: 'Smith' }, { age: 29 });
                const expected = {
                    firstName: 'John',
                    lastName: 'Smith',
                    age: 29
                };
                expect(actual).toEqual(expected);
            });
            it('should accept null or undefined partials', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe',
                    age: 40
                };
                expect(assign(init, undefined, null)).toEqual(init);
            });
        });
    });
});
