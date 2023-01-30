/* eslint-disable max-len */
import { merge, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    fromServiceToDirectProcessor,
    startRouterProcessor,
    startRouterProxy
} from '../../src/processes';
import { task } from '../../src/processes/processor.interfaces';
import { testObs } from '../utils/rxtest';

describe('Processes', () => {
    describe('Router Processor', () => {
        describe('startRouterProcessor', () => {
            it('should be a function', () =>
                expect(startRouterProcessor).toBeInstanceOf(Function));

            describe('When a router processor is started with two processors', () => {
                const dummy = ms => p => timer(ms).pipe(map(() => p));
                const service = (msa, msb) => ({
                    taskA: dummy(msa),
                    taskB: dummy(msb)
                });
                const proc1 = fromServiceToDirectProcessor(
                    service(5, 20),
                    'Proc1'
                );
                const proc2 = fromServiceToDirectProcessor(
                    service(10, 15),
                    'Proc2'
                );
                const proc = startRouterProcessor(
                    { svc1: proc1, svc2: proc2 },
                    { caption: 'Proc', routeSeparator: '/' }
                );

                it('it should process task returning the well behaved result', done => {
                    testObs(
                        merge(
                            proc.process(task('svc1/taskA', 10)),
                            proc.process(task('svc1/taskB', 20)),
                            proc.process(task('svc2/taskA', 30)),
                            proc.process(task('svc2/taskB', 40))
                        ),
                        [10, 30, 40, 20],
                        null,
                        done
                    );
                });
            });
        });
    });

    describe('Router Proxy', () => {
        describe('startRouterProxy', () => {
            it('should be a function', () =>
                expect(startRouterProxy).toBeInstanceOf(Function));

            describe('When a router proxy is started with a prefix', () => {
                const dummy = ms => p => timer(ms).pipe(map(() => p));
                const service = (msa, msb) => ({
                    taskA: dummy(msa),
                    taskB: dummy(msb)
                });
                const proc1 = fromServiceToDirectProcessor(
                    service(5, 20),
                    'Proc1'
                );
                const proc2 = fromServiceToDirectProcessor(
                    service(10, 15),
                    'Proc2'
                );
                const proc = startRouterProcessor(
                    { svc1: proc1, svc2: proc2 },
                    { caption: 'Proc', routeSeparator: '/' }
                );
                const proxy1 = startRouterProxy(proc, 'svc1', {
                    routeSeparator: '/'
                });
                const proxy2 = startRouterProxy(proc, 'svc2', {
                    routeSeparator: '/'
                });

                it('it should process task returning the well behaved result', done => {
                    testObs(
                        merge(
                            proxy1.process(task('taskA', 10)),
                            proxy1.process(task('taskB', 20)),
                            proxy2.process(task('taskA', 30)),
                            proxy2.process(task('taskB', 40))
                        ),
                        [10, 30, 40, 20],
                        null,
                        done
                    );
                });
            });
        });
    });
});
