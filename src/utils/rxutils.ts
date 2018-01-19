import { Observable, Subscription, ReplaySubject } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { isSomething, normalizeError, ValueOrFunc, getAsValue } from './common';
import { IScheduler } from 'rxjs/Scheduler';

export type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T;
export type ObsOrFunc<T = any> = ValueOrFunc<ObsLike<T>>;

export const normalizeErrorOnCatch = <T>(err: any): Observable<T> =>
    Observable.throw(normalizeError(err));

export const tryTo = <T>(thunk: (defer: ((action: (() => void)) => void)) => ObsLike<T>): Observable<T> => {
    const defers: (() => void)[] = [];
    let finishing = false;
    const defer = (action: (() => void)) => {
        if (finishing) {
            throw new Error('Already finishing, this is not the time to defer.');
        }
        defers.push(action);
    };
    const runDefers = () => {
        finishing = true;
        for (const action of defers) {
            try {
                action();
            } catch (error) {
                console.log(`Error in deferred action: ${error}`);
            }
        }
    };

    let obs: Observable<T>;
    try {
        const result = thunk(defer);
        if (
            isSomething(result) &&
            (Promise.resolve(<any>result) === result ||
                typeof result['subscribe'] === 'function')
        ) {
            obs = Observable.from(<any>result);
        } else {
            obs = Observable.of(<T>result);
        }
    } catch (error) {
        obs = normalizeErrorOnCatch(error);
    }
    return obs.do({ complete: runDefers, error: runDefers });
};

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

export const getAsObs = <T = any>(source: ObsOrFunc<T>) =>
    tryTo(() => getAsValue(source));

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

export function mapUntilCancelled<T>(
    observable: Observable<T>,
    cancel: Observable<T>
) {
    return Observable.merge(
        observable.takeUntil(cancel),
        cancel.first().takeUntil(observable.ignoreElements().materialize())
    );
}
