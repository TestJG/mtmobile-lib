import { Observable, Notification } from 'rxjs';
import { testObs } from './rxtest';
import * as common from '../../src/utils/common';
import * as rxutils from '../../src/utils/rxutils';
import { setTimeout } from 'timers';

describe('Utils', () => {
    describe('Reactive Utils', () => {
        describe('normalizeErrorOnCatch', () => {
            it('should be a function', () => {
                expect(rxutils.normalizeErrorOnCatch).toBeInstanceOf(Function);
            });

            [undefined, null, false, '', 0].forEach(element => {
                it(`on a ${JSON.stringify(
                    element
                )} error should return error.unknown`, done => {
                    testObs(
                        rxutils.normalizeErrorOnCatch(undefined),
                        [],
                        new Error('error.unknown'),
                        done
                    );
                });
            });

            it('on a non-falsy string should return an error with given string', done => {
                testObs(
                    rxutils.normalizeErrorOnCatch('some random error'),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an Error object with message should return the same Error', done => {
                testObs(
                    rxutils.normalizeErrorOnCatch(
                        new Error('some random error')
                    ),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an Error object with no message should return error.unknown', done => {
                testObs(
                    rxutils.normalizeErrorOnCatch(new Error()),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
            it('on an object with message should return an Error with given message', done => {
                testObs(
                    rxutils.normalizeErrorOnCatch({
                        message: 'some random error'
                    }),
                    [],
                    new Error('some random error'),
                    done
                );
            });
            it('on an unknown object should return error.unknown', done => {
                testObs(
                    rxutils.normalizeErrorOnCatch(new Date()),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('tryTo', () => {
            it('should be a function', () => {
                expect(rxutils.tryTo).toBeInstanceOf(Function);
            });

            it('on a single value should return an observable returning that single value', done => {
                testObs(
                    rxutils.tryTo(() => 'a value'),
                    ['a value'],
                    null,
                    done
                );
            });

            it('on an array value should return an observable returning that array as a whole', done => {
                testObs(
                    rxutils.tryTo(() => ['many', 'values']),
                    [['many', 'values']],
                    null,
                    done
                );
            });

            it('on a sync error should return an observable returning that error', done => {
                const actual = rxutils.tryTo(() => {
                    throw new Error('sync error');
                });
                testObs(actual, [], new Error('sync error'), done);
            });

            it('on a successful promise should return an observable returning the promise value', done => {
                const actual = rxutils.tryTo(
                    () =>
                        new Promise((r, _) => setTimeout(() => r('a value'), 1))
                );
                testObs(actual, ['a value'], null, done);
            });

            it('on a failed promise should return an observable returning the promise error', done => {
                const actual = rxutils.tryTo(
                    () =>
                        new Promise((_, r) =>
                            setTimeout(() => r(new Error('async error')), 1)
                        )
                );
                testObs(actual, [], new Error('async error'), done);
            });

            it('on a successful observable should return an observable returning the same values', done => {
                const actual = rxutils.tryTo(() =>
                    Observable.of(1, 2, 3).concatMap(v =>
                        Observable.of(v).delay(v)
                    )
                );
                testObs(actual, [1, 2, 3], null, done);
            });

            it('on a failing observable should return an observable failing the same way', done => {
                const actual = rxutils.tryTo(() =>
                    Observable.of(1, 2, 3)
                        .concatMap(v => Observable.of(v).delay(v))
                        .concat(Observable.throw(new Error('an error')))
                );
                testObs(actual, [1, 2, 3], new Error('an error'), done);
            });
        });

        describe('wrapFunctionStream', () => {
            it('should be a function', () => {
                expect(rxutils.wrapFunctionStream).toBeInstanceOf(Function);
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
                const actual = rxutils.wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(actual(5), [10, 15, 20], null, done);
            });

            it('should wait the last function to respond', done => {
                const fun$ = Observable.of(
                    (v: number) => Observable.of(v * 2, v * 3, v * 4),
                    (v: number) => Observable.of(v * 20, v * 30, v * 40),
                    (v: number) => Observable.of(v * 50, v * 60, v * 70)
                )
                    .concatMap((f, index) =>
                        Observable.of(f).delay((index + 1) * 10)
                    )
                    .delay(10);
                const actual = rxutils.wrapFunctionStream(fun$);
                expect(actual).toBeInstanceOf(Function);
                testObs(
                    rxutils.rxdelay<number>(100).concat(actual(5)),
                    [250, 300, 350],
                    null,
                    done
                );
            });
        });

        describe('wrapServiceStreamFromNames', () => {
            it('should be a function', () => {
                expect(rxutils.wrapServiceStreamFromNames).toBeInstanceOf(
                    Function
                );
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
                const actual = rxutils.wrapServiceStreamFromNames(obj$, [
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
                expect(rxutils.firstMap).toBeInstanceOf(Function);
            });

            it('should return only the first value', done => {
                testObs(
                    rxutils.firstMap(Observable.of(1, 2, 3))(common.id),
                    [1],
                    null,
                    done
                );
            });

            it('should map the values', done => {
                testObs(
                    rxutils.firstMap(Observable.of(1, 2, 3))(n => 10 * n),
                    [10],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    rxutils.firstMap(Observable.throw(4))(common.id),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('firstSwitchMap', () => {
            it('should be a function', () => {
                expect(rxutils.firstSwitchMap).toBeInstanceOf(Function);
            });

            it('should return only the first value', done => {
                testObs(
                    rxutils.firstSwitchMap(Observable.of(1, 2, 3))(
                        rxutils.rxid
                    ),
                    [1],
                    null,
                    done
                );
            });

            it('should map the values', done => {
                testObs(
                    rxutils.firstSwitchMap(Observable.of(1, 2, 3))(n =>
                        Observable.of(10 * n, 23 * n)
                    ),
                    [10, 23],
                    null,
                    done
                );
            });

            it('should normalize errors', done => {
                testObs(
                    rxutils.firstSwitchMap(Observable.throw(4))(rxutils.rxid),
                    [],
                    new Error('error.unknown'),
                    done
                );
            });
        });

        describe('makeState', () => {
            it('should be a function', () => {
                expect(rxutils.makeState).toBeInstanceOf(Function);
            });

            it('should scan through all intermediate states', done => {
                const update$ = Observable.of(
                    (n: number) => n + 1,
                    (n: number) => n + 2,
                    (n: number) => n + 3
                ).concatMap(f => Observable.of(f).delay(20));
                const [actual, subs] = rxutils.makeState(1, update$);
                testObs(actual, [1, 2, 4, 7], null, done);
            });
        });
    });
});
