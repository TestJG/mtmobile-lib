import { fromProcessorToService } from './processor.interfaces';

describe('Processes', () => {
    describe('Processor Interfaces', () => {
        describe('fromProcessorToService', () => {
            it('should be a function', () => {
                expect(fromProcessorToService).toBeInstanceOf(Function);
            });
        });
    });
});
