import * as common from './common';

describe('Utils', () => {
    describe('Common Tests', () => {
        describe('id', () => {
            it('should be a function', () => {
                expect(common.id).toBeInstanceOf(Function);
            });
            it('should return the same input value', () => {
                [1, 'hello', Date(), true, 3.14159].forEach(element => {
                    expect(common.id(element)).toEqual(element);
                });
            });
        });

        describe('assign', () => {
            it('should be a function', () => {
                expect(common.assign).toBeInstanceOf(Function);
            });
            it('should return the merged object result', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe',
                    age: 40
                };
                const actual = common.assign(
                    init,
                    { lastName: 'Smith' },
                    { age: 29 }
                );
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
                expect(common.assign(init, undefined, null)).toEqual(init);
            });
        });

        describe('joinStr', () => {
            it('should be a function', () => {
                expect(common.joinStr).toBeInstanceOf(Function);
            });
            it('with no string should return empty string', () => {
                expect(common.joinStr(', ', [])).toEqual('');
            });
            it('with one string should return the same string', () => {
                expect(common.joinStr(', ', ['hello'])).toEqual('hello');
            });
            it('with many strings should return the joint strings using the given separator', () => {
                expect(common.joinStr(' ! ', ['hello', 'world'])).toEqual(
                    'hello ! world'
                );
            });
        });

        describe('uuid', () => {
            it('should be a function', () => {
                expect(common.uuid).toBeInstanceOf(Function);
            });
            it('should return a UUID identifier with given separator', () => {
                expect(common.uuid('+')).toMatch(
                    /^[0-9a-f]{8}\+[0-9a-f]{4}\+[0-9a-f]{4}\+[0-9a-f]{4}\+[0-9a-f]{12}$/
                );
            });
            it('should return a UUID identifier with default separator', () => {
                expect(common.uuid()).toMatch(
                    /^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/
                );
            });
            it('should not return the same UUID every time', () => {
                expect(common.uuid()).not.toEqual(common.uuid());
            });
        });

        describe('toKVArray', () => {
            it('should be a function', () => {
                expect(common.toKVArray).toBeInstanceOf(Function);
            });
            it('on an empty array should return an empty array', () => {
                expect(common.toKVArray([])).toEqual([]);
            });
            it('on an array with pairs should return the same array', () => {
                const init = [['firstName', 'John'], ['lastName', 'Doe']];
                expect(common.toKVArray(init)).toEqual(init);
            });
            it('on an empty object should return an empty array', () => {
                expect(common.toKVArray({})).toEqual([]);
            });
            it('on an empty object should return an empty array', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                const expected = [['firstName', 'John'], ['lastName', 'Doe']];
                expect(common.toKVArray(init)).toEqual(expected);
            });
        });

        describe('toKVMap', () => {
            it('should be a function', () => {
                expect(common.toKVMap).toBeInstanceOf(Function);
            });
            it('on an empty array should return an empty array', () => {
                expect(common.toKVMap([])).toEqual({});
            });
            it('on an array with pairs should return the same array', () => {
                const init = [['firstName', 'John'], ['lastName', 'Doe']];
                const expected = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(common.toKVMap(init)).toEqual(expected);
            });
            it('on an empty object should return an empty array', () => {
                expect(common.toKVMap({})).toEqual({});
            });
            it('on an empty object should return an empty array', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(common.toKVMap(init)).toEqual(init);
            });
        });

        describe('objFlatMap', () => {
            it('should be a function', () => {
                expect(common.objFlatMap).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(
                    common.objFlatMap(([key, value]) => [[key, value]])({})
                ).toEqual({});
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objFlatMap(([key, value]) => [[key, value]])(init)
                ).toEqual(init);
            });
            it('with clear mapper should return the empty object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(common.objFlatMap(([key, value]) => [])(init)).toEqual(
                    {}
                );
            });
            it('with multi mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objFlatMap(([key, value]) => [
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
                expect(common.objMap).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(
                    common.objMap(([key, value]) => [key, value])({})
                ).toEqual({});
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objMap(([key, value]) => [key, value])(init)
                ).toEqual(init);
            });
            it('with swapper mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objMap(([key, value]) => [value, key])(init)
                ).toEqual({
                    John: 'firstName',
                    Doe: 'lastName'
                });
            });
        });

        describe('objMapValues', () => {
            it('should be a function', () => {
                expect(common.objMapValues).toBeInstanceOf(Function);
            });
            it('on an empty object should return an empty object', () => {
                expect(common.objMapValues((value, key) => value)({})).toEqual(
                    {}
                );
            });
            it('with identity mapper should return the same object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objMapValues((value, key) => value)(init)
                ).toEqual(init);
            });
            it('with swapper mapper should return the correct object', () => {
                const init = {
                    firstName: 'John',
                    lastName: 'Doe'
                };
                expect(
                    common.objMapValues((value, key) => value + '_' + key)(init)
                ).toEqual({
                    firstName: 'John_firstName',
                    lastName: 'Doe_lastName'
                });
            });
        });

        describe('normalizeError', () => {
            it('should be a function', () => {
                expect(common.normalizeError).toBeInstanceOf(Function);
            });
            [undefined, null, false, '', 0].forEach(element => {
                it('on a ' + JSON.stringify(element) + ' error should return error.unknown', () => {
                    expect(common.normalizeError(element)).toEqual(
                        new Error('error.unknown')
                    );
                });
            });
            it('on a non-falsy string should return an error with given string', () => {
                expect(common.normalizeError('some random error')).toEqual(
                    new Error('some random error')
                );
            });
            it('on an Error object with message should return the same Error', () => {
                expect(
                    common.normalizeError(new Error('some random error'))
                ).toEqual(new Error('some random error'));
            });
            it('on an Error object with no message should return error.unknown', () => {
                expect(common.normalizeError(new Error())).toEqual(
                    new Error('error.unknown')
                );
            });
            it('on an object with message should return an Error with given message', () => {
                expect(
                    common.normalizeError({ message: 'some random error' })
                ).toEqual(new Error('some random error'));
            });
            it('on an unknown object should return error.unknown', () => {
                expect(common.normalizeError(new Date())).toEqual(
                    new Error('error.unknown')
                );
            });
        });

        describe('errorToString', () => {
            it('should be a function', () => {
                expect(common.errorToString).toBeInstanceOf(Function);
            });
            it('on a falsy error should return error.unknown', () => {
                expect(common.errorToString(undefined)).toEqual(
                    'error.unknown'
                );
                expect(common.errorToString(null)).toEqual('error.unknown');
                expect(common.errorToString(false)).toEqual('error.unknown');
                expect(common.errorToString('')).toEqual('error.unknown');
                expect(common.errorToString(0)).toEqual('error.unknown');
            });
            it('on a non-falsy string should return an error with given string', () => {
                expect(common.errorToString('some random error')).toEqual(
                    'some random error'
                );
            });
            it('on an Error object with message should return the same Error', () => {
                expect(
                    common.errorToString(new Error('some random error'))
                ).toEqual('some random error');
            });
            it('on an Error object with no message should return error.unknown', () => {
                expect(common.errorToString(new Error())).toEqual(
                    'error.unknown'
                );
            });
            it('on an object with message should return an Error with given message', () => {
                expect(
                    common.errorToString({ message: 'some random error' })
                ).toEqual('some random error');
            });
            it('on an unknown object should return error.unknown', () => {
                expect(common.errorToString(new Date())).toEqual(
                    'error.unknown'
                );
            });
        });
    });
});
