import { Observable } from 'rxjs/Observable';
import { Notification } from 'rxjs/Notification';
import { testObs } from './rxtest';
import { id } from '../../src/utils/common';
import {
    normalizeErrorOnCatch,
    tryTo,
    wrapFunctionStream,
    wrapServiceStreamFromNames,
    firstMap,
    firstSwitchMap,
    makeState
} from '../../src/utils/rxutils';
import "rxjs/add/observable/timer";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/delay";

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

        describe('tryTo', () => {
            it('should be a function', () => {
                expect(tryTo).toBeInstanceOf(Function);
            });

            it('on a single value should return an observable returning that single value', done => {
                testObs(tryTo(() => 'a value'), ['a value'], null, done);
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
                    Observable.of(1, 2, 3).concatMap(v =>
                        Observable.of(v).delay(v)
                    )
                );
                testObs(actual, [1, 2, 3], null, done);
            });

            it('on a failing observable should return an observable failing the same way', done => {
                const actual = tryTo(() =>
                    Observable.of(1, 2, 3)
                        .concatMap(v => Observable.of(v).delay(v))
                        .concat(Observable.throw(new Error('an error')))
                );
                testObs(actual, [1, 2, 3], new Error('an error'), done);
            });

            it('on successful observable, deferred actions should be called after completion', done => {
                const defer1 = jasmine.createSpy('defer1');
                const defer2 = jasmine.createSpy('defer2');
                tryTo(defer => {
                    defer(defer1);
                    defer(defer2);
                    return Observable.timer(25);
                }).subscribe({
                    next: v => {
                        expect(defer1).not.toHaveBeenCalled();
                        expect(defer2).not.toHaveBeenCalled();
                    },
                    error: e => done.fail('Error should not be called'),
                    complete: () =>
                        Observable.timer(10).subscribe(() => {
                            expect(defer1).toHaveBeenCalledTimes(1);
                            expect(defer2).toHaveBeenCalledTimes(1);
                            done();
                        })
                });
            });

            it('on failing observable, deferred actions should be called after error', done => {
                const defer1 = jasmine.createSpy('defer1');
                const defer2 = jasmine.createSpy('defer2');
                tryTo(defer => {
                    defer(defer1);
                    defer(defer2);
                    return Observable.timer(25).map(() => { throw new Error(); });
                }).subscribe({
                    next: v => {
                        expect(defer1).not.toHaveBeenCalled();
                        expect(defer2).not.toHaveBeenCalled();
                    },
                    complete: () => done.fail('Complete should not be called'),
                    error: e =>
                        Observable.timer(10).subscribe(() => {
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
                const fun$ = Observable.of(
                    (v: number) => Observable.of(v * 2, v * 3, v * 4),
                    (v: number) => Observable.of(v * 20, v * 30, v * 40),
                    (v: number) => Observable.of(v * 50, v * 60, v * 70)
                )
                    .concatMap((f, index) =>
                        Observable.of(f).delay((index + 1) * 10)
                    )
                    .delay(10);
                const actual = wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(actual(5), [10, 15, 20], null, done);
            });

            it('should wait the last function to respond', done => {
                const functions = [
                    (v: number) => Observable.of(v * 2, v * 3, v * 4),
                    (v: number) => Observable.of(v * 20, v * 30, v * 40),
                    (v: number) => Observable.of(v * 50, v * 60, v * 70)
                ];
                const fun$ = Observable.timer(10, 5)
                    .take(3)
                    .map(i => functions[i]);
                const actual = wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(
                    Observable.timer(100).concatMap(() => actual(5)),
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
                    Observable.of(
                        v * 2 * factor,
                        v * 3 * factor,
                        v * 4 * factor
                    );
                const obj$ = Observable.of({
                    factor1: fun$(1),
                    factor2: fun$(2)
                }).delay(10);
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
                testObs(firstMap(Observable.of(1, 2, 3))(id), [1], null, done);
            });

            it('should map the values', done => {
                testObs(
                    firstMap(Observable.of(1, 2, 3))(n => 10 * n),
                    [10],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    firstMap(Observable.throw(4))(id),
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
                    firstSwitchMap(Observable.of(1, 2, 3))(x =>
                        Observable.of(x)
                    ),
                    [1],
                    null,
                    done
                );
            });

            it('should map the values', done => {
                testObs(
                    firstSwitchMap(Observable.of(1, 2, 3))(n =>
                        Observable.of(10 * n, 23 * n)
                    ),
                    [10, 23],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    firstSwitchMap(Observable.throw(4))(x => Observable.of(x)),
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
                const update$ = Observable.of(
                    (n: number) => n + 1,
                    (n: number) => n + 2,
                    (n: number) => n + 3
                ).concatMap(f => Observable.of(f).delay(20));
                const [actual, subs] = makeState(1, update$);
                testObs(actual, [1, 2, 4, 7], null, done);
            });
        });
    });
});
