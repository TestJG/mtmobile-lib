import {
    merge,
    of,
    from,
    throwError,
    Observable,
    Subscribable,
    Observer,
    Subscription,
    ConnectableObservable,
    ObservableInput
} from 'rxjs';
import {
    materialize,
    ignoreElements,
    tap,
    publishReplay,
    first,
    publishBehavior,
    map,
    catchError,
    scan,
    takeUntil,
    switchMap
} from 'rxjs/operators';
import {
    isSomething,
    normalizeError,
    ValueOrFunc,
    getAsValue,
    conditionalLog,
    capString,
    noop,
    FuncOf,
    isPromiseLike
} from './common';

export type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T[] | T;
export type ObsOrFunc<T = any> = ValueOrFunc<ObsLike<T>>;

export const normalizeErrorOnCatch = <T>(err: any): Observable<T> =>
    throwError(normalizeError(err));

export const isSubscribable = <T>(subs: unknown): subs is Subscribable<T> =>
    isSomething(subs) && typeof subs['subscribe'] === 'function';

export const isObservableInput = <T>(
    obs: unknown
): obs is ObservableInput<T> => {
    if (!isSomething(obs)) {
        return false;
    }

    // Observable
    if (obs instanceof Observable) {
        return true;
    }
    // InteropObservable
    if (typeof obs[Symbol.observable] === 'function') {
        return true;
    }
    // PromiseLike
    if (isPromiseLike(obs)) {
        return true;
    }
    // Subscribable
    if (isSubscribable(obs)) {
        return true;
    }
    // Array
    if (Array.isArray(obs)) {
        return true;
    }
    // ArrayLike
    if (
        typeof obs !== 'function' &&
        typeof obs['length'] === 'number' &&
        obs['length'] > -1
    ) {
        return true;
    }
    // Iterable
    if (typeof obs[Symbol.iterator] === 'function') {
        return true;
    }

    return false;
};

export const fromObsLike = <T>(
    source: ObsLike<T>,
    treatArraysAsValues = true
): Observable<T> => {
    // Can't use isObservableInput because string qualifies as ObservableInput
    // and current behavior is not to treat it as an observable.
    if (
        isPromiseLike(source) ||
        isSubscribable(source) ||
        (!treatArraysAsValues && source instanceof Array)
    ) {
        return from(source);
    } else {
        return of(source as T);
    }
};

export const tryTo = <T>(
    thunk: (defer: (action: () => void) => void) => ObsLike<T>,
    treatArraysAsValues = true
): Observable<T> => {
    const defers: (() => void)[] = [];
    let finishing = false;
    const defer = (action: () => void) => {
        if (finishing) {
            throw new Error(
                'Already finishing, this is not the time to defer.'
            );
        }
        defers.push(action);
    };
    const runDefers = () => {
        finishing = true;
        for (const action of defers.reverse()) {
            try {
                action();
            } catch (error) {
                console.log(`Error in deferred action: ${error}`);
            }
        }
    };

    let obs: Observable<T>;
    try {
        obs = fromObsLike(thunk(defer), treatArraysAsValues);
    } catch (error) {
        obs = normalizeErrorOnCatch(error);
    }
    return obs.pipe(tap({ complete: runDefers, error: runDefers }));
};

// type FuncOf<V> = (...args: any[]) => V;
export type FuncOfObs<V> = FuncOf<Observable<V>>;

export const wrapFunctionStream = <V, F extends FuncOfObs<V>>(
    stream: Observable<F>
): F => {
    const conn = stream.pipe(publishReplay(1)) as ConnectableObservable<F>;
    const subs = conn.connect();
    return <F>((...args: any[]) =>
        conn.pipe(
            first(),
            switchMap(f => f(...args))
        ));
};

export const wrapServiceStreamFromNames = <T extends { [name: string]: any }>(
    source: Observable<T>,
    names: (keyof T)[]
): T => {
    const conn = source.pipe(publishReplay(1)) as ConnectableObservable<T>;
    const subs = conn.connect();
    return names.reduce(
        (prev, name) =>
            Object.assign(prev, {
                [name]: wrapFunctionStream(<any>conn.pipe(map(s => s[name])))
            }),
        <T>{}
    );
};

export const firstMap =
    <S>(source: Observable<S>) =>
    <T>(mapper: (s: S) => T) =>
        <Observable<T>>(
            source.pipe(first(), map(mapper), catchError(normalizeErrorOnCatch))
        );

export const firstSwitchMap =
    <S>(source: Observable<S>) =>
    <T>(mapper: (db: S) => Observable<T>) =>
        <Observable<T>>(
            source.pipe(
                first(),
                switchMap(mapper),
                catchError(normalizeErrorOnCatch)
            )
        );

export const getAsObs = <T = any>(source: ObsOrFunc<T>) =>
    tryTo(() => getAsValue(source));

export function makeState<TState>(
    init: TState,
    updates$: Observable<(state: TState) => TState>
): [Observable<TState>, Subscription] {
    const state$ = updates$.pipe(
        scan((prev: TState, up: (state: TState) => TState) => up(prev), init),
        publishBehavior(init)
    ) as ConnectableObservable<TState>;
    const connection = state$.connect();
    return [state$, connection];
}

export function mapUntilCancelled<T>(
    observable: Observable<T>,
    cancel: Observable<T>
) {
    return merge(
        observable.pipe(takeUntil(cancel)),
        cancel.pipe(
            first(),
            takeUntil(observable.pipe(ignoreElements(), materialize()))
        )
    );
}

export function logObserver(
    logger = console.log,
    maxLength = 80,
    logNext = true,
    logErrors = true,
    logComplete = true
) {
    const next = logNext
        ? v => logger('NEXT : ', capString(JSON.stringify(v), maxLength))
        : noop;
    const error = logErrors ? v => logger('ERROR: ', v) : noop;
    const complete = logComplete ? () => logger('COMPLETE') : noop;
    return <Observer<any>>{ next, error, complete };
}
