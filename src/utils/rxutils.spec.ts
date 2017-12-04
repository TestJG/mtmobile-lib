import { Observable, Notification } from 'rxjs';
import { testObs } from './rxtest';
import * as rxutils from './rxutils';
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

            it('on a sync error should return an observable returning that error', done => {
                testObs(
                    rxutils.tryTo(() => {
                        throw new Error('sync error');
                    }),
                    [],
                    new Error('sync error'),
                    done
                );
            });

            it('on a successful promise should return an observable returning the promise value', done => {
                testObs(
                    rxutils.tryTo(
                        () =>
                            new Promise((r, _) =>
                                setTimeout(() => r('a value'), 1)
                            )
                    ),
                    ['a value'],
                    null,
                    done
                );
            });

            it('on a failed promise should return an observable returning the promise error', done => {
                testObs(
                    rxutils.tryTo(
                        () =>
                            new Promise((_, r) =>
                                setTimeout(() => r(new Error('async error')), 1)
                            )
                    ),
                    [],
                    new Error('async error'),
                    done
                );
            });

            it('on a successful observable should return an observable returning the same values', done => {
                testObs(
                    rxutils.tryTo(() =>
                        Observable.of(1, 2, 3).concatMap(v =>
                            Observable.of(v).delay(v)
                        )
                    ),
                    [1, 2, 3],
                    null,
                    done
                );
            });

            it('on a failing observable should return an observable failing the same way', done => {
                testObs(
                    rxutils.tryTo(() =>
                        Observable.of(1, 2, 3).concatMap(v =>
                            Observable.of(v).delay(v)
                        ).concat(Observable.throw(new Error('an error')))
                    ),
                    [1, 2, 3],
                    new Error('an error'),
                    done
                );
            });
        });
    });
});
