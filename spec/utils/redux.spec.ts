/* eslint-disable max-len */
import { of } from 'rxjs';
import * as common from '../../src/utils/common';
import * as redux from '../../src/utils/redux';
import { testObs } from './rxtest';

interface Person {
    firstName: string;
    lastName: string;
    age: number;
}

interface User {
    doing: string;
}

const john = (): Person => ({
    firstName: 'John',
    lastName: 'Doe',
    age: 42
});

describe('Utils', () => {
    describe('Redux Utils', () => {
        describe('partialReducer', () => {
            it('should be a function', () => {
                expect(redux.partialReducer).toBeInstanceOf(Function);
            });

            [true, false, undefined, null].forEach(element =>
                it(
                    'when the partial reducer returns ' +
                        JSON.stringify(element) +
                        ', it should create the correct reducer',
                    () => {
                        const pr = (p: Person, age: number) => element;
                        const reducer = redux.partialReducer(pr);
                        expect(reducer).toBeInstanceOf(Function);
                        expect(reducer(john(), 43)).toEqual(john());
                    }
                )
            );

            it('when the partial reducer returns a single partial state, it should create the correct reducer', () => {
                const pr = (p: Person, age: number) => ({ age });
                const reducer = redux.partialReducer(pr);
                expect(reducer(john(), 43)).toEqual(
                    common.assign(john(), { age: 43 })
                );
            });

            it('when the partial reducer returns a many partial states, it should create the correct reducer', () => {
                const pr = (p: Person, age: number) => [
                    { age },
                    { lastName: 'Smith' }
                ];
                const reducer = redux.partialReducer(pr);
                expect(reducer(john(), 43)).toEqual(
                    common.assign(john(), { age: 43, lastName: 'Smith' })
                );
            });
        });

        describe('simpleReducer', () => {
            it('should be a function', () => {
                expect(redux.simpleReducer).toBeInstanceOf(Function);
            });

            [true, false, undefined, null].forEach(element =>
                it(
                    'when the simple reducer returns ' +
                        JSON.stringify(element) +
                        ', it should create the correct reducer',
                    () => {
                        const pr = (p: Person) => element;
                        const reducer = redux.simpleReducer(pr);
                        expect(reducer).toBeInstanceOf(Function);
                        expect(reducer(john())).toEqual(john());
                    }
                )
            );

            it('when the simple reducer returns a single partial state, it should create the correct reducer', () => {
                const pr = (p: Person) => ({ age: p.age + 1 });
                const reducer = redux.simpleReducer(pr);
                expect(reducer(john())).toEqual(
                    common.assign(john(), { age: 43 })
                );
            });

            it('when the simple reducer returns a many partial states, it should create the correct reducer', () => {
                const pr = (p: Person) => [
                    { age: p.age + 1 },
                    { lastName: 'Smith' }
                ];
                const reducer = redux.simpleReducer(pr);
                expect(reducer(john())).toEqual(
                    common.assign(john(), { age: 43, lastName: 'Smith' })
                );
            });
        });

        describe('action', () => {
            it('should be a function', () => {
                expect(redux.action).toBeInstanceOf(Function);
            });

            describe('when an action description is created with reducer', () => {
                const setAge = redux.action<number, Person>(
                    'MYMODULE',
                    'SetAge',
                    (p, age) => ({ ...p, age })
                );

                it('it should be a function', () =>
                    expect(setAge).toBeInstanceOf(Function));
                it("it's property 'is' should be a function", () =>
                    expect(setAge.is).toBeInstanceOf(Function));
                it("it's property 'filter' should be a function", () =>
                    expect(setAge.filter).toBeInstanceOf(Function));
                it("it's property 'reducer' should be a function", () =>
                    expect(setAge.reducer).toBeInstanceOf(Function));

                it("it's prefix should be the given prefix", () =>
                    expect(setAge.prefix).toEqual('MYMODULE'));
                it("it's actionName should be the given actionName", () =>
                    expect(setAge.actionName).toEqual('SetAge'));
                it("it's type should be the given type", () =>
                    expect(setAge.type).toEqual('MYMODULE:SetAge'));

                it('it should create an action of corresponding type', () =>
                    expect(setAge(42)).toEqual({
                        type: 'MYMODULE:SetAge',
                        payload: 42
                    }));

                it("function 'is' should recognize a corresponding action", () =>
                    expect(setAge.is(setAge(42))).toBeTruthy());

                it("function 'is' should reject a non-corresponding action", () =>
                    expect(setAge.is({ type: 'other action' })).toBeFalsy());

                it("function 'filter' should filter out non-corresponding actions", done => {
                    testObs(
                        setAge.filter(
                            of(setAge(42), { type: 'other action' }, setAge(15))
                        ),
                        [42, 15],
                        null,
                        done
                    );
                });

                it("function 'reducer' should apply corresponding reduction", () =>
                    expect(setAge.reducer(john(), 43)).toEqual({
                        ...john(),
                        age: 43
                    }));
            });

            describe('when an action description is created without reducer', () => {
                const setAge = redux.action<number, Person>(
                    'MYMODULE',
                    'SetAge'
                );
                it("it's property 'reducer' should be a function", () =>
                    expect(setAge.reducer).toBeInstanceOf(Function));

                it("function 'reducer' should keep previous state untouched", () => {
                    const j = john();
                    expect(setAge.reducer(j, 43)).toBe(j);
                });
            });
        });

        describe('actionEmpty', () => {
            it('should be a function', () => {
                expect(redux.actionEmpty).toBeInstanceOf(Function);
            });

            describe('when an actionEmpty description is created with reducer', () => {
                const incAge = redux.actionEmpty<Person>(
                    'MYMODULE',
                    'IncAge',
                    p => ({ ...p, age: p.age + 1 })
                );

                it('it should be a function', () =>
                    expect(incAge).toBeInstanceOf(Function));
                it("it's property 'is' should be a function", () =>
                    expect(incAge.is).toBeInstanceOf(Function));
                it("it's property 'filter' should be a function", () =>
                    expect(incAge.filter).toBeInstanceOf(Function));
                it("it's property 'reducer' should be a function", () =>
                    expect(incAge.reducer).toBeInstanceOf(Function));

                it("it's prefix should be the given prefix", () =>
                    expect(incAge.prefix).toEqual('MYMODULE'));
                it("it's actionName should be the given actionName", () =>
                    expect(incAge.actionName).toEqual('IncAge'));
                it("it's type should be the given type", () =>
                    expect(incAge.type).toEqual('MYMODULE:IncAge'));

                it('it should create an action of corresponding type', () =>
                    expect(incAge()).toEqual({
                        type: 'MYMODULE:IncAge'
                    }));

                it("function 'is' should recognize a corresponding action", () =>
                    expect(incAge.is(incAge())).toBeTruthy());

                it("function 'is' should reject a non-corresponding action", () =>
                    expect(incAge.is({ type: 'other action' })).toBeFalsy());

                it("function 'filter' should filter out non-corresponding actions", done => {
                    testObs(
                        incAge.filter(
                            of(incAge(), { type: 'other action' }, incAge())
                        ),
                        [null, null],
                        null,
                        done
                    );
                });

                it("function 'reducer' should apply corresponding reduction", () =>
                    expect(incAge.reducer(john(), 43)).toEqual({
                        ...john(),
                        age: 43
                    }));
            });

            describe('when an action description is created without reducer', () => {
                const incAge = redux.actionEmpty<Person>('MYMODULE', 'IncAge');
                it("it's property 'reducer' should be a function", () =>
                    expect(incAge.reducer).toBeInstanceOf(Function));

                it("function 'reducer' should keep previous state untouched", () => {
                    const j = john();
                    expect(incAge.reducer(j, null)).toBe(j);
                });
            });
        });

        describe('partial', () => {
            it('should be a function', () => {
                expect(redux.partial).toBeInstanceOf(Function);
            });

            describe('when an action description is created with reducer', () => {
                const setAge = redux.partial<number, Person>(
                    'MYMODULE',
                    'SetAge',
                    (p, age) => ({ age })
                );

                it('it should be a function', () =>
                    expect(setAge).toBeInstanceOf(Function));
                it("it's property 'is' should be a function", () =>
                    expect(setAge.is).toBeInstanceOf(Function));
                it("it's property 'filter' should be a function", () =>
                    expect(setAge.filter).toBeInstanceOf(Function));
                it("it's property 'reducer' should be a function", () =>
                    expect(setAge.reducer).toBeInstanceOf(Function));

                it("it's prefix should be the given prefix", () =>
                    expect(setAge.prefix).toEqual('MYMODULE'));
                it("it's actionName should be the given actionName", () =>
                    expect(setAge.actionName).toEqual('SetAge'));
                it("it's type should be the given type", () =>
                    expect(setAge.type).toEqual('MYMODULE:SetAge'));

                it('it should create an action of corresponding type', () =>
                    expect(setAge(42)).toEqual({
                        type: 'MYMODULE:SetAge',
                        payload: 42
                    }));

                it("function 'is' should recognize a corresponding action", () =>
                    expect(setAge.is(setAge(42))).toBeTruthy());

                it("function 'is' should reject a non-corresponding action", () =>
                    expect(setAge.is({ type: 'other action' })).toBeFalsy());

                it("function 'filter' should filter out non-corresponding actions", done => {
                    testObs(
                        setAge.filter(
                            of(setAge(42), { type: 'other action' }, setAge(15))
                        ),
                        [42, 15],
                        null,
                        done
                    );
                });

                it("function 'reducer' should apply corresponding reduction", () =>
                    expect(setAge.reducer(john(), 43)).toEqual({
                        ...john(),
                        age: 43
                    }));
            });
        });
        describe('partialEmpty', () => {
            it('should be a function', () => {
                expect(redux.partialEmpty).toBeInstanceOf(Function);
            });

            describe('when an partialEmpty description is created with reducer', () => {
                const incAge = redux.partialEmpty<Person>(
                    'MYMODULE',
                    'IncAge',
                    p => ({ age: p.age + 1 })
                );

                it('it should be a function', () =>
                    expect(incAge).toBeInstanceOf(Function));
                it("it's property 'is' should be a function", () =>
                    expect(incAge.is).toBeInstanceOf(Function));
                it("it's property 'filter' should be a function", () =>
                    expect(incAge.filter).toBeInstanceOf(Function));
                it("it's property 'reducer' should be a function", () =>
                    expect(incAge.reducer).toBeInstanceOf(Function));

                it("it's prefix should be the given prefix", () =>
                    expect(incAge.prefix).toEqual('MYMODULE'));
                it("it's actionName should be the given actionName", () =>
                    expect(incAge.actionName).toEqual('IncAge'));
                it("it's type should be the given type", () =>
                    expect(incAge.type).toEqual('MYMODULE:IncAge'));

                it('it should create an action of corresponding type', () =>
                    expect(incAge()).toEqual({
                        type: 'MYMODULE:IncAge'
                    }));

                it("function 'is' should recognize a corresponding action", () =>
                    expect(incAge.is(incAge())).toBeTruthy());

                it("function 'is' should reject a non-corresponding action", () =>
                    expect(incAge.is({ type: 'other action' })).toBeFalsy());

                it("function 'filter' should filter out non-corresponding actions", done => {
                    testObs(
                        incAge.filter(
                            of(incAge(), { type: 'other action' }, incAge())
                        ),
                        [null, null],
                        null,
                        done
                    );
                });

                it("function 'reducer' should apply corresponding reduction", () =>
                    expect(incAge.reducer(john(), 43)).toEqual({
                        ...john(),
                        age: 43
                    }));
            });
        });

        describe('makeReducer', () => {
            it('should be a function', () => {
                expect(redux.makeReducer).toBeInstanceOf(Function);
            });

            it('when previous state is undefined, it should return the initial state', () => {
                const reducer = redux.makeReducer(john())();
                const actual = reducer(undefined, { type: 'X' });
                expect(actual).toEqual(john());
            });

            it('when given one ActionsMap, it should applied its reducers', () => {
                const actions = {
                    incAge: redux.partialEmpty<Person>(
                        'PERSON',
                        'incAge',
                        p => ({ age: p.age + 1 })
                    ),
                    setAge: redux.partial<number, Person>(
                        'PERSON',
                        'setAge',
                        (_, age) => ({ age })
                    ),
                    doNothing: redux.action<string, Person>(
                        'PERSON',
                        'doNothing'
                    )
                };
                const reducer = redux.makeReducer(john())(actions);
                const state1 = reducer(john(), actions.incAge());
                expect(state1).toEqual({ ...john(), age: 43 });
                const state2 = reducer(state1, actions.setAge(45));
                expect(state2).toEqual({ ...state1, age: 45 });
                const state3 = reducer(state2, actions.doNothing('stuff'));
                expect(state3).toBe(state2);
            });

            it('when given many ActionsMap, it should applied its reducers', () => {
                const actions1 = {
                    incAge: redux.partialEmpty<Person>(
                        'PERSON',
                        'incAge',
                        p => ({ age: p.age + 1 })
                    )
                };
                const actions2 = {
                    setAge: redux.partial<number, Person>(
                        'PERSON',
                        'setAge',
                        (_, age) => ({ age })
                    )
                };
                const actions3 = {
                    doNothing: redux.action<string, Person>(
                        'PERSON',
                        'doNothing'
                    )
                };
                const reducer = redux.makeReducer(john())(
                    actions1,
                    actions2,
                    actions3
                );
                const state1 = reducer(john(), actions1.incAge());
                expect(state1).toEqual({ ...john(), age: 43 });
                const state2 = reducer(state1, actions2.setAge(45));
                expect(state2).toEqual({ ...state1, age: 45 });
                const state3 = reducer(state2, actions3.doNothing('stuff'));
                expect(state3).toBe(state2);
            });
        });

        describe('overrideActions', () => {
            it('should be a function', () => {
                expect(redux.overrideActions).toBeInstanceOf(Function);
            });

            it('when given one ActionsMap, it should override its reducers', () => {
                const actions = {
                    incAge: redux.partialEmpty<Person>(
                        'PERSON',
                        'incAge',
                        p => ({ age: p.age + 1 })
                    ),
                    setAge: redux.partial<number, Person>(
                        'PERSON',
                        'setAge',
                        (_, age) => ({ age })
                    ),
                    doNothing: redux.action<string, Person>(
                        'PERSON',
                        'doNothing'
                    )
                };
                const overriden = redux.overrideActions(actions, {
                    doNothing: (u: User, what: string) => ({ doing: what })
                });
                expect(typeof overriden).toEqual('object');

                const aUser = { doing: '' };
                const reducer = redux.makeReducer<User>(aUser)(overriden);
                const state1 = reducer(aUser, actions.incAge());
                expect(state1).toBe(aUser);
                const state2 = reducer(state1, actions.setAge(45));
                expect(state2).toBe(aUser);
                const state3 = reducer(state2, actions.doNothing('stuff'));
                expect(state3).toEqual({ ...aUser, doing: 'stuff' });
            });
        });
    });
});
