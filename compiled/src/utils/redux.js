import { objMapValues, joinStr, id, assignOrSame } from './common';
/**
 * This function creates a full reducer given a partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {PartialReducerOf<S, T>} p The partial reducer function
 * @returns {ReducerOf<S, T>} A full reducer function
 */
export const partialReducer = (p) => !p
    ? undefined
    : (state, payload) => {
        const changes = p(state, payload);
        // If false or the same state is returned, then do not alter the state
        if (changes && changes !== state) {
            if (changes instanceof Array) {
                return assignOrSame(state, ...changes);
            }
            else if (changes === true) {
                return state;
            }
            else {
                return assignOrSame(state, changes);
            }
        }
        else {
            return state;
        }
    };
/**
 * This function creates full reducer given a simple partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {SimplePartialReducerOf<S, T>} p The simple partial reducer function
 * @returns {SimpleReducerOf<S, T>} A full reducer function
 */
export const simpleReducer = (p) => {
    if (!p) {
        return undefined;
    }
    const temp = partialReducer(p);
    return (state) => temp(state, undefined);
};
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
export const action = (prefix, actionName, reducer) => {
    const type = joinStr(':', [prefix, actionName]);
    const create = (payload) => ({ type, payload });
    reducer = reducer || id;
    const is = (a) => a.type && a.type === type;
    const filter = (actions) => actions.filter(is).map(a => a.payload);
    const result = Object.assign(create, {
        actionName,
        type,
        prefix,
        hasPayload: true,
        reducer,
        filter,
        is
    });
    return result;
};
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
export const actionEmpty = (prefix, actionName, aSimpleReducer) => {
    const type = joinStr(':', [prefix, actionName]);
    const create = () => ({ type });
    const reducer = aSimpleReducer || id;
    const is = (a) => a.type && a.type === type;
    const filter = (actions) => actions.filter(is).map(() => null);
    const result = Object.assign(create, {
        actionName,
        type,
        prefix,
        hasPayload: false,
        reducer,
        filter,
        is
    });
    return result;
};
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
export const partial = (prefix, actionName, pReducer) => action(prefix, actionName, partialReducer(pReducer));
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
export const partialEmpty = (prefix, actionName, aPartialReducer) => actionEmpty(prefix, actionName, simpleReducer(aPartialReducer));
/**
 * Creates a @ngrx/store compatible ActionReducer given an initial sttate and a
 * collection of ActionMaps
 * @template S The state type
 * @param {S} initialState The initial state in case a previous state is
 * undefined.
 */
export const makeReducer = (initialState) => (...actionGroups) => {
    const byType = new Map();
    actionGroups.forEach(actions => Object.keys(actions).forEach(key => byType.set(actions[key].type, actions[key].reducer)));
    return (s = initialState, a) => (byType.get(a.type) || id)(s, a['payload']);
};
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
export const overrideActions = (actions, newReducers) => objMapValues((def, key) => {
    const newReducer = newReducers && newReducers[key] ? newReducers[key] : id;
    return def.hasPayload
        ? partial(def.prefix, def.actionName, newReducer)
        : partialEmpty(def.prefix, def.actionName, s => newReducer(s, undefined));
})(actions);
//# sourceMappingURL=redux.js.map