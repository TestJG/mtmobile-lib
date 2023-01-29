import {
    TaskItem,
    task,
    makeRunTask,
    startSequentialProcessor,
    TransientError,
} from '../../src/processes';
import { testObs } from '../utils/rxtest';
import { timer, of, throwError, merge } from 'rxjs';
import { skip, concat, map, switchMap, take, flatMap } from 'rxjs/operators';

describe('Processes', () => {
    describe('Sequential Processor', () => {
        describe('startSequentialProcessor', () => {
            it('should be a function', () =>
                expect(startSequentialProcessor).toBeInstanceOf(Function));

            describe('When a sequential processor is started with well behaved task', () => {
                const runner = (item: TaskItem) =>
                    timer(5).pipe(
                        skip(1),
                        concat(of(1, 2, 3))
                    );
                const proc = startSequentialProcessor(runner);

                it('it should process task returning the well behaved result', done => {
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3],
                        null,
                        done
                    );
                });
            });

            describe('When a sequential processor is started with bad behaved task', () => {
                const runner = (item: TaskItem) =>
                    timer(5).pipe(
                        skip(1),
                        concat(of(1, 2, 3)),
                        concat(throwError(new TransientError('transient')))
                    );
                const proc = startSequentialProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => d,
                });

                it('it should process task returning the bad behaved result after retrying 3 times', done => {
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3, 1, 2, 3, 1, 2, 3],
                        new TransientError('transient'),
                        done
                    );
                });
            });

            describe('When a sequential processor is started with temporary error', () => {
                let errorCount = 0;
                const runner = (item: TaskItem) =>
                    timer(5).pipe(
                        skip(1),
                        concat(
                            ++errorCount <= 2
                                ? of(1, 2, 3).pipe(
                                      concat(
                                          throwError(
                                              new TransientError('temporary')
                                          )
                                      )
                                  )
                                : of(1, 2, 3, 4)
                        )
                    );
                const proc = startSequentialProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d,
                });

                it('it should process task returning the well behaved result after the error is resolved', done => {
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3, 1, 2, 3, 1, 2, 3, 4],
                        null,
                        done
                    );
                });
            });

            describe('Given a simple sequential processor', () => {
                const runner = (item: TaskItem) =>
                    timer(item.payload).pipe(map(() => item.payload));
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d,
                });

                it('calling taskA and taskB should run them sequentially', done => {
                    testObs(
                        merge(
                            timer(10).pipe(
                                switchMap(() =>
                                    processor.process(task('task1', 10))
                                )
                            ),
                            timer(5).pipe(
                                switchMap(() =>
                                    processor.process(task('task2', 30))
                                )
                            )
                        ),
                        [30, 10],
                        null,
                        done
                    );
                });
            });

            describe('Given a simple sequential processor with a bad behaved task', () => {
                const runner = makeRunTask({
                    taskA: (item: TaskItem) =>
                        timer(item.payload).pipe(
                            switchMap(() =>
                                timer(0, 5).pipe(
                                    take(3),
                                    map(v => 100 * (v + 1))
                                )
                            )
                        ),
                    taskB: (item: TaskItem) =>
                        timer(item.payload).pipe(
                            switchMap(() =>
                                timer(0, 5).pipe(
                                    take(2),
                                    map(v => 10 * (v + 1))
                                )
                            ),
                            concat(throwError(new TransientError('transient')))
                        ),
                });
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => 2 * d,
                    logToConsole: false,
                });

                it('it should reschedule the failing task 3 times', done => {
                    testObs(
                        timer(10, 10).pipe(
                            take(2),
                            flatMap(i => {
                                if (i === 0) {
                                    return processor.process(task('taskB', 30));
                                } else {
                                    return processor.process(task('taskA', 10));
                                }
                            })
                        ),
                        [10, 20, 100, 200, 300, 10, 20, 10, 20],
                        new TransientError('transient'),
                        done
                    );
                });
            });
        });
    });
});
