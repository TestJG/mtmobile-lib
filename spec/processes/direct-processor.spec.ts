import { Observable } from 'rxjs';
import {
    IProcessorCore,
    TaskItem,
    task
} from '../../src/processes/processor.interfaces';
import {
    fromServiceToDirectProcessor,
    startDirectProcessor
} from '../../src/processes/direct-processor';
import { testObs } from '../utils/rxtest';

describe('Processes', () => {
    describe('Direct Processor', () => {
        describe('startDirectProcessor', () => {
            it('should be a function', () =>
                expect(startDirectProcessor).toBeInstanceOf(Function));

            describe('When a direct processor is started with well behaved task', () => {
                const runner = (item: TaskItem) =>
                    Observable.timer(5)
                        .skip(1)
                        .concat(Observable.of(1, 2, 3));
                const proc = startDirectProcessor(runner);

                it('it should process task returning the well behaved result', done =>
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3],
                        null,
                        done
                    ));
            });

            describe('When a direct processor is started with bad behaved task', () => {
                const runner = (item: TaskItem) =>
                    Observable.timer(5)
                        .skip(1)
                        .concat(Observable.of(1, 2, 3))
                        .concat(Observable.throw(new Error('permanent')));
                const proc = startDirectProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => d
                });

                it('it should process task returning the bad behaved result after retrying 3 times', done =>
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3, 1, 2, 3, 1, 2, 3],
                        new Error('permanent'),
                        done
                    ));
            });

            describe('When a direct processor is started with temporary error', () => {
                let errorCount = 0;
                const runner = (item: TaskItem) =>
                    Observable.timer(5)
                        .skip(1)
                        .concat(
                            ++errorCount <= 2
                                ? Observable.of(1, 2, 3).concat(
                                      Observable.throw(new Error('temporary'))
                                  )
                                : Observable.of(1, 2, 3, 4)
                        );
                const proc = startDirectProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d
                });

                it('it should process task returning the well behaved result after the error is resolved', done =>
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3, 1, 2, 3, 1, 2, 3, 4],
                        null,
                        done
                    ));
            });
        });

        describe('fromServiceToDirectProcessor', () => {
            it('should be a function', () =>
                expect(fromServiceToDirectProcessor).toBeInstanceOf(Function));

            describe('When a simple service is given', () => {
                const service = {
                    taskA: () =>
                        Observable.timer(5)
                            .skip(1)
                            .concat(Observable.of(42)),
                    taskB: (p: number) =>
                        Observable.timer(p).concatMap(() =>
                            Observable.of(p + 10)
                        )
                };
                const processor = fromServiceToDirectProcessor(service);

                it('should not be undefined', () =>
                    expect(processor).not.toBeUndefined());

                it("calling taskA should return the same results as service's taskA", done =>
                    testObs(
                        processor.process(task('taskA')),
                        [42],
                        null,
                        done
                    ));

                it("calling taskB with payload should return the same results as service's taskB", done =>
                    testObs(
                        processor.process(task('taskB', 23)),
                        [33],
                        null,
                        done
                    ));

                it('calling taskA and taskB should run them simultaneously', done =>
                    testObs(
                        Observable.merge(
                            Observable.timer(10).switchMap(() =>
                                processor.process(task('taskB', 50))
                            ),
                            Observable.timer(1).switchMap(() =>
                                processor.process(task('taskA'))
                            )
                        ),
                        [42, 60],
                        null,
                        done
                    ));
            });

            describe('When a simple service is given and the processor is finished', () => {
                const service = {
                    taskA: () =>
                        Observable.timer(5)
                            .skip(1)
                            .concat(Observable.of(42)),
                    taskB: (p: number) =>
                        Observable.timer(p)
                            .skip(1)
                            .concat(Observable.of(p + 10))
                };
                const processor = fromServiceToDirectProcessor(service);

                it('calling a task after processor.finish should prevent it from running', done => {
                    testObs(
                        Observable.merge(
                            Observable.timer(5).switchMap(() =>
                                processor.process(task('taskB', 15))
                            ),
                            Observable.timer(1).switchMap(() =>
                                processor.process(task('taskA'))
                            ),
                            Observable.timer(25).switchMap(() =>
                                processor.process(task('taskB', 12))
                            )
                        ),
                        [42, 25],
                        new Error('worker:finishing'),
                        done
                    );
                    Observable.timer(20)
                        .switchMap(() => processor.finish())
                        .subscribe();
                });
            });
        });
    });
});
