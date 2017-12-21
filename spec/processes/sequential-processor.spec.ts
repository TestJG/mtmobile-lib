import { Observable } from 'rxjs';
import {
    IProcessorCore,
    TaskItem,
    task
} from '../../src/processes/processor.interfaces';
import { startSequentialProcessor } from '../../src/processes/sequential-processor';
import { testObs } from '../utils/rxtest';
import { rxdelay, rxdelayof } from '../../src/utils';
import { makeRunTask } from '../../src/processes/makeRunTask';

describe('Processes', () => {
    describe('Processor Interfaces', () => {
        describe('startSequentialProcessor', () => {
            it('should be a function', () =>
                expect(startSequentialProcessor).toBeInstanceOf(Function));

            describe('When a sequential processor is started with well behaved task', () => {
                const runner = (item: TaskItem) =>
                    rxdelay(5).concat(Observable.of(1, 2, 3));
                const proc = startSequentialProcessor(runner);

                it('it should process task returning the well behaved result', done =>
                    testObs(
                        proc.process(task('taskA')),
                        [1, 2, 3],
                        null,
                        done
                    ));
            });

            describe('When a sequential processor is started with bad behaved task', () => {
                const runner = (item: TaskItem) =>
                    rxdelay(5)
                        .concat(Observable.of(1, 2, 3))
                        .concat(Observable.throw(new Error('permanent')));
                const proc = startSequentialProcessor(runner, {
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

            describe('When a sequential processor is started with temporary error', () => {
                let errorCount = 0;
                const runner = (item: TaskItem) =>
                    rxdelay(5).concat(
                        ++errorCount <= 2
                            ? Observable.of(1, 2, 3).concat(
                                  Observable.throw(new Error('temporary'))
                              )
                            : Observable.of(1, 2, 3, 4)
                    );
                const proc = startSequentialProcessor(runner, {
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

            describe('Given a simple sequential processor', () => {
                const runner = (item: TaskItem) =>
                    rxdelayof(item.payload, item.payload);
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d
                });

                it('calling taskA and taskB should run them sequentially', done =>
                    testObs(
                        Observable.merge(
                            rxdelayof(10, null).switchMap(() =>
                                processor.process(task('task1', 10))
                            ),
                            rxdelayof(5, null).switchMap(() =>
                                processor.process(task('task2', 30))
                            )
                        ),
                        [30, 10],
                        null,
                        done
                    ));
            });

            fdescribe('Given a simple sequential processor with a bad behaved task', () => {
                const runner = makeRunTask({
                    taskA: (item: TaskItem) =>
                        rxdelayof(item.payload, item.payload),
                    taskB: (item: TaskItem) =>
                        rxdelayof(item.payload, 1).switchMap(() =>
                            Observable.of(item.payload).concat(
                                Observable.throw(new Error('permanent'))
                            )
                        )
                });
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => d
                });

                it('it should reschedule the failing task 3 times', done =>
                    testObs(
                        Observable.merge(
                            rxdelayof(10, null).switchMap(() =>
                                processor.process(task('taskA', 10))
                            ),
                            rxdelayof(5, null).switchMap(() =>
                                processor.process(task('taskB', 30))
                            )
                        ),
                        [30, 10, 30, 30],
                        null,
                        done, { logActualValues: true }
                    ));
            });
        });
    });
});
