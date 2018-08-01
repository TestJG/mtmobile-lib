import { Observable, Observer } from 'rxjs';
import { testObs } from '../utils/rxtest';
import { TaskItem, makeRunTask } from '../../src/processes';

describe('Processes', () => {
    describe('makeRunTask', () => {
        it('should be a function', () =>
            expect(makeRunTask).toBeInstanceOf(Function));

        describe('When makeRunTask is called with an empty runners map', () => {
            const runner = makeRunTask({});

            it('calling it with null taskItem should return an observable error', done =>
                testObs(
                    runner(null),
                    [],
                    new Error('argument.null.task'),
                    done
                ));

            it('calling it with a taskItem without kind should return an observable error', done =>
                testObs(
                    runner({ kind: '', payload: 42 }),
                    [],
                    new Error('argument.null.task.kind'),
                    done
                ));

            it('calling it with non-existing kind should return an observable error', done =>
                testObs(
                    runner({ kind: 'answer', payload: 42 }),
                    [],
                    new Error('unknown.task:answer'),
                    done
                ));
        });

        describe('When makeRunTask is called with an some runners map', () => {
            const runner = makeRunTask({
                taskValue: (payload: number) => payload + 10,
                taskThrow: (payload: number) => {
                    throw new Error('error');
                },
                taskPromise: (payload: number) =>
                    new Promise<number>((r, _) =>
                        setTimeout(() => r(payload + 20), 10)
                    ),
                taskPromiseReject: (payload: number) =>
                    new Promise<number>((_, r) =>
                        setTimeout(() => r(new Error('error')), 10)
                    ),
                taskObs: (payload: number) =>
                    Observable.create((obs: Observer<number>) => {
                        setTimeout(() => {
                            obs.next(payload + 30);
                            obs.complete();
                        }, 10);
                    }),
                taskObsError: (payload: number) =>
                    Observable.create((obs: Observer<number>) => {
                        setTimeout(() => {
                            obs.error(new Error('error'));
                        }, 10);
                    }),
            });

            it('calling it with null taskItem should return an observable error', done =>
                testObs(
                    runner(null),
                    [],
                    new Error('argument.null.task'),
                    done
                ));

            it('calling it with a taskItem without kind should return an observable error', done =>
                testObs(
                    runner({ kind: '', payload: 42 }),
                    [],
                    new Error('argument.null.task.kind'),
                    done
                ));

            it('calling it with non-existing kind should return an observable error', done =>
                testObs(
                    runner({ kind: 'answer', payload: 42 }),
                    [],
                    new Error('unknown.task:answer'),
                    done
                ));

            it('calling it with sync value should return an observable with given value', done =>
                testObs(
                    runner({ kind: 'taskValue', payload: 42 }),
                    [52],
                    null,
                    done
                ));

            it('calling it with throwing function should return an observable with given error', done =>
                testObs(
                    runner({ kind: 'taskThrow', payload: 42 }),
                    [],
                    new Error('error'),
                    done
                ));

            it('calling it with promise value should return an observable with given value', done =>
                testObs(
                    runner({ kind: 'taskPromise', payload: 42 }),
                    [62],
                    null,
                    done
                ));

            it('calling it with rejecting promise function should return an observable with given error', done =>
                testObs(
                    runner({ kind: 'taskPromiseReject', payload: 42 }),
                    [],
                    new Error('error'),
                    done
                ));

            it('calling it with observable value should return an observable with given value', done =>
                testObs(
                    runner({ kind: 'taskObs', payload: 42 }),
                    [72],
                    null,
                    done
                ));

            it('calling it with failing observable function should return an observable with given error', done =>
                testObs(
                    runner({ kind: 'taskObsError', payload: 42 }),
                    [],
                    new Error('error'),
                    done
                ));
        });
    });
});
