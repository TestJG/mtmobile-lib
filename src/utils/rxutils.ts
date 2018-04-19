import { Observable, Subscribable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import {
    isSomething,
    normalizeError,
    ValueOrFunc,
    getAsValue,
    conditionalLog,
    capString,
    noop
} from './common';
import { IScheduler } from 'rxjs/Scheduler';
import { Subscription } from 'rxjs/Subscription';

export type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T[] | T;
export type ObsOrFunc<T = any> = ValueOrFunc<ObsLike<T>>;

export const normalizeErrorOnCatch = <T>(err: any): Observable<T> =>
    Observable.throw(normalizeError(err));

export const fromObsLike = <T>(
    source: ObsLike<T>,
    treatArraysAsValues = true
): Observable<T> => {
    if (
        isSomething(source) &&
        (Promise.resolve(<any>source) === source ||
            typeof source['subscribe'] === 'function' ||
            (!treatArraysAsValues && source instanceof Array))
    ) {
        return Observable.from(<any>source);
    } else {
        return Observable.of(<T>source);
    }
};

export const tryTo = <T>(
    thunk: (defer: ((action: (() => void)) => void)) => ObsLike<T>,
    treatArraysAsValues = true
): Observable<T> => {
    const defers: (() => void)[] = [];
    let finishing = false;
    const defer = (action: (() => void)) => {
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
) => <Observable<T>>source.first().map(mapper).catch(normalizeErrorOnCatch);

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
