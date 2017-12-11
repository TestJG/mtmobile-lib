import {
    assign,
    assignOrSame,
    assignOrSameWith,
    deepEqual,
    EqualityComparer,
    deepEqualStrict,
    errorToString,
    id,
    joinStr,
    normalizeError,
    objFlatMap,
    objMap,
    objMapValues,
    relaxedEqual,
    shallowEqual,
    shallowEqualStrict,
    strictEqual,
    toKVArray,
    toKVMap,
    uuid
} from './common';

describe('Utils', () => {
    describe('Common Tests', () => {
        describe('id', () => {
            it('should be a function', () => {
                expect(id).toBeInstanceOf(Function);
            });
            [1, 'hello', Date(), true, 3.14159].forEach(element => {
                it(
                    'should return the same input value: ' +
                        JSON.stringify(element),
                    () => {
                        expect(id(element)).toEqual(element);
                    }
                );
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

        function getValue(value: (() => any) | any): any {
            if (typeof value === 'function') {
                return value();
            } else {
                return value;
            }
        }

        function testEquivalenceClasses(
            fun: EqualityComparer<any>,
            name: string,
            classes: Array<Array<(() => any) | any>>
        ) {
            for (let index = 0; index < classes.length; index++) {
                const values = classes[index];

                // A value should be 'EQUAL' to other values in the same equivalence class
                values.map(getValue).forEach(copy1 =>
                    values.map(getValue).forEach(copy2 => {
                        it(`${JSON.stringify(copy1)} should be ${
                            name
                        } to ${JSON.stringify(copy2)}`, () => {
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

                    values.map(getValue).forEach(copy1 =>
                        otherValues.map(getValue).forEach(copy2 => {
                            it(`${JSON.stringify(copy1)} should not be ${
                                name
                            } to ${JSON.stringify(copy2)}`, () => {
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
            values: Array<(() => any) | any>
        ) {
            values.forEach(value => {
                const copy1 = getValue(value);
                const copy2 = getValue(value);
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
                [() => new Date(2017, 1, 1)]
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

        describe('assignOrSameWith', () => {
            it('should be a function', () => {
                expect(assignOrSameWith).toBeInstanceOf(Function);
            });

            it('for a true equality should always return the original object untouched', () => {
                const v1 = { a: 'hello', b: 123 };
                const copy = JSON.parse(JSON.stringify(v1));
                const v2 = assignOrSameWith(() => true, v1, { b: 234 });
                expect(v2).toBe(v1);
                expect(v2).toEqual(copy);
            });

            it('for a false equality should always return the modified object, without modifying the original', () => {
                const v1 = { a: 'hello', b: 123 };
                const copy = JSON.parse(JSON.stringify(v1));
                const v2 = assignOrSameWith(() => false, v1, { b: 234 });
                expect(v2).not.toBe(v1);
                expect(v1).toEqual(copy);
                expect(v2).toEqual({ a: 'hello', b: 234 });
            });
        });

        describe('assignOrSame', () => {
            it('should be a function', () => {
                expect(assignOrSame).toBeInstanceOf(Function);
            });

            it('if the object do not change should always return the original object untouched', () => {
                const v1 = { a: 'hello', b: 123 };
                const copy = JSON.parse(JSON.stringify(v1));
                const v2 = assignOrSame(v1, { b: 123 });
                expect(v2).toBe(v1);
                expect(v2).toEqual(copy);
            });

            it('if the object do change should always return the modified object, without modifying the original', () => {
                const v1 = { a: 'hello', b: 123 };
                const copy = JSON.parse(JSON.stringify(v1));
                const v2 = assignOrSame(v1, { b: 234 });
                expect(v2).not.toBe(v1);
                expect(v1).toEqual(copy);
                expect(v2).toEqual({ a: 'hello', b: 234 });
            });
        });

        describe('joinStr', () => {
            it('should be a function', () => {
                expect(joinStr).toBeInstanceOf(Function);
            });
            it('with no string should return empty string', () => {
                expect(joinStr(', ', [])).toEqual('');
            });
            it('with one string should return the same string', () => {
                expect(joinStr(', ', ['hello'])).toEqual('hello');
            });
            it('with many strings should return the joint strings using the given separator', () => {
                expect(joinStr(' ! ', ['hello', 'world'])).toEqual(
                    'hello ! world'
                );
            });
        });

        describe('uuid', () => {
            it('should be a function', () => {
                expect(uuid).toBeInstanceOf(Function);
            });
            it('should return a UUID identifier with given separator', () => {
                expect(uuid('+')).toMatch(
                    /^[0-9a-f]{8}\+[0-9a-f]{4}\+[0-9a-f]{4}\+[0-9a-f]{4}\+[0-9a-f]{12}$/
                );
            });
            it('should return a UUID identifier with default separator', () => {
                expect(uuid()).toMatch(
                    /^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/
                );
            });
            it('should not return the same UUID every time', () => {
                expect(uuid()).not.toEqual(uuid());
            });
        });

        describe('toKVArray', () => {
            it('should be a function', () => {
                expect(toKVArray).toBeInstanceOf(Function);
            });
            it('on an empty array should return an empty array', () => {
                expect(toKVArray([])).toEqual([]);
            });
            it('on an array with pairs should return the same array', () => {
                const init = [['firstName', 'John'], ['lastName', 'Doe']];
                expect(toKVArray(init)).toEqual(init);
            });
            it('on an empty object should return an empty array', () => {
                expect(toKVArray({})).toEqual([]);
            });
            it('on an empty object should return an empty array', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                const expected = [['firstName', 'John'], ['lastName', 'Doe']];
                expect(toKVArray(init)).toEqual(expected);
            });
        });

        describe('toKVMap', () => {
            it('should be a function', () => {
                expect(toKVMap).toBeInstanceOf(Function);
            });
            it('on an empty array should return an empty array', () => {
                expect(toKVMap([])).toEqual({});
            });
            it('on an array with pairs should return the same array', () => {
                const init = [['firstName', 'John'], ['lastName', 'Doe']];
                const expected = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(toKVMap(init)).toEqual(expected);
            });
            it('on an empty object should return an empty array', () => {
                expect(toKVMap({})).toEqual({});
            });
            it('on an empty object should return an empty array', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(toKVMap(init)).toEqual(init);
            });
        });

        describe('objFlatMap', () => {
            it('should be a function', () => {
                expect(objFlatMap).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(
                    objFlatMap(([key, value]) => [[key, value]])({})
                ).toEqual({});
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    objFlatMap(([key, value]) => [[key, value]])(init)
                ).toEqual(init);
            });
            it('with clear mapper should return the empty object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(objFlatMap(([key, value]) => [])(init)).toEqual({});
            });
            it('with multi mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    objFlatMap(([key, value]) => [
                        [key + '_' + value, value + '#1'],
                        [value + '_' + key, value + '#2']
                    ])(init)
                ).toEqual({
                    firstName_John: 'John#1',
                    John_firstName: 'John#2',
                    lastName_Doe: 'Doe#1',
                    Doe_lastName: 'Doe#2'
                });
            });
        });

        describe('objMap', () => {
            it('should be a function', () => {
                expect(objMap).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(objMap(([key, value]) => [key, value])({})).toEqual({});
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(objMap(([key, value]) => [key, value])(init)).toEqual(
                    init
                );
            });
            it('with swapper mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(objMap(([key, value]) => [value, key])(init)).toEqual({
                    John: 'firstName',
                    Doe: 'lastName'
                });
            });
        });

        describe('objMapValues', () => {
            it('should be a function', () => {
                expect(objMapValues).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(objMapValues((value, key) => value)({})).toEqual({});
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(objMapValues((value, key) => value)(init)).toEqual(init);
            });
            it('with swapper mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    objMapValues((value, key) => value + '_' + key)(init)
                ).toEqual({
                    firstName: 'John_firstName',
                    lastName: 'Doe_lastName'
                });
            });
        });

        describe('normalizeError', () => {
            it('should be a function', () => {
                expect(normalizeError).toBeInstanceOf(Function);
            });
            [undefined, null, false, '', 0].forEach(element => {
                it(
                    'on a ' +
                        JSON.stringify(element) +
                        ' error should return error.unknown',
                    () => {
                        expect(normalizeError(element)).toEqual(
                            new Error('error.unknown')
                        );
                    }
                );
            });
            it('on a non-falsy string should return an error with given string', () => {
                expect(normalizeError('some random error')).toEqual(
                    new Error('some random error')
                );
            });
            it('on an Error object with message should return the same Error', () => {
                expect(normalizeError(new Error('some random error'))).toEqual(
                    new Error('some random error')
                );
            });
            it('on an Error object with no message should return error.unknown', () => {
                expect(normalizeError(new Error())).toEqual(
                    new Error('error.unknown')
                );
            });
            it('on an object with message should return an Error with given message', () => {
                expect(
                    normalizeError({ message: 'some random error' })
                ).toEqual(new Error('some random error'));
            });
            it('on an unknown object should return error.unknown', () => {
                expect(normalizeError(new Date())).toEqual(
                    new Error('error.unknown')
                );
            });
        });

        describe('errorToString', () => {
            it('should be a function', () => {
                expect(errorToString).toBeInstanceOf(Function);
            });
            it('on a falsy error should return error.unknown', () => {
                expect(errorToString(undefined)).toEqual('error.unknown');
                expect(errorToString(null)).toEqual('error.unknown');
                expect(errorToString(false)).toEqual('error.unknown');
                expect(errorToString('')).toEqual('error.unknown');
                expect(errorToString(0)).toEqual('error.unknown');
            });
            it('on a non-falsy string should return an error with given string', () => {
                expect(errorToString('some random error')).toEqual(
                    'some random error'
                );
            });
            it('on an Error object with message should return the same Error', () => {
                expect(errorToString(new Error('some random error'))).toEqual(
                    'some random error'
                );
            });
            it('on an Error object with no message should return error.unknown', () => {
                expect(errorToString(new Error())).toEqual('error.unknown');
            });
            it('on an object with message should return an Error with given message', () => {
                expect(errorToString({ message: 'some random error' })).toEqual(
                    'some random error'
                );
            });
            it('on an unknown object should return error.unknown', () => {
                expect(errorToString(new Date())).toEqual('error.unknown');
            });
        });
    });
});
