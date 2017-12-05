import { Observable } from 'rxjs';
import { Action, ActionReducer } from '@ngrx/store';
import {
    objFlatMap,
    objMapValues,
    objMap,
    joinStr,
    id,
    assign
} from './common';

export interface PAction<T> extends Action {
    payload: T;
}

export type ReducerOf<S, T = any> = (s: S, p: T) => S;

export type PartialReducerOf<S, T = any> = (
    s: S,
    p: T
) => Partial<S>[] | Partial<S> | false;

export type SimpleReducerOf<S, T = any> = (s: S) => S;

export type SimplePartialReducerOf<S, T = any> = (
    s: S
) => Partial<S>[] | Partial<S> | false;

export interface ReducersOf<S> {
    [action: string]: ReducerOf<S>;
}

export interface PartialReducersOf<S> {
    [action: string]: PartialReducerOf<S>;
}

export interface ActionDescBase<S> {
    type: string;
    name: string;
    prefix: string;
    is: (action: Action) => boolean;
    reducer: ReducerOf<S, any>;
}

export interface ActionDesc<T, S = any> extends ActionDescBase<S> {
    (payload: T): PAction<T>;
    create: (payload: T) => PAction<T>;
    reducer: ReducerOf<S, T>;
    filter: (action$: Observable<Action>) => Observable<T>;
}

export interface ActionDescEmpty<S = any> extends ActionDescBase<S> {
    (): Action;
    create: () => Action;
    filter: (action$: Observable<Action>) => Observable<void>;
}

export interface ActionMap {
    [name: string]: ActionDescBase<any>;
}

export const partialReducer = <T, S = any>(
    p: PartialReducerOf<S, T>
): ReducerOf<S, T> =>
    !p
        ? undefined
        : (state: S, payload: T) => {
              const changes = p(state, payload);
              // If false or the same state is returned, then do not alter the state
              if (changes && changes !== state) {
                  if (changes instanceof Array) {
                      return Object.assign({}, state, ...changes);
                  } else {
                      return Object.assign({}, state, changes);
                  }
              } else {
                  return state;
              }
          };

export const simpleReducer = <T, S = any>(
    p: SimplePartialReducerOf<S, T>
): SimpleReducerOf<S, T> =>
    !p
        ? undefined
        : (state: S) => {
              const changes = p(state);
              // If false or the same state is returned, then do not alter the state
              if (changes && changes !== state) {
                  return Object.assign({}, state, changes);
              } else {
                  return state;
              }
          };

export const action = <T = any, S = any>(
    prefix: string,
    name: string,
    reducer?: ReducerOf<S, T>
): ActionDesc<T, S> => {
    const type = joinStr(':', [prefix, name]);
    const create = (payload: T) => ({ type, payload });
    reducer = reducer || id;
    const is = (a: Action) => a.type === type;
    const filter = (actions: Observable<Action>) =>
        actions.filter(is).map(a => <T>(<any>a).payload);
    const result = Object.assign(create, {
        name,
        type,
        prefix,
        create,
        reducer,
        filter,
        is
    });
    return result;
};

export const actionEmpty = <S = any>(
    prefix: string,
    name: string,
    aSimpleReducer?: SimpleReducerOf<S>
): ActionDescEmpty<S> => {
    const type = joinStr(':', [prefix, name]);
    const create = () => ({ type });
    const reducer: ReducerOf<S, void> = aSimpleReducer || id;
    const is = (a: Action) => a.type === type;
    const filter = (actions: Observable<Action>) =>
        actions.filter(is).map(() => null);
    const result = Object.assign(create, {
        name,
        type,
        prefix,
        create,
        reducer,
        filter,
        is
    });
    return result;
};

export const partial = <T = any, S = any>(
    prefix: string,
    name: string,
    pReducer: PartialReducerOf<S, T>
) => action(prefix, name, partialReducer(pReducer));

export const partialEmpty = <T = any, S = any>(
    prefix: string,
    name: string,
    aPartialReducer: SimplePartialReducerOf<S, T>
) => actionEmpty(prefix, name, simpleReducer(aPartialReducer));

export const overrideActions = <T extends ActionMap>(
    actions: T,
    newReducers?: Partial<{ [P in keyof T]: PartialReducerOf<any, any> }>
): T =>
    <T>objMapValues((def, key) =>
        assign(actions[key], {
            reducer: (newReducers || {})[key] || id
        })
    )(actions);

export const makeReducer = <S>(initialState: S) => (
    ...actionGroups: ActionMap[]
): ActionReducer<S> => {
    const byType = new Map<string, ReducerOf<S, any>>();
    actionGroups.forEach(actions =>
        Object.keys(actions).forEach(key =>
            byType.set(actions[key].type, actions[key].reducer)
        )
    );
    return (s: S = initialState, a: Action) =>
        (byType.get(a.type) || id)(s, a['payload']);
};
