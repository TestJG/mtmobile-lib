import { Observable } from 'rxjs';
import { testObs } from '../utils/rxtest';
import { TaskItem } from '../../src/processes/processor.interfaces';
import { makeRunTask } from '../../src/processes/makeRunTask';

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
        });
    });
});
