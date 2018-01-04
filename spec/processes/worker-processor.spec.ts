import { Observable, Observer } from 'rxjs';
import { testObs, testTaskOf } from '../utils/rxtest';
import {
    IProcessorCore,
    TaskItem,
    task,
    fromServiceToDirectProcessor,
    startDirectProcessor,
    createBackgroundWorker,
    createForegroundWorker
} from '../../src/processes';
import { ReplaySubject } from 'rxjs/ReplaySubject';

describe('Processes', () => {
    describe('Router Processor', () => {
        describe('createBackgroundWorker', () => {
            it('should be a function', () =>
                expect(createBackgroundWorker).toBeInstanceOf(Function));

            describe('When a background worker is created from a well behaved processor', () => {
                const proc = fromServiceToDirectProcessor(
                    {
                        taskA: testTaskOf(5)(1, 2, 3),
                        taskB: testTaskOf(5)(10, 20, 30)
                    },
                    'Proc'
                );
                const postMessageSpy = jasmine.createSpy('postMessage');
                const terminateSpy = jasmine.createSpy('terminate');
                const worker = createBackgroundWorker({
                    processor: proc,
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
                            done.fail(e);
                        }
                    }, 100);
                });
            });

            describe('When a background worker is created from a bad behaved processor', () => {
                const proc = fromServiceToDirectProcessor(
                    {
                        taskA: testTaskOf(5)(1, 2, new Error('permanent')),
                        taskB: testTaskOf(5)(10, 20, 30)
                    },
                    'Proc', { maxRetries: 2, maxDelay: 5 }
                );
                const postMessageSpy = jasmine.createSpy('postMessage');
                const terminateSpy = jasmine.createSpy('terminate');
                const worker = createBackgroundWorker({
                    processor: proc,
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
                                valueOrError: 1
                            });
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'N',
                                uid: '123',
                                valueOrError: 2
                            });
                            expect(postMessageSpy).toHaveBeenCalledWith({
                                kind: 'E',
                                uid: '123',
                                valueOrError: new Error('permanent')
                            });
                            expect(terminateSpy).not.toHaveBeenCalled();
                            done();
                        } catch (e) {
                            done.fail(e);
                        }
                    }, 100);
                });
            });
        });
    });
});
