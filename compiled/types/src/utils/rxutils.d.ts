import { Observable, Subscribable, Observer, Subscription } from 'rxjs';
import { ValueOrFunc, FuncOf } from './common';
export declare type ObsLike<T = any> = Subscribable<T> | PromiseLike<T> | T[] | T;
export declare type ObsOrFunc<T = any> = ValueOrFunc<ObsLike<T>>;
export declare const normalizeErrorOnCatch: <T>(err: any) => Observable<T>;
export declare const fromObsLike: <T>(source: ObsLike<T>, treatArraysAsValues?: boolean) => Observable<T>;
export declare const tryTo: <T>(thunk: (defer: (action: () => void) => void) => ObsLike<T>, treatArraysAsValues?: boolean) => Observable<T>;
export declare const wrapFunctionStream: <V, F extends FuncOf<Observable<V>>>(stream: Observable<F>) => F;
export declare const wrapServiceStreamFromNames: <T extends {
    [name: string]: any;
}>(source: Observable<T>, names: (keyof T)[]) => T;
export declare const firstMap: <S>(source: Observable<S>) => <T>(mapper: (s: S) => T) => Observable<T>;
export declare const firstSwitchMap: <S>(source: Observable<S>) => <T>(mapper: (db: S) => Observable<T>) => Observable<T>;
export declare const getAsObs: <T = any>(source: ValueOrFunc<ObsLike<T>>) => Observable<T>;
export declare function makeState<TState>(init: TState, updates$: Observable<(state: TState) => TState>): [Observable<TState>, Subscription];
export declare function mapUntilCancelled<T>(observable: Observable<T>, cancel: Observable<T>): Observable<T>;
export declare function logObserver(logger?: {
    (message?: any, ...optionalParams: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
}, maxLength?: number, logNext?: boolean, logErrors?: boolean, logComplete?: boolean): Observer<any>;
