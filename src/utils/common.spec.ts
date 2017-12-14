import {
    assign,
    assignOrSame,
    assignOrSameWith,
    assignIf,
    errorToString,
    getAsValue,
    getAsValueOrError,
    id,
    joinStr,
    normalizeError,
    objFlatMap,
    objMap,
    objMapValues,
    toKVArray,
    toKVMap,
    uuid,
    ValueOrFunc
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
                        expect(id(element)).toBe(element);
                    }
                );
            });
        });

        describe('getAsValue', () => {
            it('should be a function', () => {
                expect(getAsValue).toBeInstanceOf(Function);
            });
            it('when used with a non-function value should return the same value', () => {
                expect(getAsValue(undefined)).toBeUndefined();
                expect(getAsValue(1)).toBe(1);
                expect(getAsValue('hello')).toBe('hello');
                expect(getAsValue(['hello'])).toEqual(['hello']);
                expect(getAsValue({ greetings: 'hello' })).toEqual({
                    greetings: 'hello'
                });
            });
            it('when used with a function should return the computed value', () => {
                expect(getAsValue(() => undefined)).toBeUndefined();
                expect(getAsValue(() => 1)).toBe(1);
                expect(getAsValue(() => 'hello')).toBe('hello');
                expect(getAsValue(() => ['hello'])).toEqual(['hello']);
                expect(getAsValue(() => ({ greetings: 'hello' }))).toEqual({
                    greetings: 'hello'
                });
            });
            it('when used with a function should pass the arguments to it', () => {
                expect(getAsValue(a => a + 5, 10)).toBe(15);
                expect(getAsValue((a, b) => a + b, 10, 23)).toBe(33);
                expect(getAsValue((a, b, c) => a + b * c, 10, 2, 3)).toBe(16);
            });
            it('when used with a failing function should throw the same error', () => {
                expect(() =>
                    getAsValue(() => {
                        throw new Error('sorry!');
                    })
                ).toThrowError();
            });
        });

        describe('getAsValueOrError', () => {
            it('should be a function', () => {
                expect(getAsValueOrError).toBeInstanceOf(Function);
            });
            it('when used with a non-function value should return the same value', () => {
                expect(getAsValueOrError(undefined, id)).toBeUndefined();
                expect(getAsValueOrError(1, id)).toBe(1);
                expect(getAsValueOrError('hello', id)).toBe('hello');
                expect(getAsValueOrError(['hello'], id)).toEqual(['hello']);
                expect(getAsValueOrError({ greetings: 'hello' }, id)).toEqual({
                    greetings: 'hello'
                });
            });
            it('when used with a function should return the computed value', () => {
                expect(getAsValueOrError(() => undefined, id)).toBeUndefined();
                expect(getAsValueOrError(() => 1, id)).toBe(1);
                expect(getAsValueOrError(() => 'hello', id)).toBe('hello');
                expect(getAsValueOrError(() => ['hello'], id)).toEqual([
                    'hello'
                ]);
                expect(
                    getAsValueOrError(() => ({ greetings: 'hello' }), id)
                ).toEqual({
                    greetings: 'hello'
                });
            });
            it('when used with a function should pass the arguments to it', () => {
                expect(getAsValueOrError(a => a + 5, id, 10)).toBe(15);
                expect(getAsValueOrError((a, b) => a + b, id, 10, 23)).toBe(33);
                expect(
                    getAsValueOrError((a, b, c) => a + b * c, id, 10, 2, 3)
                ).toBe(16);
            });
            it('when used with a failing function should throw the same error', () => {
                expect(
                    getAsValueOrError(() => {
                        throw new Error('sorry!');
                    }, err => err.message)
                ).toBe('sorry!');
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

        describe('assignIf', () => {
            it('should be a function', () => {
                expect(assignIf).toBeInstanceOf(Function);
            });

            function testCases(
                kind: 'original' | 'modified',
                cases: Array<
                    [
                        string,
                        string,
                        ValueOrFunc,
                        ValueOrFunc<boolean>,
                        ValueOrFunc
                    ]
                >
            ) {
                cases.forEach(([condStr, valStr, orig, cond, val]) => {
                    const text = `if passed ${condStr}${
                        valStr ? ' and ' + valStr : ''
                    } › it should return the ${kind} object`;
                    it(text, () => {
                        const v1 = getAsValue(orig);
                        const copy = JSON.parse(JSON.stringify(v1));
                        const v2 = assignIf(v1, cond, val);
                        if (kind === 'original') {
                            expect(v2).toBe(v1);
                            expect(v2).toEqual(copy);
                        } else {
                            expect(v2).not.toBe(v1);
                            expect(v1).toEqual(copy);
                            expect(v2).toEqual(
                                Object.assign({}, v1, getAsValue(v2))
                            );
                        }
                    });
                });
            }

            const original = () => ({ a: 'hello', b: 123 });

            testCases('original', [
                ['a false condition value', '', original, false, { b: 234 }],
                [
                    'a false condition function',
                    '',
                    original,
                    () => false,
                    { b: 234 }
                ],
                [
                    'a true condition value',
                    'non-modifying changes value',
                    original,
                    true,
                    { b: 123 }
                ],
                [
                    'a true condition function',
                    'non-modifying changes value',
                    original,
                    () => true,
                    { b: 123 }
                ],
                [
                    'a true condition value',
                    'non-modifying changes function',
                    original,
                    true,
                    () => ({ b: 123 })
                ],
                [
                    'a true condition function',
                    'non-modifying changes function',
                    original,
                    () => true,
                    () => ({ b: 123 })
                ]
            ]);

            testCases('modified', [
                [
                    'a true condition value',
                    'modifying changes value',
                    original,
                    true,
                    { b: 234 }
                ],
                [
                    'a true condition function',
                    'modifying changes value',
                    original,
                    () => true,
                    { b: 234 }
                ],
                [
                    'a true condition value',
                    'modifying changes function',
                    original,
                    true,
                    () => ({ b: 234 })
                ],
                [
                    'a true condition function',
                    'modifying changes function',
                    original,
                    () => true,
                    () => ({ b: 234 })
                ]
            ]);
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
