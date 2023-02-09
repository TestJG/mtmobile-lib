/* eslint-disable max-len */
import { of, throwError, timer } from 'rxjs';
import { concatMap, concatWith, delay, map, take } from 'rxjs/operators';
import { id } from '../../src/utils/common';
import {
    firstMap,
    firstSwitchMap,
    isObservableInput,
    isSubscribable,
    makeState,
    normalizeErrorOnCatch,
    tryTo,
    wrapFunctionStream,
    wrapServiceStreamFromNames
} from '../../src/utils/rxutils';
import { testObs } from './rxtest';

describe('Utils', () => {
    describe('Reactive Utils', () => {
        describe('normalizeErrorOnCatch', () => {
            it('should be a function', () => {
                expect(normalizeErrorOnCatch).toBeInstanceOf(Function);
            });

            [undefined, null, false, '', 0].forEach(element => {
                it(`on a ${JSON.stringify(
                    element
                )} error should return error.unknown`, done => {
                    testObs(
                        normalizeErrorOnCatch(undefined),
                        [],
                        new Error('error.unknown'),
                        done
                    );
                });
            });

            it('on a non-falsy string should return an error with given string', done => {
                testObs(
                    normalizeErrorOnCatch('some random error'),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an Error object with message should return the same Error', done => {
                testObs(
                    normalizeErrorOnCatch(new Error('some random error')),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an Error object with no message should return error.unknown', done => {
                testObs(
                    normalizeErrorOnCatch(new Error()),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
            it('on an object with message should return an Error with given message', done => {
                testObs(
                    normalizeErrorOnCatch({
                        message: 'some random error'
                    }),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an unknown object should return error.unknown', done => {
                testObs(
                    normalizeErrorOnCatch(new Date()),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('isSubscribable', () => {
            it('should be a function', () => {
                expect(isSubscribable).toBeInstanceOf(Function);
            });
            it('should return true when an object is with a subscribe function is passed in as an argument', () => {
                expect(isSubscribable({ subscribe: () => {} })).toBe(true);
            });
            it('should return false when null is passed as an argument', () => {
                expect(isSubscribable(null)).toBe(false);
            });
            it('should return false when undefined string is passed as an argument', () => {
                expect(isSubscribable(undefined)).toBe(false);
            });
            it('should return false when an empty string is passed as an argument', () => {
                expect(isSubscribable('')).toBe(false);
            });
            it('should return false when a 0 is passed as an argument', () => {
                expect(isSubscribable(0)).toBe(false);
            });
            it('should return false when a function is passed as an argument', () => {
                expect(isSubscribable(() => null)).toBe(false);
            });
            it('should return false when an object is passed as an argument', () => {
                expect(isSubscribable({})).toBe(false);
            });
            it('should return false when a Symbol is passed as an argument', () => {
                expect(isSubscribable(Symbol(''))).toBe(false);
            });
        });

        describe('isObservableInput', () => {
            it('should return true when an iterator is passed as an argument', () => {
                expect(isObservableInput({ [Symbol.iterator]: () => {} })).toBe(
                    true
                );
            });
            it('should return false when a custom Subscribable is passed as an argument', () => {
                expect(isObservableInput({ subscribe: () => {} })).toBe(false);
            });
            it('should return true when a custom InterOpObservable is passed as an argument', () => {
                expect(
                    isObservableInput({ [Symbol.observable]: () => {} })
                ).toBe(true);
            });
            it('should return true when an observable is passed as an argument', () => {
                expect(isObservableInput(of([]))).toBe(true);
            });
            it('should return true when an array is passed as an argument', () => {
                expect(isObservableInput([])).toBe(true);
            });
            it('should return true when a promise is passed as an argument', () => {
                expect(isObservableInput(Promise.resolve())).toBe(true);
            });
            it('should return true when an empty string is passed as an argument', () => {
                expect(isObservableInput('')).toBe(true);
            });
            it('should return false when null is passed as an argument', () => {
                expect(isObservableInput(null)).toBe(false);
            });
            it('should return false when undefined string is passed as an argument', () => {
                expect(isObservableInput(undefined)).toBe(false);
            });
            it('should return false when a 0 is passed as an argument', () => {
                expect(isObservableInput(0)).toBe(false);
            });
            it('should return false when a function is passed as an argument', () => {
                expect(isObservableInput(() => null)).toBe(false);
            });
            it('should return false when an object is passed as an argument', () => {
                expect(isObservableInput({})).toBe(false);
            });
            it('should return false when a Symbol is passed as an argument', () => {
                expect(isObservableInput(Symbol(''))).toBe(false);
            });
        });

        describe('tryTo', () => {
            it('should be a function', () => {
                expect(tryTo).toBeInstanceOf(Function);
            });

            it('on a single value should return an observable returning that single value', done => {
                testObs(
                    tryTo(() => 'a value'),
                    ['a value'],
                    null,
                    done
                );
            });

            it('on an array value should return an observable returning that array as a whole', done => {
                testObs(
                    tryTo(() => ['many', 'values']),
                    [['many', 'values']],
                    null,
                    done
                );
            });

            it('on a sync error should return an observable returning that error', done => {
                const actual = tryTo(() => {
                    throw new Error('sync error');
                });
                testObs(actual, [], new Error('sync error'), done);
            });

            it('on a successful promise should return an observable returning the promise value', done => {
                const actual = tryTo(
                    () =>
                        new Promise((r, _) => setTimeout(() => r('a value'), 1))
                );
                testObs(actual, ['a value'], null, done);
            });

            it('on a failed promise should return an observable returning the promise error', done => {
                const actual = tryTo(
                    () =>
                        new Promise((_, r) =>
                            setTimeout(() => r(new Error('async error')), 1)
                        )
                );
                testObs(actual, [], new Error('async error'), done);
            });

            it('on a successful observable should return an observable returning the same values', done => {
                const actual = tryTo(() =>
                    of(1, 2, 3).pipe(concatMap(v => of(v).pipe(delay(v))))
                );
                testObs(actual, [1, 2, 3], null, done);
            });

            it('on a failing observable should return an observable failing the same way', done => {
                const actual = tryTo(() =>
                    of(1, 2, 3).pipe(
                        concatMap(v => of(v).pipe(delay(v))),
                        concatWith(throwError(() => new Error('an error')))
                    )
                );
                testObs(actual, [1, 2, 3], new Error('an error'), done);
            });

            it('on successful observable, deferred actions should be called after completion', done => {
                const defer1 = jest.fn();
                const defer2 = jest.fn();
                tryTo(defer => {
                    defer(defer1);
                    defer(defer2);
                    return timer(25);
                }).subscribe({
                    next: v => {
                        expect(defer1).not.toHaveBeenCalled();
                        expect(defer2).not.toHaveBeenCalled();
                    },
                    error: e => done('Error should not be called'),
                    complete: () =>
                        timer(10).subscribe(() => {
                            expect(defer1).toHaveBeenCalledTimes(1);
                            expect(defer2).toHaveBeenCalledTimes(1);
                            done();
                        })
                });
            });

            it('on failing observable, deferred actions should be called after error', done => {
                const defer1 = jest.fn();
                const defer2 = jest.fn();
                tryTo(defer => {
                    defer(defer1);
                    defer(defer2);
                    return timer(25).pipe(
                        map(() => {
                            throw new Error();
                        })
                    );
                }).subscribe({
                    next: v => {
                        expect(defer1).not.toHaveBeenCalled();
                        expect(defer2).not.toHaveBeenCalled();
                    },
                    complete: () => done('Complete should not be called'),
                    error: e =>
                        timer(10).subscribe(() => {
                            expect(defer1).toHaveBeenCalledTimes(1);
                            expect(defer2).toHaveBeenCalledTimes(1);
                            done();
                        })
                });
            });
        });

        describe('wrapFunctionStream', () => {
            it('should be a function', () => {
                expect(wrapFunctionStream).toBeInstanceOf(Function);
            });

            it('should wait the first function to respond', done => {
                const fun$ = of(
                    (v: number) => of(v * 2, v * 3, v * 4),
                    (v: number) => of(v * 20, v * 30, v * 40),
                    (v: number) => of(v * 50, v * 60, v * 70)
                ).pipe(
                    concatMap((f, index) =>
                        of(f).pipe(delay((index + 1) * 10))
                    ),
                    delay(10)
                );
                const actual = wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(actual(5), [10, 15, 20], null, done);
            });

            it('should wait the last function to respond', done => {
                const functions = [
                    (v: number) => of(v * 2, v * 3, v * 4),
                    (v: number) => of(v * 20, v * 30, v * 40),
                    (v: number) => of(v * 50, v * 60, v * 70)
                ];
                const fun$ = timer(10, 5).pipe(
                    take(3),
                    map(i => functions[i])
                );
                const actual = wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(
                    timer(100).pipe(concatMap(() => actual(5))),
                    [250, 300, 350],
                    null,
                    done
                );
            });
        });

        describe('wrapServiceStreamFromNames', () => {
            it('should be a function', () => {
                expect(wrapServiceStreamFromNames).toBeInstanceOf(Function);
            });

            it('should wait the first function to respond', done => {
                const fun$ = (factor: number) => (v: number) =>
                    of(v * 2 * factor, v * 3 * factor, v * 4 * factor);
                const obj$ = of({
                    factor1: fun$(1),
                    factor2: fun$(2)
                }).pipe(delay(10));
                const actual = wrapServiceStreamFromNames(obj$, [
                    'factor1',
                    'factor2'
                ]);
                expect(typeof actual).toEqual('object');
                expect(actual.factor1).toBeInstanceOf(Function);
                expect(actual.factor2).toBeInstanceOf(Function);
                testObs(actual.factor2(5), [20, 30, 40], null, done);
            });
        });

        describe('firstMap', () => {
            it('should be a function', () => {
                expect(firstMap).toBeInstanceOf(Function);
            });

            it('should return only the first value', done => {
                testObs(firstMap(of(1, 2, 3))(id), [1], null, done);
            });

            it('should map the values', done => {
                testObs(
                    firstMap(of(1, 2, 3))(n => 10 * n),
                    [10],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    firstMap(throwError(() => 4))(id),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('firstSwitchMap', () => {
            it('should be a function', () => {
                expect(firstSwitchMap).toBeInstanceOf(Function);
            });

            it('should return only the first value', done => {
                testObs(
                    firstSwitchMap(of(1, 2, 3))(x => of(x)),
                    [1],
                    null,
                    done
                );
            });

            it('should map the values', done => {
                testObs(
                    firstSwitchMap(of(1, 2, 3))(n => of(10 * n, 23 * n)),
                    [10, 23],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    firstSwitchMap(throwError(() => 4))(x => of(x)),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('makeState', () => {
            it('should be a function', () => {
                expect(makeState).toBeInstanceOf(Function);
            });

            it('should scan through all intermediate states', done => {
                const update$ = of(
                    (n: number) => n + 1,
                    (n: number) => n + 2,
                    (n: number) => n + 3
                ).pipe(concatMap(f => of(f).pipe(delay(20))));
                const [actual, _subs] = makeState(1, update$);
                testObs(actual, [1, 2, 4, 7], null, done);
            });
        });
    });
});
