import { Observable, Subscription } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
export declare type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T;
export declare const normalizeErrorOnCatch: <T>(err: any) => Observable<T>;
export declare const tryTo: <T>(thunk: () => ObsLike<T>) => Observable<T>;
export declare const rxid: <T>(x: T) => Observable<T>;
export declare const wrapFunctionStream: <V, F extends (...args: any[]) => Observable<V>>(stream: Observable<F>) => F;
export declare const wrapServiceStreamFromNames: <T extends {
    [name: string]: any;
}>(source: Observable<T>, names: (keyof T)[]) => T;
export declare const firstMap: <S>(source: Observable<S>) => <T>(mapper: (s: S) => T) => Observable<T>;
export declare const firstSwitchMap: <S>(source: Observable<S>) => <T>(mapper: (db: S) => Observable<T>) => Observable<T>;
export declare function makeState<TState>(init: TState, updates$: Observable<(state: TState) => TState>): [Observable<TState>, Subscription];