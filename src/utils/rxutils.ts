import { Observable, Subscription } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { normalizeError } from './common';

export const normalizeErrorOnCatch = <T>(err: any): Observable<T> =>
    Observable.throw(normalizeError(err));

export const tryTo = <T>(
    thunk: () => T | Subscribable<T> | PromiseLike<T>
): Observable<T> => {
    try {
        const result = thunk();
        if (
            Promise.resolve(<any>result) === result ||
            typeof result['subscribe'] === 'function'
        ) {
            return Observable.from(<any>result);
        }
        return Observable.of(<T>result);
    } catch (error) {
        return normalizeErrorOnCatch(error);
    }
};
