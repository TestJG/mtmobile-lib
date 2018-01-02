import { Observable, Observer } from 'rxjs';
import {
    IProcessorCore,
    TaskItem,
    task
} from '../../src/processes/processor.interfaces';
import { testObs } from '../utils/rxtest';
import {
    fromServiceToDirectProcessor,
    startDirectProcessor
} from '../../src/processes/direct-processor';
import {
    createBackgroundWorker,
    createForegroundWorker
} from '../../src/processes/worker-processor';

describe('Processes', () => {
    describe('Router Processor', () => {
        describe('createBackgroundWorker', () => {
            it('should be a function', () =>
                expect(createBackgroundWorker).toBeInstanceOf(Function));
        });
    });
});
