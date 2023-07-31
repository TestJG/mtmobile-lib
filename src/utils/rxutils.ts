import type {
    ObservableInput,
    ObservedValueOf,
    Observer,
    Subscribable,
    Subscription
} from 'rxjs';
import {
    BehaviorSubject,
    connectable,
    from,
    merge,
    Observable,
    of,
    ReplaySubject,
    throwError
} from 'rxjs';
import {
    catchError,
    finalize,
    first,
    ignoreElements,
    map,
    materialize,
    scan,
    switchMap,
    takeUntil
} from 'rxjs/operators';
import type { FuncOf, ValueOrFunc } from './common';
import {
    capString,
    getAsValue,
    isPromiseLike,
    isSomething,
    noop,
    normalizeError
} from './common';

export type ValueObsOrFunc<T> = T | ObsOrFunc<T>;

export type ObsOrFunc<T> = ValueOrFunc<Observable<T>>;

export const normalizeErrorOnCatch = (err: any) =>
    throwError(() => normalizeError(err));

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
    // AsyncIterable
    if (typeof obs[Symbol.asyncIterator] === 'function') {
        return true;
    }
    // ReadableStreamLike
    if (typeof obs['getReader'] === 'function') {
        return true;
    }

    return false;
};

export type ToObservable<
    TValue,
    TArraysAsValues extends boolean = true
> = TValue extends unknown[]
    ? TArraysAsValues extends false
        ? Observable<TValue[number]>
        : Observable<TValue>
    : TValue extends ObservableInput<unknown>
    ? Observable<ObservedValueOf<TValue>>
    : Observable<TValue>;

/**
 * FromObsLike gets a value and returns an observable. Special cases:
 * * If source is an `Observable` it is returned as is.
 * * Else if source is a `string` it will emits the `string` as a whole.
 * * Else if source is an `Array` it will emit the `Array` as a whole or not
 * depending on the `treatArraysAsValues` parameter.
 * * Else if source is an `ObservableInput` it will emit the unwrapped value.
 * * Else it will emit the value as is.
 * @param source Something to turn into an observable
 * @param treatArraysAsValues @default true
 * @returns Observable
 */
export const fromObsLike = <T, A extends boolean = true>(
    source: T,
    treatArraysAsValues: A = true as A
): ToObservable<T, A> => {
    if (
        typeof source !== 'string' &&
        isObservableInput(source) &&
        (treatArraysAsValues ? !Array.isArray(source) : Array.isArray(source))
    ) {
        return from(source) as any;
    } else {
        return of(source) as any;
    }
};

export const tryTo = <T, A extends boolean = true>(
    thunk: (defer: (action: () => void) => void) => T,
    treatArraysAsValues: A = true as A
): ToObservable<T, A> => {
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

    let obs;
    try {
        obs = fromObsLike(thunk(defer), treatArraysAsValues);
    } catch (error) {
        obs = normalizeErrorOnCatch(error);
    }
    return obs.pipe(finalize(runDefers));
};

// type FuncOf<V> = (...args: any[]) => V;
export type FuncOfObs<V> = FuncOf<Observable<V>>;

export const wrapFunctionStream = <V, F extends FuncOfObs<V>>(
    stream: Observable<F>
): F => {
    const conn = connectable(stream, {
        connector: () => new ReplaySubject(1),
        resetOnDisconnect: false
    });
    const _subs = conn.connect();
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
    const conn = connectable(source, {
        connector: () => new ReplaySubject(1),
        resetOnDisconnect: false
    });
    const _subs = conn.connect();
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

export const getAsObs = <T>(source: ValueOrFunc<T>) =>
    tryTo(() => getAsValue(source));

export function makeState<TState>(
    init: TState,
    updates$: Observable<(state: TState) => TState>
): [Observable<TState>, Subscription] {
    const acc = updates$.pipe(
        scan((prev: TState, up: (state: TState) => TState) => up(prev), init)
    );
    const state$ = connectable(acc, {
        connector: () => new BehaviorSubject(init),
        resetOnDisconnect: false
    });
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
