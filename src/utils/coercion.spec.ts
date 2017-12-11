import * as common from './common';
import { coerceAll } from './coercion';

describe('Utils', () => {
    describe('Coercion Tests', () => {
        describe('mergeCoerceList', () => {
            it('should be a function', () => {
                expect(coerceAll).toBeInstanceOf(Function);
            });
        });
    });
});
