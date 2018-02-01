import { Observable, Observer } from 'rxjs';
import {
    chan,
    promiseChan,
    go,
    spawn,
    timeout,
    alts,
    put,
    take,
    putAsync,
    operations,
    CLOSED
} from 'js-csp';
import { testObs } from './rxtest';
import {
    channelToObservable,
    observableToChan,
    firstToChan,
    generatorToChan,
    isChan,
    isInstruction,
    promiseToChan,
    toChan,
    toYielder,
    startPinging,
    startLeasing,
    PipelineSequenceTarget,
    toNamedTarget,
    toIndexedTarget,
    toOffsetTarget,
    toCurrentTarget,
    toNextTarget,
    toPreviousTarget,
    runPipelineNode,
    runPipelineSequence,
    iterableToChan
} from '../../src/utils/csp';
import { conditionalLog } from '../../src/utils/common';

const chanWithOne = (value: any) => {
    const ch = promiseChan();
    putAsync(ch, value);
    return ch;
};

describe('Utils', () => {
    describe('CSP Tests', () => {
        describe('isChan', () => {
            it('should be a function', () =>
                expect(isChan).toBeInstanceOf(Function));

            it('with a channel should return true', () =>
                expect(isChan(chan())).toBeTruthy());

            it('with a promiseChan should return true', () =>
                expect(isChan(promiseChan())).toBeTruthy());

            it('with an instruction should return false', () =>
                expect(isChan(take(chan()))).toBeFalsy());
        });

        describe('isInstruction', () => {
            it('should be a function', () =>
                expect(isInstruction).toBeInstanceOf(Function));

            it('with a channel should return false', () =>
                expect(isInstruction(chan())).toBeFalsy());

            it('with a promiseChan should return false', () =>
                expect(isInstruction(promiseChan())).toBeFalsy());

            it('with an instruction should return true', () =>
                expect(isInstruction(take(chan()))).toBeTruthy());
        });

        describe('channelToObservable', () => {
            it('should be a function', () =>
                expect(channelToObservable).toBeInstanceOf(Function));

            it('with values in the channel and closing afterwards it should produce the values and complete', done => {
                const ch = chan();
                testObs(channelToObservable(ch), [1, 2, 3, 4, 5], null, done);
                go(function*() {
                    for (let i = 0; i < 5; i++) {
                        yield put(ch, i + 1);
                    }
                    ch.close();
                });
            });

            it('with values in the channel and leaving it open it should produce the values and TIMEOUT', done => {
                const ch = chan();
                testObs(
                    channelToObservable(ch),
                    [1, 2, 3, 4, 5, 'TIMEOUT'],
                    null,
                    done,
                    { doneTimeout: 100 }
                );
                go(function*() {
                    for (let i = 0; i < 5; i++) {
                        yield put(ch, i + 1);
                    }
                });
            });
        });

        describe('iterableToChan', () => {
            it('should be a function', () =>
                expect(iterableToChan).toBeInstanceOf(Function));

            it('with many values it should produce the values in the channel', done => {
                const it = [10, 20, 30];
                const ch = iterableToChan(it);
                testObs(channelToObservable(ch), [10, 20, 30], null, done);
            });

            it('when keepOpen it should not close the channel', done => {
                const it = [10, 20, 30];
                const ch = iterableToChan(it, { keepOpen: true });
                testObs(channelToObservable(ch), [10, 20, 30, 'TIMEOUT'], null, done);
            });

            it('with a real iterator it should produce the values in the channel', done => {
                const it = {};
                it[Symbol.iterator] = function* () {
                    yield 10;
                    yield 20;
                    yield 30;
                };
                const ch = iterableToChan(it);
                testObs(channelToObservable(ch), [10, 20, 30], null, done);
            });

            it('with a failing iterator it should produce the values in the channel', done => {
                const it = {};
                it[Symbol.iterator] = function* () {
                    yield 10;
                    yield 20;
                    throw new Error('unexpected');
                };
                const ch = iterableToChan(it);
                testObs(channelToObservable(ch), [10, 20, new Error('unexpected')], null, done);
            });

            it('with a failing iterator and not including errors it should produce the values in the channel', done => {
                const it = {};
                it[Symbol.iterator] = function* () {
                    yield 10;
                    yield 20;
                    throw new Error('unexpected');
                };
                const ch = iterableToChan(it, { includeErrors: false });
                testObs(channelToObservable(ch), [10, 20], null, done);
            });

            it('with a non iterator it should produce no values in the channel', done => {
                const it = {};
                const ch = iterableToChan(it);
                testObs(channelToObservable(ch), [new TypeError('iterable[_rxjs.Symbol.iterator] is not a function')], null, done);
            });
        });

        describe('generatorToChan', () => {
            it('should be a function', () =>
                expect(generatorToChan).toBeInstanceOf(Function));

            it('with a real generator it should produce the values in the channel', done => {
                const gen = function* () {
                    yield 10;
                    yield 20;
                    yield 30;
                };
                const ch = generatorToChan(gen());
                testObs(channelToObservable(ch), [10, 20, 30], null, done);
            });

            it('with keepOpen it should produce the values and leave the channel open', done => {
                const gen = function* () {
                    yield 10;
                    yield 20;
                    yield 30;
                };
                const ch = generatorToChan(gen(), { keepOpen: true });
                testObs(channelToObservable(ch), [10, 20, 30, 'TIMEOUT'], null, done);
            });

            it('with a failing generator it should produce the values in the channel', done => {
                const gen = function* () {
                    yield 10;
                    yield 20;
                    throw new Error('unexpected');
                };
                const ch = generatorToChan(gen());
                testObs(channelToObservable(ch), [10, 20, new Error('unexpected')], null, done);
            });

            it('with a failing generator and not including errors it should produce the values in the channel', done => {
                const gen = function* () {
                    yield 10;
                    yield 20;
                    throw new Error('unexpected');
                };
                const ch = generatorToChan(gen(), { includeErrors: false });
                testObs(channelToObservable(ch), [10, 20], null, done);
            });

            it('with a non generator it should produce no values in the channel', done => {
                const gen = {};
                const ch = generatorToChan(gen);
                testObs(channelToObservable(ch), [new TypeError('gen.next is not a function')], null, done);
            });
        });

        describe('promiseToChan', () => {
            it('should be a function', () =>
                expect(promiseToChan).toBeInstanceOf(Function));

            it('with a resolving promise it should produce the value in the channel', done => {
                const prom = Observable.timer(10).switchMap(() => Observable.of(10)).toPromise();
                const ch = promiseToChan(prom);
                testObs(channelToObservable(ch), [10], null, done);
            });

            it('with a resolving promise and keepOpen it should produce the value and leave the channel open', done => {
                const prom = Observable.timer(10).switchMap(() => Observable.of(10)).toPromise();
                const ch = promiseToChan(prom, { keepOpen: true });
                testObs(channelToObservable(ch), [10, 'TIMEOUT'], null, done);
            });

            it('with a rejecting promise it should produce the error in the channel', done => {
                const prom = Observable.timer(10).switchMap(() => Observable.throw(new Error('unexpected'))).toPromise();
                const ch = promiseToChan(prom);
                testObs(channelToObservable(ch), [new Error('unexpected')], null, done);
            });

            it('with a rejecting promise and no include errors it should produce an empty channel', done => {
                const prom = Observable.timer(10).switchMap(() => Observable.throw(new Error('unexpected'))).toPromise();
                const ch = promiseToChan(prom, { includeErrors: false });
                testObs(channelToObservable(ch), [], null, done);
            });

            it('with a non-promise it should produce the error in the channel', done => {
                const prom = {};
                const ch = promiseToChan(<any>prom);
                testObs(channelToObservable(ch), [new TypeError('promise.then is not a function')], null, done);
            });
        });

        describe('firstToChan', () => {
            it('should be a function', () =>
                expect(firstToChan).toBeInstanceOf(Function));

            it('with one value observable it should produce the value in the channel', done => {
                const obs = Observable.timer(10).map(() => 42);
                const ch = firstToChan(obs);
                testObs(channelToObservable(ch), [42], null, done);
            });

            it('with many value observable it should produce the first value in the channel', done => {
                const obs = Observable.timer(10, 1).take(5).map(v => v + 10);
                const ch = firstToChan(obs);
                testObs(channelToObservable(ch), [10], null, done);
            });

            it('with a failing observable it should produce the error in the channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.throw(new Error('test'))
                );
                const ch = firstToChan(obs);
                testObs(
                    channelToObservable(ch),
                    [new Error('test')],
                    null,
                    done
                );
            });

            it('with an empty observable it should produce a CLOSED channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.empty()
                );
                const ch = firstToChan(obs);
                testObs(channelToObservable(ch), [], null, done);
            });

            it('with an uncompleted observable it should produce the value and leave the channel open', done => {
                const obs = Observable.timer(10).map(() => 42);
                const ch = firstToChan(obs, { keepOpen: true });
                testObs(channelToObservable(ch), [42, 'TIMEOUT'], null, done, {
                    doneTimeout: 100
                });
            });
        });

        describe('observableToChannel', () => {
            it('should be a function', () =>
                expect(observableToChan).toBeInstanceOf(Function));

            it('with one value observable it should produce the value in the channel', done => {
                const obs = Observable.timer(10).map(() => 42);
                const ch = observableToChan(obs);
                testObs(channelToObservable(ch), [42], null, done);
            });

            it('with many value observable it should produce the first value in the channel', done => {
                const obs = Observable.timer(10, 1).take(5).map(v => v + 10);
                const ch = observableToChan(obs);
                testObs(
                    channelToObservable(ch),
                    [10, 11, 12, 13, 14],
                    null,
                    done
                );
            });

            it('with a failing observable it should produce the error in the channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.throw(new Error('test'))
                );
                const ch = observableToChan(obs);
                testObs(
                    channelToObservable(ch),
                    [new Error('test')],
                    null,
                    done
                );
            });

            it('with an empty observable it should produce a CLOSED channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.empty()
                );
                const ch = observableToChan(obs);
                testObs(channelToObservable(ch), [], null, done);
            });

            it('with an uncompleted observable it should produce the value and leave the channel open', done => {
                const obs = Observable.timer(10).map(() => 42);
                const ch = observableToChan(obs, { keepOpen: true });
                testObs(
                    channelToObservable(ch),
                    [42, 'TIMEOUT'],
                    null,
                    done,
                    { doneTimeout: 100 }
                );
            });
        });

        describe('startPinging', () => {
            it('should be a function', () =>
                expect(startPinging).toBeInstanceOf(Function));

            it('When a ping starts it should send pings every given time', done => {
                const pingCh = chan();
                const onPing = jasmine.createSpy('onPing');
                const pinger = startPinging(pingCh, 5);
                // consume pings
                go(function*() {
                    for (let i = 0; i < 15; i++) {
                        const v = yield alts([pinger.finishedProm, pingCh]);
                        if (v.channel !== pingCh || v.value === CLOSED) {
                            break;
                        } else {
                            expect(v).not.toBeFalsy();
                            onPing(v);
                        }
                    }
                    expect(onPing.calls.count()).toBeGreaterThanOrEqual(1);
                    expect(onPing.calls.count()).toBeLessThanOrEqual(12);
                    expect(pinger.finishedProm.isClosed()).toBeTruthy();
                    done();
                });
                // wait 50ms to finish the ping
                go(function*() {
                    yield timeout(50);
                    yield pinger.release();
                });
            });
        });

        describe('startLeasing', () => {
            it('should be a function', () =>
                expect(startLeasing).toBeInstanceOf(Function));

            it('with a lease that returns false it should produce a lost lease', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => chanWithOne(false));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => chanWithOne(true));
                const res = startLeasing(leaseFn, releaseFn);
                go(function*() {
                    const started = yield res.startedProm;
                    expect(started).toEqual(false);
                    expect(leaseFn).toHaveBeenCalledTimes(1);
                    expect(releaseFn).not.toHaveBeenCalled();
                    done();
                });
            });

            it('with a lease that succeed and no ping it should produce a valid lease that times out', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => chanWithOne(true));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => chanWithOne(true));
                const res = startLeasing(leaseFn, releaseFn, {
                    leaseTimeoutSecs: 0.05,
                    leaseMarginSecs: 0.01,
                    logToConsole: false
                });
                go(function*() {
                    const started = yield res.startedProm;
                    expect(started).toEqual(true);
                    yield timeout(0.1 * 1000);
                    expect(leaseFn).toHaveBeenCalledWith(0.05);
                    expect(leaseFn).toHaveBeenCalledTimes(1);
                    expect(releaseFn).toHaveBeenCalled();
                    done();
                });
            });

            it('with a lease that succeed and various pings it should produce a valid lease that times out', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => chanWithOne(true));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => chanWithOne(true));
                const lease = startLeasing(leaseFn, releaseFn, {
                    leaseTimeoutSecs: 0.05,
                    leaseMarginSecs: 0.01,
                    logToConsole:
                        false && (() => `LEAS [${new Date().toISOString()}]: `)
                });
                const pinger = startPinging(lease.pingCh, 20, {
                    logToConsole:
                        false && (() => `PING [${new Date().toISOString()}]: `)
                });
                go(function*() {
                    const started = yield take(lease.startedProm);
                    expect(started).toEqual(true);
                    expect(leaseFn).toHaveBeenCalledWith(0.05);
                    expect(leaseFn).toHaveBeenCalledTimes(1);
                    yield timeout(300);
                    yield pinger.release();
                    yield timeout(100);
                    expect(leaseFn.calls.count()).toBeGreaterThanOrEqual(1);
                    expect(leaseFn.calls.count()).toBeLessThanOrEqual(10);
                    expect(releaseFn).toHaveBeenCalled();
                    done();
                });
            });
        });

        describe('PipelineSequenceTarget & Co.', () => {
            const dict = new Map<string, string>()
                .set('urls', 'URL PROCESSOR')
                .set('json', 'JSON PROCESSOR')
                .set('db', 'DATABASE PROCESSOR');

            const arr = [
                'URL PROCESSOR',
                'JSON PROCESSOR',
                'DATABASE PROCESSOR'
            ];

            describe('PipelineSequenceTarget', () => {
                it('should be a function', () =>
                    expect(PipelineSequenceTarget).toBeInstanceOf(Function));

                it('when created with just a value it should work properly', () => {
                    const target = PipelineSequenceTarget.fromValue(5);
                    expect(target).toBeInstanceOf(PipelineSequenceTarget);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(0);
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'JSON PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'DATABASE PROCESSOR'
                    );
                });

                it('when created with target name it should work properly', () => {
                    const target = new PipelineSequenceTarget(5, {
                        name: 'urls'
                    });
                    expect(target.value).toEqual(5);
                    expect(target.name).toEqual('urls');
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toBeUndefined();
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'URL PROCESSOR'
                    );
                });

                it('when created with target index it should work properly', () => {
                    const target = new PipelineSequenceTarget(5, { index: 0 });
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toEqual(0);
                    expect(target.offset).toBeUndefined();
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'URL PROCESSOR'
                    );
                });

                it('when created with target offset it should work properly', () => {
                    const target = new PipelineSequenceTarget(5, {
                        offset: -1
                    });
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(-1);
                    expect(() =>
                        target.select<string>(dict, arr, 0)
                    ).toThrowError();
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'JSON PROCESSOR'
                    );
                });
            });

            describe('toNamedTarget', () => {
                it('should be a function', () =>
                    expect(toNamedTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toNamedTarget(5, 'urls');
                    expect(target.value).toEqual(5);
                    expect(target.name).toEqual('urls');
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toBeUndefined();
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'URL PROCESSOR'
                    );
                });
            });

            describe('toIndexedTarget', () => {
                it('should be a function', () =>
                    expect(toIndexedTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toIndexedTarget(5, 1);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toEqual(1);
                    expect(target.offset).toBeUndefined();
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'JSON PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'JSON PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'JSON PROCESSOR'
                    );
                });
            });

            describe('toOffsetTarget', () => {
                it('should be a function', () =>
                    expect(toOffsetTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toOffsetTarget(5, 2);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(2);
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'DATABASE PROCESSOR'
                    );
                    expect(() =>
                        target.select<string>(dict, arr, 1)
                    ).toThrowError();
                    expect(() =>
                        target.select<string>(dict, arr, 2)
                    ).toThrowError();
                });
            });

            describe('toCurrentTarget', () => {
                it('should be a function', () =>
                    expect(toCurrentTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toCurrentTarget(5);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(0);
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'JSON PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'DATABASE PROCESSOR'
                    );
                });
            });

            describe('toNextTarget', () => {
                it('should be a function', () =>
                    expect(toNextTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toNextTarget(5);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(1);
                    expect(target.select<string>(dict, arr, 0)).toEqual(
                        'JSON PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'DATABASE PROCESSOR'
                    );
                    expect(() =>
                        target.select<string>(dict, arr, 2)
                    ).toThrowError();
                });
            });

            describe('toPreviousTarget', () => {
                it('should be a function', () =>
                    expect(toPreviousTarget).toBeInstanceOf(Function));

                it('it should work properly', () => {
                    const target = toPreviousTarget(5);
                    expect(target.value).toEqual(5);
                    expect(target.name).toBeUndefined();
                    expect(target.index).toBeUndefined();
                    expect(target.offset).toEqual(-1);
                    expect(() =>
                        target.select<string>(dict, arr, 0)
                    ).toThrowError();
                    expect(target.select<string>(dict, arr, 1)).toEqual(
                        'URL PROCESSOR'
                    );
                    expect(target.select<string>(dict, arr, 2)).toEqual(
                        'JSON PROCESSOR'
                    );
                });
            });
        });

        describe('runPipelineNode', () => {
            it('should be a function', () =>
                expect(runPipelineNode).toBeInstanceOf(Function));

            it('it should work as expected', done => {
                const outputCh = chan();
                const node = runPipelineNode({
                    process: (value: any) => put(outputCh, value),
                    initialValues: [0, 1, 2, 3, 4],
                    logToConsole: false && 'PIPE NODE: '
                });
                testObs(
                    channelToObservable(outputCh),
                    [0, 1, 2, 3, 4],
                    null,
                    done,
                    { logActualValues: false, doneTimeout: 100 }
                );
                go(function*() {
                    yield timeout(50);
                    yield node.release();
                    outputCh.close();
                });
            });
        });

        describe('runPipelineSequence', () => {
            it('should be a function', () =>
                expect(runPipelineSequence).toBeInstanceOf(Function));

            fit('it should work as expected', done => {
                const outputCh = chan();
                const pipe = runPipelineSequence({
                    nodes: [{
                        name: 'first',
                        process: x => x + 1,
                        initialValues: [0, 1, 2, 3, 4],
                        logToConsole: true && 'PIPE NODE [first] ',
                    }, {
                        name: 'second',
                        process: x => x * 10,
                        logToConsole: false && 'PIPE NODE [second] ',
                    }, {
                        name: 'third',
                        process: x => x - 10,
                        logToConsole: false && 'PIPE NODE [third] ',
                    }, ],
                    processLast: v => put(outputCh, v),
                    logToConsole: true && 'PIPE: '
                });
                testObs(
                    channelToObservable(outputCh),
                    [0, 1, 2, 3, 4],
                    null,
                    done,
                    { logActualValues: false, doneTimeout: 100 }
                );
                go(function*() {
                    yield timeout(50);
                    yield pipe.release();
                    outputCh.close();
                });
            });
        });
    });
});
