import { Observable } from 'rxjs';
import { normalizeError } from './common';
export const normalizeErrorOnCatch = (err) => Observable.throw(normalizeError(err));
export const tryTo = (thunk) => {
    try {
        const result = thunk();
        if (Promise.resolve(result) === result ||
            typeof result['subscribe'] === 'function') {
            return Observable.from(result);
        }
        return Observable.of(result);
    }
    catch (error) {
        return normalizeErrorOnCatch(error);
    }
};
export const rxid = (x) => Observable.of(x);
export const wrapFunctionStream = (stream) => {
    const conn = stream.publishReplay(1);
    const subs = conn.connect();
    return ((...args) => conn.first().switchMap(f => f(...args)));
};
export const wrapServiceStreamFromNames = (source, names) => {
    const conn = source.publishReplay(1);
    const subs = conn.connect();
    return names.reduce((prev, name) => Object.assign(prev, {
        [name]: wrapFunctionStream(conn.map(s => s[name]))
    }), {});
};
export const firstMap = (source) => (mapper) => source
    .first()
    .map(mapper)
    .catch(normalizeErrorOnCatch);
export const firstSwitchMap = (source) => (mapper) => source
    .first()
    .switchMap(mapper)
    .catch(normalizeErrorOnCatch);
export function makeState(init, updates$) {
    const state$ = updates$
        .scan((prev, up) => up(prev), init)
        .publishBehavior(init);
    const connection = state$.connect();
    return [state$, connection];
}
//# sourceMappingURL=rxutils.js.map