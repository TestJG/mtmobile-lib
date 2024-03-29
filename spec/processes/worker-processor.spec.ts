/* eslint-disable max-len */
import { ReplaySubject, timer } from 'rxjs';
import { timeout } from 'rxjs/operators';
import type { IProcessor, SimpleWorker } from '../../src/processes';
import {
    createBackgroundWorker,
    createForegroundWorker,
    fromServiceToDirectProcessor,
    task,
    TransientError
} from '../../src/processes';
import { testObs, testTaskOf } from '../utils/rxtest';

describe('Processes', () => {
    describe('Router Processor', () => {
        describe('createBackgroundWorker', () => {
            it('should be a function', () =>
                expect(createBackgroundWorker).toBeInstanceOf(Function));

            describe('When a background worker is created from a well behaved processor', () => {
                const procSubj = new ReplaySubject<IProcessor>(1);
                procSubj.next(
                    fromServiceToDirectProcessor(
                        {
                            taskA: testTaskOf(5)(1, 2, 3),
                            taskB: testTaskOf(5)(10, 20, 30)
                        },
                        'Proc'
                    )
                );
                const postMessageSpy = jest.fn();
                const terminateSpy = jest.fn();
                const worker = createBackgroundWorker({
                    processor: procSubj.asObservable(),
                    postMessage: postMessageSpy,
                    terminate: terminateSpy
                });

                it('it should work as expected', done => {
                    expect(worker).toBeDefined();
                    expect(worker.process).toBeInstanceOf(Function);
                    worker.process({
                        kind: 'process',
                        uid: '123',
                        task: task('taskA')
                    });
                    setTimeout(() => {
                        try {
                            expect(postMessageSpy).toHaveBeenCalledTimes(4);
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'N',
                                uid: '123',
                                valueOrError: 1
                            });
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'N',
                                uid: '123',
                                valueOrError: 2
                            });
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'N',
                                uid: '123',
                                valueOrError: 3
                            });
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'C',
                                uid: '123'
                            });
                            expect(terminateSpy).not.toHaveBeenCalled();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }, 100);
                });
            });

            describe('When a background worker is created from a bad behaved processor', () => {
                const procSubj = new ReplaySubject<IProcessor>(1);
                procSubj.next(
                    fromServiceToDirectProcessor(
                        {
                            taskA: testTaskOf(5)(
                                1,
                                2,
                                new TransientError('transient')
                            ),
                            taskB: testTaskOf(5)(10, 20, 30)
                        },
                        'Proc',
                        { maxRetries: 2, maxDelay: 5 }
                    )
                );
                const postMessageSpy = jest.fn();
                const terminateSpy = jest.fn();
                const worker = createBackgroundWorker({
                    processor: procSubj.asObservable(),
                    postMessage: postMessageSpy,
                    terminate: terminateSpy
                });

                it('it should work as expected', done => {
                    expect(worker).toBeDefined();
                    expect(worker.process).toBeInstanceOf(Function);
                    worker.process({
                        kind: 'process',
                        uid: '123',
                        task: task('taskA')
                    });
                    setTimeout(() => {
                        try {
                            expect(postMessageSpy).toHaveBeenCalledTimes(5);
                            expect(postMessageSpy).toHaveBeenNthCalledWith(1, {
                                kind: 'N',
                                uid: '123',
                                valueOrError: 1
                            });
                            expect(postMessageSpy).toHaveBeenNthCalledWith(2, {
                                kind: 'N',
                                uid: '123',
                                valueOrError: 2
                            });
                            expect(postMessageSpy).toHaveBeenNthCalledWith(3, {
                                kind: 'N',
                                uid: '123',
                                valueOrError: 1
                            });
                            expect(postMessageSpy).toHaveBeenNthCalledWith(4, {
                                kind: 'N',
                                uid: '123',
                                valueOrError: 2
                            });
                            expect(postMessageSpy).toHaveBeenNthCalledWith(5, {
                                kind: 'E',
                                uid: '123',
                                valueOrError: new TransientError('transient')
                            });
                            expect(terminateSpy).not.toHaveBeenCalled();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }, 500);
                });
            });
        });

        describe('createForegroundWorker', () => {
            it('should be a function', () =>
                expect(createForegroundWorker).toBeInstanceOf(Function));

            describe('When a foreground worker is created from a well behaved worker', () => {
                const postMessage = jest.fn();
                const terminate = jest.fn();
                const worker: SimpleWorker = {
                    postMessage,
                    onmessage: null,
                    terminate
                };
                const foreWorker = createForegroundWorker({
                    createWorker: () => worker
                });

                it('the worker should have its onmessage method assigned', () =>
                    expect(worker.onmessage).toBeDefined());

                it("the worker's postMessage should have been called", () => {
                    const theTask = task('inc');
                    foreWorker.process(theTask).subscribe();
                    expect(postMessage).toHaveBeenCalledTimes(1);
                    expect(terminate).not.toHaveBeenCalled();
                    const workItem = postMessage.mock.lastCall[0];
                    expect(workItem.task).toBe(theTask);
                    expect(workItem.uid).toBeDefined();
                    expect(workItem.kind).toEqual('process');
                });
            });

            describe('When a foreground worker is created and terminated', () => {
                const postMessage = jest.fn();
                const terminate = jest.fn();
                const worker: SimpleWorker = {
                    postMessage,
                    onmessage: null,
                    terminate
                };
                const foreWorker = createForegroundWorker({
                    createWorker: () => worker
                });

                it("the worker's postMessage should have been called", done => {
                    let allValidated = false;
                    const theTask = task('inc');
                    foreWorker.process(theTask).subscribe();
                    foreWorker.finish().subscribe({
                        complete: () => {
                            expect(terminate).toHaveBeenCalled();
                            expect(allValidated).toBeTruthy();
                            done();
                        }
                    });
                    expect(postMessage).toHaveBeenCalledTimes(2);
                    expect(terminate).not.toHaveBeenCalled();
                    const workItem = postMessage.mock.calls[0][0];
                    expect(workItem.task).toBe(theTask);
                    expect(workItem.uid).toBeDefined();
                    expect(workItem.kind).toEqual('process');
                    const termItem = postMessage.mock.lastCall[0];
                    expect(termItem.task).toBeUndefined();
                    expect(termItem.uid).toBeDefined();
                    expect(termItem.kind).toEqual('terminate');
                    allValidated = true;
                    worker.onmessage({ uid: termItem.uid, kind: 'C' });
                });
            });

            describe('When a foreground worker is created and the worker responds with values and complete', () => {
                const postMessage = jest.fn();
                const terminate = jest.fn();
                const worker: SimpleWorker = {
                    postMessage,
                    onmessage: null,
                    terminate
                };
                const foreWorker = createForegroundWorker({
                    createWorker: () => worker
                });

                it("the worker's postMessage should have been called", done => {
                    const theTask = task('inc');
                    testObs(foreWorker.process(theTask), [1, 2, 3], null, done);
                    expect(postMessage).toHaveBeenCalledTimes(1);
                    const workItem = postMessage.mock.calls[0][0];
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 1
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 2
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 3
                    });
                    worker.onmessage({ uid: workItem.uid, kind: 'C' });
                });
            });

            describe('When a foreground worker is created and the worker responds with values and error', () => {
                const postMessage = jest.fn();
                const terminate = jest.fn();
                const worker: SimpleWorker = {
                    postMessage,
                    onmessage: null,
                    terminate
                };
                const foreWorker = createForegroundWorker({
                    createWorker: () => worker
                });

                it("the worker's postMessage should have been called", done => {
                    const theTask = task('inc');
                    testObs(
                        foreWorker.process(theTask),
                        [1, 2, 3],
                        new Error('sorry'),
                        done
                    );
                    expect(postMessage).toHaveBeenCalledTimes(1);
                    const workItem = postMessage.mock.calls[0][0];
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 1
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 2
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 3
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'E',
                        valueOrError: new Error('sorry')
                    });
                });
            });

            describe('When a foreground worker is created the observable is unsubscribed', () => {
                const postMessage = jest.fn();
                const terminate = jest.fn();
                const worker: SimpleWorker = {
                    postMessage,
                    onmessage: null,
                    terminate
                };
                const foreWorker = createForegroundWorker({
                    createWorker: () => worker
                });

                it("the worker's postMessage should have been called", done => {
                    const theTask = task('inc');
                    const subscription = testObs(
                        foreWorker.process(theTask).pipe(
                            timeout({
                                each: 20,
                                with: () => ['timeout-signal']
                            })
                        ),
                        [1, 2, 'timeout-signal'],
                        null,
                        done
                    );
                    expect(postMessage).toHaveBeenCalledTimes(1);
                    const workItem = postMessage.mock.calls[0][0];
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 1
                    });
                    worker.onmessage({
                        uid: workItem.uid,
                        kind: 'N',
                        valueOrError: 2
                    });
                    timer(40).subscribe(() => subscription.unsubscribe());
                });
            });
        });
    });
});
