import { Observable, Observer } from 'rxjs';
const {
    chan,
    go,
    spawn,
    timeout,
    alts,
    put,
    take,
    putAsync,
    CLOSED
} = require('js-csp');
import { firstToChannel, startLeasing } from '../../src/utils/csp';
import { release } from 'os';

describe('Utils', () => {
    describe('CSP Tests', () => {
        describe('firstToChannel', () => {
            it('should be a function', () =>
                expect(firstToChannel).toBeInstanceOf(Function));

            it('with one value observable it should produce the value in the channel', done => {
                const obs = Observable.timer(10).map(() => 42);
                const ch = firstToChannel(obs);
                go(function*() {
                    const result = yield take(ch);
                    expect(result).toEqual({ value: 42 });
                    done();
                });
            });

            it('with many value observable it should produce the first value in the channel', done => {
                const obs = Observable.timer(10, 1).take(5).map(v => v + 10);
                const ch = firstToChannel(obs);
                go(function*() {
                    const result = yield take(ch);
                    expect(result).toEqual({ value: 10 });
                    done();
                });
            });

            it('with a failing observable it should produce the error in the channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.throw(new Error('test'))
                );
                const ch = firstToChannel(obs);
                go(function*() {
                    const result = yield take(ch);
                    expect(result).toEqual({ error: new Error('test') });
                    done();
                });
            });

            it('with an empty observable it should produce a CLOSED channel', done => {
                const obs = Observable.timer(10).switchMap(() =>
                    Observable.empty()
                );
                const ch = firstToChannel(obs);
                go(function*() {
                    const result = yield take(ch);
                    expect(result).toBe(CLOSED);
                    done();
                });
            });
        });

        describe('startLeasing', () => {
            it('should be a function', () =>
                expect(startLeasing).toBeInstanceOf(Function));

            it('with a lease that returns false it should produce a lost lease', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => Observable.timer(5).map(() => false));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => Observable.of(<void>null));
                const res = startLeasing(leaseFn, releaseFn);
                go(function*() {
                    const lease1 = yield take(res.leaseCh);
                    expect(lease1).toEqual(false);
                    expect(leaseFn).toHaveBeenCalledTimes(1);
                    expect(releaseFn).toHaveBeenCalled();
                    done();
                });
            });

            it('with a lease that fails it should produce a lost lease', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => Observable.throw(new Error()));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => Observable.of(<void>null));
                const res = startLeasing(leaseFn, releaseFn, {
                    timeoutSecs: 0.04,
                    leaseMarginSecs: 0.01
                });
                go(function*() {
                    const lease1 = yield take(res.leaseCh);
                    expect(lease1).toEqual(false);
                    expect(leaseFn).toHaveBeenCalled();
                    expect(releaseFn).toHaveBeenCalled();
                    done();
                });
            });

            it('with a lease that succeed and no ping it should produce a valid lease that times out', done => {
                const leaseFn = jasmine
                    .createSpy('leaseFn')
                    .and.callFake(t => Observable.of(true));
                const releaseFn = jasmine
                    .createSpy('releaseFn')
                    .and.callFake(() => Observable.of(<void>null));
                const res = startLeasing(leaseFn, releaseFn, {
                    timeoutSecs: 0.04,
                    leaseMarginSecs: 0.01
                });
                go(function*() {
                    const lease1 = yield take(res.leaseCh);
                    expect(lease1).toEqual(true);
                    yield take(timeout(0.15 * 1000));
                    expect(leaseFn).toHaveBeenCalledWith(0.05);
                    expect(leaseFn).toHaveBeenCalledTimes(1);
                    expect(releaseFn).toHaveBeenCalled();
                    done();
                });
            });

            // fit('with a lease that succeed and two pings it should produce a valid lease that times out', done => {
            //     // console.log('IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII');
            //     const leaseFn = jasmine
            //         .createSpy('leaseFn')
            //         .and.callFake(t => Observable.of(true));
            //     const releaseFn = jasmine
            //         .createSpy('releaseFn')
            //         .and.callFake(() => Observable.of(<void>null));
            //     const res = startLeasing(leaseFn, releaseFn, { timeoutSecs: 0.04, leaseMarginSecs: 0.01 });
            //     go(function*() {
            //         const lease1 = yield take(res.leaseCh);
            //         expect(leaseFn).toHaveBeenCalledWith(0.05);
            //         expect(leaseFn).toHaveBeenCalledTimes(1);
            //         expect(lease1).toEqual(true);
            //         for (let i = 0; i < 5; i++) {
            //             // console.log('PINGING #' + i);
            //             yield take(timeout(0.02 * 1000));
            //             yield put(res.pingCh, true);
            //         }
            //         yield take(timeout((0.250 - 0.01 * 5) * 1000));
            //         expect(leaseFn).toHaveBeenCalledTimes(4);
            //         expect(releaseFn).toHaveBeenCalled();
            //         // console.log('OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO');
            //         done();
            //     });
            // });
        });
    });
});
