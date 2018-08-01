import { merge, timer, of } from 'rxjs';
import {
    TaskItem,
    task,
    fromServiceToDirectProcessor,
    startDirectProcessor,
    TransientError,
} from '../../src/processes';
import { testObs, testTaskOf } from '../utils/rxtest';
import { switchMap, skip, concat } from 'rxjs/operators';

describe('Processes', () => {
    describe('Direct Processor', () => {
        describe('startDirectProcessor', () => {
            it('should be a function', () =>
                expect(startDirectProcessor).toBeInstanceOf(Function));

            describe('When a direct processor is started with well behaved task', () => {
                const runner = (item: TaskItem) => testTaskOf(5)(1, 2, 3)();
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
                    testTaskOf(5)(1, 2, 3, new TransientError('transient'))();
                const proc = startDirectProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => d,
                });

                it('it should process task returning the bad behaved result after retrying 3 times', done =>
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3, 1, 2, 3, 1, 2, 3],
                        new TransientError('transient'),
                        done
                    ));
            });

            describe('When a direct processor is started with temporary error', () => {
                let errorCount = 0;
                const failing = (i, p) =>
                    testTaskOf(5)(1, 2, 3, new TransientError('temporary'))();
                const succeeding = (i, p) => testTaskOf(5)(1, 2, 3, 4)();
                const runner = (item: TaskItem) => {
                    if (++errorCount <= 2) {
                        return failing(errorCount - 1, item.payload);
                    } else {
                        return succeeding(errorCount - 1, item.payload);
                    }
                };
                const proc = startDirectProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d,
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
                    taskA: testTaskOf(5)(42),
                    taskB: testTaskOf(15)(60),
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
                        [60],
                        null,
                        done
                    ));

                it('calling taskA and taskB should run them simultaneously', done =>
                    testObs(
                        merge(
                            timer(10).pipe(() =>
                                processor.process(task('taskB', 50))
                            ),
                            timer(1).pipe(() =>
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
                        timer(5).pipe(
                            skip(1),
                            concat(of('A'))
                        ),
                    taskB: (p: number) =>
                        timer(p).pipe(
                            skip(1),
                            concat(of('B' + p))
                        ),
                };
                const processor = fromServiceToDirectProcessor(service);

                it('calling a task after processor.finish should prevent it from running', done => {
                    testObs(
                        merge(
                            timer(10).pipe(
                                switchMap(() =>
                                    processor.process(task('taskB', 30))
                                )
                            ),
                            timer(0).pipe(
                                switchMap(() =>
                                    processor.process(task('taskA'))
                                )
                            ),
                            timer(50).pipe(
                                switchMap(() =>
                                    processor.process(task('taskB', 20))
                                )
                            )
                        ),
                        ['A', 'B30'],
                        new Error('worker:finishing'),
                        done
                    );
                    timer(35)
                        .pipe(switchMap(() => processor.finish()))
                        .subscribe();
                });
            });
        });
    });
});
