import { fromProcessorToService } from '../../src/processes/processor.interfaces';

describe('Processes', () => {
    describe('Processor Interfaces', () => {
        describe('fromProcessorToService', () => {
            it('should be a function', () => {
                expect(fromProcessorToService).toBeInstanceOf(Function);
            });
        });
    });
});
