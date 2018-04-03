import {
    id,
    assign,
    assignArray,
    assignOrSame,
    assignOrSameWith,
    assignIf,
    errorToString,
    getAsValue,
    getAsValueOrError,
    joinStr,
    capString,
    normalizeError,
    objFlatMap,
    objMap,
    objMapValues,
    toKVArray,
    toKVMap,
    uuid,
    ValueOrFunc,
    printStr,
    compareTypes,
    compareSameType,
    compareNumber,
    compareFunction,
    compareArray,
    compareObject,
    compareBy,
    compareDataByType,
    printData,
    hasNewLine,
    printObj,
    printObj
} from '../../src/utils/common';

describe('Utils', () => {
    describe('Common Tests', () => {
        describe('id', () => {
            it('should be a function', () =>
                expect(id).toBeInstanceOf(Function));
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

        describe('assignArray', () => {
            it('should be a function', () => {
                expect(assignArray).toBeInstanceOf(Function);
            });
            it('should return the merged arrays when no new position is needed', () => {
                const init = [1, 2, 3, 4, 5, 6];
                const actual = assignArray(init, [0, [10, 20, 30]], [5, [60]]);
                const expected = [10, 20, 30, 4, 5, 60];
                expect(actual).toEqual(expected);
            });
            it('should return the merged arrays when new positions are needed', () => {
                const init = [1, 2, 3, 4, 5, 6];
                const actual = assignArray(
                    init,
                    [0, [10, 20, 30, 4, 5, 6, 7, 8, 9]],
                    [15, [100, 110, 120]]
                );
                const expected = [10, 20, 30, 4, 5, 6, 7, 8, 9, 100, 110, 120];
                expect(actual).toEqual(expected);
            });
            it('should accept null or undefined partials', () => {
                const init = [1, 2, 3, 4, 5, 6];
                expect(assignArray(init, undefined, null)).toEqual(init);
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

        describe('capString', () => {
            it('should be a function', () => {
                expect(capString).toBeInstanceOf(Function);
            });
            it('with very short string should return the same string', () => {
                expect(capString('', 10)).toEqual('');
                expect(capString('lorem', 10)).toEqual('lorem');
            });
            it('with string with max length should return the same string', () => {
                expect(capString('lorem ipsu', 10)).toEqual('lorem ipsu');
            });
            it('with long string should return the same string shortened to given length', () => {
                expect(capString('lorem ipsum', 10)).toEqual('lorem i...');
                expect(capString('lorem ipsum dolor', 10)).toEqual('lorem i...');
            });
            it('with very short string and empty ellipsis should return the same string', () => {
                expect(capString('', 10, '')).toEqual('');
                expect(capString('lorem', 10, '')).toEqual('lorem');
            });
            it('with string with max length and empty ellipsis should return the same string', () => {
                expect(capString('lorem ipsu', 10, '')).toEqual('lorem ipsu');
            });
            it('with long string and empty ellipsis should return the same string shortened to given length', () => {
                expect(capString('lorem ipsu', 10, '')).toEqual('lorem ipsu');
                expect(capString('lorem ipsum dolor', 10, '')).toEqual('lorem ipsu');
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

        describe('printStr', () => {
            it('should be a function', () =>
                expect(printStr).toBeInstanceOf(Function));

            it('should be a function', () =>
                expect(printStr('1234567890qwertyuiop', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 3
                })).toEqual('1234...iop');

            it('should be a function', () =>
                expect(printStr('1234567890', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 3
                })).toEqual('1234567890');

            it('should be a function', () =>
                expect(printStr('1234', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 3
                })).toEqual('1234');

            it('should be a function', () =>
                expect(printStr('1234567890qwertyuiop', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 0
                })).toEqual('1234567...');

            it('should be a function', () =>
                expect(printStr('1234567890', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 0
                })).toEqual('1234567890');

            it('should be a function', () =>
                expect(printStr('1234', {
                    maxLength: 10,
                    ellipsis: '...',
                    backChars: 0
                })).toEqual('1234');


        });

        describe('compareTypes', () => {
            it('should be a function', () =>
                expect(compareTypes).toBeInstanceOf(Function));

            const orderedTypes = [
                'string',
                'boolean',
                'number',
                'symbol',
                'undefined',
                'function',
                'object'
            ];

            for (let first = 0; first < orderedTypes.length; first++) {
                const f = orderedTypes[first];
                for (let second = 0; second < orderedTypes.length; second++) {
                    const s = orderedTypes[second];
                    const comp = first === second ? 0 : first < second ? -1 : 1;
                    it(`compareTypes('${f}', '${s}') = ${comp}`, () =>
                        expect(compareTypes(f, s)).toEqual(comp);
                }
            }
        });

        describe('compareSameType', () => {
            it('should be a function', () =>
                expect(compareSameType).toBeInstanceOf(Function));

            it('should compare strings', () => {
                expect(compareSameType('a', 'a')).toEqual(0);
                expect(compareSameType('A', 'a')).toEqual(-1);
                expect(compareSameType('a', 'A')).toEqual(1);
            });

            it('should compare booleans', () => {
                expect(compareSameType(false, false)).toEqual(0);
                expect(compareSameType(true, true)).toEqual(0);
                expect(compareSameType(false, true)).toEqual(-1);
                expect(compareSameType(true, false)).toEqual(1);
            });
        });

        describe('compareNumber', () => {
            it('should be a function', () =>
                expect(compareNumber).toBeInstanceOf(Function));

            it('should compare finite numbers', () => {
                expect(compareNumber(5, 5)).toEqual(0);
                expect(compareNumber(5, 15)).toEqual(-1);
                expect(compareNumber(15, 5)).toEqual(1);
            });

            it('should compare infinite numbers', () => {
                expect(compareNumber(Infinity, Infinity)).toEqual(0);
                expect(compareNumber(5, Infinity)).toEqual(-1);
                expect(compareNumber(Infinity, 5)).toEqual(1);
                expect(compareNumber(5, NaN)).toEqual(-1);
                expect(compareNumber(NaN, 5)).toEqual(1);
            });
        });

        describe('compareFunction', () => {
            it('should be a function', () =>
                expect(compareFunction).toBeInstanceOf(Function));

            const fa_1_1 = function a(p1: string) { return; };
            const fa_1_2 = function a(p2: number) { return; };
            const fa_2_1 = function a(p1: number, p2: string) { return; };
            const fb_1_1 = function b(p1: any) { return; };

            it('should compare functions', () => {
                expect(compareFunction(fa_1_1, fa_1_1)).toEqual(0);
                expect(compareFunction(fa_1_1, fa_1_2)).toEqual(0);
                expect(compareFunction(fa_1_1, fa_2_1)).toEqual(-1);
                expect(compareFunction(fa_1_1, fb_1_1)).toEqual(-1);
                expect(compareFunction(fa_2_1, fa_1_1)).toEqual(1);
                expect(compareFunction(fb_1_1, fa_1_1)).toEqual(1);
            });
        });

        describe('compareArray', () => {
            it('should be a function', () =>
                expect(compareArray).toBeInstanceOf(Function));

            const arr0 = [];
            const arr1_1 = ['a'];
            const arr1_2 = ['b'];
            const arr2_1 = ['a', 123];
            const arr2_2 = ['b', 123];
            const arr2_3 = ['a', 124];
            const arr3_1 = ['a', 123, true];

            it('should compare arrays', () => {
                expect(compareArray(arr0, [])).toEqual(0);
                expect(compareArray(arr0, arr1_1)).toEqual(-1);
                expect(compareArray(arr1_1, ['a'])).toEqual(0);
                expect(compareArray(arr1_1, arr1_2)).toEqual(-1);
                expect(compareArray(arr1_2, arr2_1)).toEqual(1);
                expect(compareArray(arr1_2, arr2_2)).toEqual(-1);
                expect(compareArray(arr2_1, arr2_2)).toEqual(-1);
                expect(compareArray(arr2_1, arr2_3)).toEqual(-1);
                expect(compareArray(arr2_2, arr2_3)).toEqual(1);
                expect(compareArray(arr3_1, arr1_1)).toEqual(1);
                expect(compareArray(arr3_1, arr1_2)).toEqual(-1);
                expect(compareArray(arr3_1, arr2_1)).toEqual(1);
                expect(compareArray(arr3_1, arr2_2)).toEqual(-1);
                expect(compareArray(arr3_1, arr2_3)).toEqual(-1);
            });
        });

        describe('compareObject', () => {
            it('should be a function', () =>
                expect(compareObject).toBeInstanceOf(Function));

            const obj0 = {};
            const obj1_1 = { name: 'john' };
            const obj1_2 = { name: 'jenna' };
            const obj2_1 = { age: 40, name: 'john' };
            const obj2_2 = { age: 28, name: 'jenna' };

            it('should compare objects', () => {
                expect(compareObject(obj0, {})).toEqual(0);
                expect(compareObject(obj0, obj1_1)).toEqual(-1);
                expect(compareObject(obj1_1, { name: 'john' })).toEqual(0);
                expect(compareObject(obj1_1, obj1_2)).toEqual(0);
                expect(compareObject(obj1_2, obj2_1)).toEqual(1);
                expect(compareObject(obj2_1, obj2_2)).toEqual(0);
                expect(compareObject(obj2_1, obj1_2)).toEqual(-1);
            });
        });

        describe('compareDataByType', () => {
            it('should be a function', () =>
                expect(compareDataByType).toBeInstanceOf(Function));

            const objs: any[] = [
                '',
                'abc',
                false,
                true,
                0,
                3.14,
                Symbol(''),
                Symbol('abc'),
                undefined,
                function a () {},
                function a (p: any) {},
                function b () {},
                null,
                [],
                ['a', false],
                [false],
                { age: 40, name: 'john' },
                { name: 'john' },
            ];

            for (let first = 0; first < objs.length; first++) {
                const f = objs[first];
                for (let second = 0; second < objs.length; second++) {
                    const s = objs[second];
                    const comp = first === second ? 0 : first < second ? -1 : 1;
                    it(`compareDataByType(${JSON.stringify(f)}, ${JSON.stringify(s)}) = ${comp}`, () =>
                        expect(compareDataByType(f, s)).toEqual(comp);
                }
            }
        });

        describe('printData', () => {
            it('should be a function', () =>
                expect(printData).toBeInstanceOf(Function));

            const objs: [any, string][] = [
                [ '', "''" ],
                [ 'abc', "'abc'" ],
                [ false, 'false' ],
                [ true, 'true' ],
                [ 0, '0' ],
                [ 3.14, '3.14' ],
                [ Symbol(''), 'Symbol()' ],
                [ Symbol('abc'), 'Symbol(abc)' ],
                [ undefined, 'undefined' ],
                [ function a () {}, 'a(... 0 args) => { ... }' ],
                [ function a (p: any) {}, 'a(... 1 args) => { ... }' ],
                [ function b () {}, 'b(... 0 args) => { ... }' ],
                [ null, 'null' ],
                [ [], '[]' ],
                [ ['a'], "[ 1 item ]" ],
                [ ['a', false], "[ ... 2 items ]" ],
                [ [false], '[ 1 item ]' ],
                [ new ArrayBuffer(10), "ArrayBuffer {}" ],
                [ { age: 40, name: 'john' }, "{ ... 2 properties }" ],
                [ { name: 'john' }, "{ 1 property }" ],
            ];

            for (let i = 0; i < objs.length; i++) {
                const [value, expected] = objs[i];
                it(`printData(${JSON.stringify(value)}) = '${expected}'`, () =>
                    expect(printData(value)).toEqual(expected);
            }
        });

        describe('hasNewLine', () => {
            it('should be a function', () =>
                expect(hasNewLine).toBeInstanceOf(Function));

            it('should detect no new line', () =>
                expect(hasNewLine('Has no line breaks')).toBeFalsy());

            it('should detect linux new line', () =>
                expect(hasNewLine('Has one \nline breaks')).toBeTruthy());

            it('should detect windows new line', () =>
                expect(hasNewLine('Has one \r\nline breaks')).toBeTruthy());

            it('should detect new line at line end', () =>
                expect(hasNewLine('Has one line break at the end\r\n')).toBeTruthy());

            it('should detect new line at line end', () =>
                expect(hasNewLine('\nHas one line break at the beginning')).toBeTruthy());
        });

        describe('prettyPrint', () => {
            it('should be a function', () =>
                expect(printObj).toBeInstanceOf(Function));

            const john = { age: 40, name: 'john' };
            const aFalse = ['a', false];
            const objs: [any, string][] = [
                [ '', "''" ],
                [ 'abc', "'abc'" ],
                [ false, 'false' ],
                [ true, 'true' ],
                [ 0, '0' ],
                [ 3.14, '3.14' ],
                [ Symbol(''), 'Symbol()' ],
                [ Symbol('abc'), 'Symbol(abc)' ],
                [ undefined, 'undefined' ],
                [ function a () {}, 'a(... 0 args) => { ... }' ],
                [ function a (p: any) {}, 'a(... 1 args) => { ... }' ],
                [ function b () {}, 'b(... 0 args) => { ... }' ],
                [ null, 'null' ],
                [ [], '[]' ],
                [ ['a'], "[ 'a' ]" ],
                [ aFalse, "[ 'a', false ]" ],
                [ [false], '[ false ]' ],
                [ new ArrayBuffer(10), "ArrayBuffer {}" ],
                [ john, "{ name: 'john', age: 40 }" ],
                [ { name: 'john' }, "{ name: 'john' }" ],
            ];

            for (let i = 0; i < objs.length; i++) {
                const [value, expected] = objs[i];
                it(`prettyPrint(${JSON.stringify(value)}) = '${expected}'`, () =>
                    expect(printObj(value)).toEqual(expected);
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['str' + i] = 'string ' + i;
                }

                it(`prettyPrint(complex object with string properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual("{ str1: 'string 1', str2: 'string 2', str3: 'string 3' }");
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['bool' + i] = i === 2;
                }

                it(`prettyPrint(complex object with boolean properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual("{ bool1: false, bool2: true, bool3: false }");
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['num' + i] = i;
                }

                it(`prettyPrint(complex object with number properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual("{ num1: 1, num2: 2, num3: 3 }");
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['sym' + i] = Symbol('s' + i);
                }

                it(`prettyPrint(complex object with symbol properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual("{ sym1: Symbol(s1), sym2: Symbol(s2), sym3: Symbol(s3) }");
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['und' + i] = undefined;
                }

                it(`prettyPrint(complex object with undefined properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual("{ und1: undefined, und2: undefined, und3: undefined }");
            }

            {
                const bigObject = {};
                for (let i = 1; i <= 3; i++) {
                    bigObject['obj' + i] = { ['prop' + i]: 'value' + i };
                }

                it(`prettyPrint(complex object with object properties) should work`, () =>
                    expect(printObj(bigObject)).toEqual(
                        "{ obj1: { prop1: 'value1' }, obj2: { prop2: 'value2' }, obj3: { prop3: 'value3' } }");

                it(`prettyPrint(complex object with object properties and short space) should work`, () =>
                    expect(printObj(bigObject, {
                        maxValueLength: 20
                    })).toEqual(`{
    obj1: { prop1: 'value1' },
    obj2: { prop2: 'value2' },
    obj3: { prop3: 'value3' }
}`);

                it(`prettyPrint(complex object with object properties and short space) should work`, () =>
                    expect(printObj(bigObject, {
                        maxValueLength: 10
                    })).toEqual(`{
    obj1: {
        prop1: 'value1'
    },
    obj2: {
        prop2: 'value2'
    },
    obj3: {
        prop3: 'value3'
    }
}`);
            }

            {
                const bigArray = [];
                for (let i = 1; i <= 10; i++) {
                    bigArray.push({ ['prop' + i]: 'value' + i });
                }

                it(`prettyPrint(complex array with object properties and short space) should work`, () =>
                    expect(printObj(bigArray, {
                        maxValueLength: 20
                    })).toEqual(`[
    { prop1: 'value1' },
    { prop2: 'value2' },
    { prop3: 'value3' },
    { prop4: 'value4' },
    { prop5: 'value5' },
    { prop6: 'value6' },
    { prop7: 'value7' },
    { prop8: 'value8' },
    { prop9: 'value9' },
    { prop10: 'value10' }
]`);

                it(`prettyPrint(complex array with object properties and short space) should work`, () =>
                    expect(printObj(bigArray, {
                        maxValueLength: 10
                    })).toEqual(`[
    {
        prop1: 'value1'
    },
    {
        prop2: 'value2'
    },
    {
        prop3: 'value3'
    },
    {
        prop4: 'value4'
    },
    {
        prop5: 'value5'
    },
    {
        prop6: 'value6'
    },
    {
        prop7: 'value7'
    },
    {
        prop8: 'value8'
    },
    {
        prop9: 'value9'
    },
    {
        prop10: 'value10'
    }
]`);
            }

            {
                const bigArray = [];
                for (let i = 1; i <= 9; i++) {
                    bigArray.push([i % 2 === 1, 'value' + i, i]);
                }

                it(`prettyPrint(complex array with object properties and short space) should work`, () =>
                    expect(printObj(bigArray, {
                        maxValueLength: 20
                    })).toEqual(`[
    [ true, 'value1', 1 ],
    [ false, 'value2', 2 ],
    [ true, 'value3', 3 ],
    [ false, 'value4', 4 ],
    [ true, 'value5', 5 ],
    [ false, 'value6', 6 ],
    [ true, 'value7', 7 ],
    [ false, 'value8', 8 ],
    [ true, 'value9', 9 ]
]`);

                it(`prettyPrint(complex array with object properties and short space) should work`, () =>
                    expect(printObj(bigArray, {
                        maxValueLength: 10
                    })).toEqual(`[
    [
        true,
        'value1',
        1
    ],
    [
        false,
        'value2',
        2
    ],
    [
        true,
        'value3',
        3
    ],
    [
        false,
        'value4',
        4
    ],
    [
        true,
        'value5',
        5
    ],
    [
        false,
        'value6',
        6
    ],
    [
        true,
        'value7',
        7
    ],
    [
        false,
        'value8',
        8
    ],
    [
        true,
        'value9',
        9
    ]
]`);
            }

            {
                const cyclicObject = {
                    a: {},
                    b: {},
                    c: {}
                };
                cyclicObject.c.next = cyclicObject;

                it(`prettyPrint(complex object cycles) should work`, () =>
                    expect(printObj(cyclicObject)).toEqual("{ a: {}, b: {}, c: { next: { cyclic reference ... } } }");
            }

            {
                const cyclicArray = [
                    {},
                    {},
                    {}
                ];
                cyclicArray[2].next = cyclicArray;

                it(`prettyPrint(complex array cycles) should work`, () =>
                    expect(printObj(cyclicArray)).toEqual("[ {}, {}, { next: [ cyclic reference ... ] } ]");
            }

            {
                const messyObject = {
                    a_object1: { name: 'john' },
                    a_object2: { age: 40, name: 'john' },
                    a_object3: new ArrayBuffer(10),
                    b_array1: [false],
                    b_array2: ['a', false],
                    b_array3: ['a'],
                    b_array4: [],
                    c_null: null,
                    d_func1: function b () {},
                    d_func2: function a (p: any) {},
                    d_func3: function a () {},
                    e_sym1: Symbol('abc'),
                    e_sym2: Symbol(),
                    f_num1: 3.14,
                    f_num2: 0,
                    g_bool1: true,
                    g_bool2: false,
                    h_string1: 'abc',
                    h_string2: '',
                    i_undefined1: undefined,
                };

                it(`prettyPrint(object with messy properties) should work`, () =>
                    expect(printObj(messyObject)).toEqual(`{
    h_string1: 'abc',
    h_string2: '',
    g_bool1: true,
    g_bool2: false,
    f_num1: 3.14,
    f_num2: 0,
    e_sym1: Symbol(abc),
    e_sym2: Symbol(),
    i_undefined1: undefined,
    a_object1: { name: 'john' },
    a_object2: { name: 'john', age: 40 },
    a_object3: ArrayBuffer {},
    b_array1: [ false ],
    b_array2: [ 'a', false ],
    b_array3: [ 'a' ],
    b_array4: [],
    c_null: null
}`);

                it(`prettyPrint(object with messy properties including functions) should work`, () =>
                    expect(printObj(messyObject, { excludeTypes: [] })).toEqual(`{
    h_string1: 'abc',
    h_string2: '',
    g_bool1: true,
    g_bool2: false,
    f_num1: 3.14,
    f_num2: 0,
    e_sym1: Symbol(abc),
    e_sym2: Symbol(),
    i_undefined1: undefined,
    d_func1: b(... 0 args) => { ... },
    d_func2: a(... 1 args) => { ... },
    d_func3: a(... 0 args) => { ... },
    a_object1: { name: 'john' },
    a_object2: { name: 'john', age: 40 },
    a_object3: ArrayBuffer {},
    b_array1: [ false ],
    b_array2: [ 'a', false ],
    b_array3: [ 'a' ],
    b_array4: [],
    c_null: null
}`);

                it(`prettyPrint(object with messy properties sorted by name) should work`, () =>
                    expect(printObj(messyObject, { excludeTypes: [], propertyOrder: 'byName' })).toEqual(`{
    a_object1: { name: 'john' },
    a_object2: { age: 40, name: 'john' },
    a_object3: ArrayBuffer {},
    b_array1: [ false ],
    b_array2: [ 'a', false ],
    b_array3: [ 'a' ],
    b_array4: [],
    c_null: null,
    d_func1: b(... 0 args) => { ... },
    d_func2: a(... 1 args) => { ... },
    d_func3: a(... 0 args) => { ... },
    e_sym1: Symbol(abc),
    e_sym2: Symbol(),
    f_num1: 3.14,
    f_num2: 0,
    g_bool1: true,
    g_bool2: false,
    h_string1: 'abc',
    h_string2: '',
    i_undefined1: undefined
}`);
            }
        });
    });
});
