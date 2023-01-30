import { EMPTY, Observable, of } from 'rxjs';
import { fromProcessorToService, task } from '../../src/processes';
import { testObs } from '../utils/rxtest';

describe('Processes', () => {
    describe('Processor Interfaces', () => {
        describe('task', () => {
            it('should be a function', () =>
                expect(task).toBeInstanceOf(Function));

            it('when passed a kind should return a TaskItem with given kind', () => {
                const t = task('taskA');
                expect(t).not.toBeUndefined();
                expect(t.kind).toBe('taskA');
                expect(t.payload).toBeUndefined();
                expect(t.uid).not.toBeUndefined();
                expect(t.uid).toHaveLength(32);
            });

            it('when passed a kind and payload should return a TaskItem with given kind and payload', () => {
                const t = task('taskA', 42);
                expect(t).not.toBeUndefined();
                expect(t.kind).toBe('taskA');
                expect(t.payload).toBe(42);
                expect(t.uid).not.toBeUndefined();
                expect(t.uid).toHaveLength(32);
            });

            it('when passed all parameters should return a TaskItem with given parameters', () => {
                const t = task('taskA', 42, '12345');
                expect(t).not.toBeUndefined();
                expect(t.kind).toBe('taskA');
                expect(t.payload).toBe(42);
                expect(t.uid).not.toBeUndefined();
                expect(t.uid).toBe('12345');
            });
        });

        describe('fromProcessorToService', () => {
            it('should be a function', () =>
                expect(fromProcessorToService).toBeInstanceOf(Function));

            const createInit = <T>(names: string[]) => {
                const processor = {
                    process: jest.fn(item => of(item.kind + item.payload)),
                    isAlive: jest.fn(() => true),
                    finish: jest.fn(() => EMPTY)
                };
                const service = fromProcessorToService<T>(processor, names);
                return [processor, service] as const;
            };

            describe('When a processor is wrapped as a service', () => {
                it('it should not be undefined', () => {
                    const [processor, service] = createInit(['taskA', 'taskB']);
                    expect(service).not.toBeFalsy();
                });

                it('it should have as many methods as indicated', () => {
                    const [processor, service] = createInit(['taskA', 'taskB']);
                    expect(Object.keys(service)).toEqual(['taskA', 'taskB']);
                });

                it("it should call the processor's process", done => {
                    const [processor, service] = createInit(['taskA', 'taskB']);
                    (service as any).taskA(42);
                    expect(processor.process).toHaveBeenCalledTimes(1);
                    const call = processor.process.mock.calls.pop();
                    const returnValue = processor.process.mock.results.pop();
                    expect(call[0].kind).toEqual('taskA');
                    expect(call[0].payload).toEqual(42);
                    expect(returnValue.value).toBeInstanceOf(Observable);
                    testObs(returnValue.value, ['taskA42'], null, done);
                });
            });
        });
    });
});
