import * as common from './common';
import { emptyValidator } from './validation';

describe('Utils', () => {
    describe('Validation Tests', () => {
        describe('emptyValidator', () => {
            it('should be a function', () => {
                expect(emptyValidator).toBeInstanceOf(Function);
            });
        });
    });
});
