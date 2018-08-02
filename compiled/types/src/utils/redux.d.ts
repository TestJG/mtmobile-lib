import { Observable } from 'rxjs';
import { Action, ActionReducer } from '@ngrx/store';
/**
 * An ngrx action with a typed payload property.
 * @extends {Action} It is an ngrx action
 * @export
 * @template T The payload type for the action
 */
export interface PAction<T> extends Action {
    payload: T;
}
/**
 * A full reducer function is such that receives a previous state and the
 * payload of a current action, and returns a new (or the same unmodified
 * previous) state.
 * @export
 * @template T The payload type for the action
 * @template S The state type
 */
export declare type ReducerOf<S, T = any> = (s: S, p: T) => S;
/**
 * The result of the partial reducer can be false to
 * indicate that no update should be applied. It can also return one partial
 * state or an array of partial states.
 * @export
 * @template S The state type
 */
export declare type PartialReduction<S> = Partial<S>[] | Partial<S> | undefined | null | boolean;
/**
 * A partial reducer function is such that receives a previous state and the
 * payload of a current action, and returns a {PartialReduction<S>}.
 * @export
 * @template S The state type
 * @template T The action payload type
 */
export declare type PartialReducerOf<S, T = any> = (s: S, p: T) => PartialReduction<S>;
/**
 * A simple reducer function is such that receives a previous state, and
 * returns a new state.
 * @export
 * @template S The state type
 */
export declare type SimpleReducerOf<S> = (s: S) => S;
/**
 * A simple partial reducer function is such that receives a previous state,
 * and returns a {PartialReduction<S>}.
 * @export
 * @template S The state type
 */
export declare type SimplePartialReducerOf<S> = (s: S) => PartialReduction<S>;
/**
 * A ReducersOf<S> represents an object where the property keys are action types
 * and their values represent full reducers of a given state
 * @template S The state type
 */
export interface ReducersOf<S> {
    [action: string]: ReducerOf<S>;
}
/**
 * Describes an action in a non-typed way, for a given state type.
 * @template S The state type
 */
export interface ActionDescBase<S> {
    /**
     * The type of the action. This is the same value as the action type created
     * using the create function in one of the descending interfaces.
     * @type {string}
     * @memberof ActionDescBase
     */
    type: string;
    /**
     * The name of the action
     * @type {string}
     * @memberof ActionDescBase
     */
    actionName: string;
    /**
     * The prefix of the action.
     * @type {string}
     * @memberof ActionDescBase
     */
    prefix: string;
    /**
     * Indicates whether the action instances has payload or not.
     * @type {string}
     * @memberof ActionDescBase
     */
    hasPayload: boolean;
    /**
     * Returns whether a given action has the same type af this descriptor
     * @memberof ActionDescBase
     */
    is: (action: Action) => boolean;
    /**
     * The reducer of the action for the given state type
     * @type {ReducerOf<S, any>}
     * @memberof ActionDescBase
     */
    reducer: ReducerOf<S, any>;
}
/**
 * Describes an action with a typed payload property. It also represents a
 * function to create an instance of an action with a given payload.
 * @export
 * @interface ActionDesc
 * @extends {ActionDescBase<S>}
 * @template T The action payload type
 * @template S The state type
 */
export interface ActionDesc<T, S = any> extends ActionDescBase<S> {
    (payload: T): PAction<T>;
    /**
     * The reducer of the action for the given state type
     * @type {ReducerOf<S, T>}
     * @memberof ActionDescBase
     */
    reducer: ReducerOf<S, T>;
    /**
     * Filters out all actions not corresponding with current description.
     * @memberof ActionDesc
     */
    filter: (action$: Observable<Action>) => Observable<T>;
}
/**
 * Describes an action with no payload. It also represents a function to create
 * an instance of an action.
 * @export
 * @interface ActionDesc
 * @extends {ActionDescBase<S>}
 * @template T The action payload type
 * @template S The state type
 */
export interface ActionDescEmpty<S = any> extends ActionDescBase<S> {
    (): Action;
    /**
     * Filters out all actions not corresponding with current description.
     * @memberof ActionDesc
     */
    filter: (action$: Observable<Action>) => Observable<void>;
}
/**
 * Represents an object where each property is an action description.
 * @export
 * @interface ActionMap
 */
export interface ActionMap<S = any> {
    [actionName: string]: ActionDescBase<S>;
}
/**
 * This function creates a full reducer given a partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {PartialReducerOf<S, T>} p The partial reducer function
 * @returns {ReducerOf<S, T>} A full reducer function
 */
export declare const partialReducer: <T, S = any>(p: PartialReducerOf<S, T>) => ReducerOf<S, T>;
/**
 * This function creates full reducer given a simple partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {SimplePartialReducerOf<S, T>} p The simple partial reducer function
 * @returns {SimpleReducerOf<S, T>} A full reducer function
 */
export declare const simpleReducer: <S = any>(p: SimplePartialReducerOf<S>) => SimpleReducerOf<S>;
/**
 * Creates an action description with a typed payload, given a module prefix,
 * an action name and an optional full reducer.
 * @template T The action payload type
 * @template S The state type
 * @param {string} prefix The prefix or module name to prepend to the action
 * name to obtain a unique action type.
 * @param {string} actionName The action name. Should be unique in the prefix.
 * @param {ReducerOf<S, T>} [reducer] An optional reducer function
 * @returns {ActionDesc<T, S>} An action description.
 */
export declare const action: <T = any, S = any>(prefix: string, actionName: string, reducer?: ReducerOf<S, T>) => ActionDesc<T, S>;
/**
 * Creates an action description with no payload, given a module prefix,
 * an action name and an optional full reducer.
 * @template S The state type
 * @param {string} prefix The prefix or module name to prepend to the action
 * name to obtain a unique action type.
 * @param {string} actionName The action name. Should be unique in the prefix.
 * @param {SimpleReducerOf<S>} [aSimpleReducer] An optional simple reducer
 * function.
 * @returns {ActionDescEmpty<S>} An action description.
 */
export declare const actionEmpty: <S = any>(prefix: string, actionName: string, aSimpleReducer?: SimpleReducerOf<S>) => ActionDescEmpty<S>;
/**
 * Creates an action description with a typed payload, given a module prefix,
 * an action name and an optional partial reducer.
 * @template T The action payload type
 * @template S The state type
 * @param {string} prefix The prefix or module name to prepend to the action
 * name to obtain a unique action type.
 * @param {string} actionName The action name. Should be unique in the prefix.
 * @param {PartialReducerOf<S, T>} pReducer An optional partial reducer function
 */
export declare const partial: <T = any, S = any>(prefix: string, actionName: string, pReducer: PartialReducerOf<S, T>) => ActionDesc<T, S>;
/**
 * Creates an action description with no payload, given a module prefix,
 * an action name and an optional simple partial reducer.
 * @template S The state type
 * @param {string} prefix The prefix or module name to prepend to the action
 * name to obtain a unique action type.
 * @param {string} actionName The action name. Should be unique in the prefix.
 * @param {SimplePartialReducerOf<S>} aPartialReducer An optional simple partial
 * reducer function.
 */
export declare const partialEmpty: <S = any>(prefix: string, actionName: string, aPartialReducer: SimplePartialReducerOf<S>) => ActionDescEmpty<S>;
/**
 * Creates a @ngrx/store compatible ActionReducer given an initial sttate and a
 * collection of ActionMaps
 * @template S The state type
 * @param {S} initialState The initial state in case a previous state is
 * undefined.
 */
export declare const makeReducer: <S>(initialState: S) => (...actionGroups: ActionMap<any>[]) => ActionReducer<S, Action>;
/**
 * Create a new ActionMap with the same actions as the given, differing only in
 * the reducers of the actions. This function is useful to react to actions
 * originally defined in other modules, with reducer functions adapted to the
 * state of a current module.
 * @template T The specific type of the ActionsMap
 * @param {T} actions an ActionsMap to override
 * @param {Partial<{ [P in keyof T]: PartialReducerOf<any, any> }>} [newReducers]
 * An object containing full reducers as the values por the properties
 * representing actions you want to override their reducers.
 * @returns {T}
 */
export declare const overrideActions: <T extends ActionMap<S1>, S1, S2>(actions: T, newReducers?: Partial<{
    [P in keyof T]: PartialReducerOf<any, S2>;
}>) => ActionMap<S2>;
