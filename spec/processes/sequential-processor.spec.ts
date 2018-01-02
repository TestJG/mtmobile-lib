import { Observable, Observer } from 'rxjs';
import {
    IProcessorCore,
    TaskItem,
    task
} from '../../src/processes/processor.interfaces';
import { startSequentialProcessor } from '../../src/processes/sequential-processor';
import { testObs } from '../utils/rxtest';
import { getAsValue, ValueOrFunc } from '../../src/utils';
import { makeRunTask } from '../../src/processes/makeRunTask';
import { setTimeout } from 'timers';
import { ReplaySubject } from 'rxjs/ReplaySubject';

describe('Processes', () => {
    describe('Processor Interfaces', () => {
        describe('startSequentialProcessor', () => {
            it('should be a function', () =>
                expect(startSequentialProcessor).toBeInstanceOf(Function));

            describe('When a sequential processor is started with well behaved task', () => {
                const runner = (item: TaskItem) =>
                    Observable.timer(5)
                        .skip(1)
                        .concat(Observable.of(1, 2, 3));
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
                    Observable.timer(5)
                        .skip(1)
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
                    Observable.timer(5)
                        .skip(1)
                        .concat(
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
                    Observable.timer(item.payload).map(() => item.payload);
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 5,
                    nextDelay: d => d
                });

                it('calling taskA and taskB should run them sequentially', done =>
                    testObs(
                        Observable.merge(
                            Observable.timer(10).switchMap(() =>
                                processor.process(task('task1', 10))
                            ),
                            Observable.timer(5).switchMap(() =>
                                processor.process(task('task2', 30))
                            )
                        ),
                        [30, 10],
                        null,
                        done
                    ));
            });

            describe('Given a simple sequential processor with a bad behaved task', () => {
                const runner = makeRunTask({
                    taskA: (item: TaskItem) =>
                        Observable.timer(item.payload).switchMap(() =>
                            Observable.timer(0, 5).take(3).map(v => 100 * (v + 1))),
                    taskB: (item: TaskItem) =>
                        Observable.timer(item.payload).switchMap(() =>
                            Observable.timer(0, 5).take(2).map(v => 10 * (v + 1)))
                                .concat(Observable.throw(new Error('permanent'))),
                });
                const processor = startSequentialProcessor(runner, {
                    maxRetries: 3,
                    nextDelay: d => 2 * d,
                    logToConsole: false
                });

                it('it should reschedule the failing task 3 times', done => {
                    testObs(
                        Observable.timer(10, 10).take(2).flatMap(i => {
                            if (i === 0) {
                                return processor.process(task('taskB', 30));
                            } else {
                                return processor.process(task('taskA', 10));
                            }
                        }),
                        [10, 20, 100, 200, 300, 10, 20, 10, 20],
                        new Error('permanent'),
                        done
                    );
                });
            });
        });
    });
});
