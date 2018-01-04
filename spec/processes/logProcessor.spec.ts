import { Observable, Observer } from 'rxjs';
import { testObs } from '../utils/rxtest';
import { logProcessor, logProcessorCore } from '../../src/processes';

describe('Processes', () => {
    describe('logProcessor', () => {
        it('should be a function', () =>
            expect(logProcessor).toBeInstanceOf(Function));
    });

    describe('logProcessorCore', () => {
        it('should be a function', () =>
            expect(logProcessorCore).toBeInstanceOf(Function));
    });
});
