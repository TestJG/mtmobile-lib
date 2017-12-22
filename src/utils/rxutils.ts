import { Observable, Subscription, ReplaySubject } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { normalizeError } from './common';
import { IScheduler } from 'rxjs/Scheduler';

export type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T;

export const normalizeErrorOnCatch = <T>(err: any): Observable<T> =>
    Observable.throw(normalizeError(err));

export const tryTo = <T>(thunk: () => ObsLike<T>): Observable<T> => {
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

export const rxid = <T>(x: T) => Observable.of(x);

export const rxdelay = <T>(ms: number | Date) =>
    Observable.empty<T>()
        .delay(ms);

export const rxdelayof = <T>(ms: number | Date, ...arr: T[]) =>
    Observable.of(...arr)
        .delay(ms);

type FuncOf<V> = (...args: any[]) => V;
type FuncOfObs<V> = FuncOf<Observable<V>>;

export const wrapFunctionStream = <V, F extends FuncOfObs<V>>(
    stream: Observable<F>
): F => {
    const conn = stream.publishReplay(1);
    const subs = conn.connect();
    return <F>((...args: any[]) => conn.first().switchMap(f => f(...args)));
};

export const wrapServiceStreamFromNames = <T extends { [name: string]: any }>(
    source: Observable<T>,
    names: (keyof T)[]
): T => {
    const conn = source.publishReplay(1);
    const subs = conn.connect();
    return names.reduce(
        (prev, name) =>
            Object.assign(prev, {
                [name]: wrapFunctionStream(<any>conn.map(s => s[name]))
            }),
        <T>{}
    );
};

export const firstMap = <S>(source: Observable<S>) => <T>(
    mapper: (s: S) => T
) =>
    <Observable<T>>source
        .first()
        .map(mapper)
        .catch(normalizeErrorOnCatch);

export const firstSwitchMap = <S>(source: Observable<S>) => <T>(
    mapper: (db: S) => Observable<T>
) =>
    <Observable<T>>source
        .first()
        .switchMap(mapper)
        .catch(normalizeErrorOnCatch);

export function makeState<TState>(
    init: TState,
    updates$: Observable<(state: TState) => TState>
): [Observable<TState>, Subscription] {
    const state$ = updates$
        .scan((prev, up) => up(prev), init)
        .publishBehavior(init);
    const connection = state$.connect();
    return [state$, connection];
}
