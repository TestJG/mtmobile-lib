"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
/**
 * This function creates a full reducer given a partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {PartialReducerOf<S, T>} p The partial reducer function
 * @returns {ReducerOf<S, T>} A full reducer function
 */
exports.partialReducer = function (p) {
    return !p
        ? undefined
        : function (state, payload) {
            var changes = p(state, payload);
            // If false or the same state is returned, then do not alter the state
            if (changes && changes !== state) {
                if (changes instanceof Array) {
                    return common_1.assignOrSame.apply(void 0, [state].concat(changes));
                }
                else if (changes === true) {
                    return state;
                }
                else {
                    return common_1.assignOrSame(state, changes);
                }
            }
            else {
                return state;
            }
        };
};
/**
 * This function creates full reducer given a simple partial reducer.
 * @template T Is the type of action payload to act on
 * @template S Is the type of state to act on
 * @param {SimplePartialReducerOf<S, T>} p The simple partial reducer function
 * @returns {SimpleReducerOf<S, T>} A full reducer function
 */
exports.simpleReducer = function (p) {
    if (!p) {
        return undefined;
    }
    var temp = exports.partialReducer(p);
    return function (state) { return temp(state, undefined); };
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
exports.action = function (prefix, actionName, reducer) {
    var type = common_1.joinStr(':', [prefix, actionName]);
    var create = function (payload) { return ({ type: type, payload: payload }); };
    reducer = reducer || common_1.id;
    var is = function (a) { return a.type && a.type === type; };
    var filter = function (actions) {
        return actions.filter(is).map(function (a) { return a.payload; });
    };
    var result = Object.assign(create, {
        actionName: actionName,
        type: type,
        prefix: prefix,
        hasPayload: true,
        reducer: reducer,
        filter: filter,
        is: is
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
exports.actionEmpty = function (prefix, actionName, aSimpleReducer) {
    var type = common_1.joinStr(':', [prefix, actionName]);
    var create = function () { return ({ type: type }); };
    var reducer = aSimpleReducer || common_1.id;
    var is = function (a) { return a.type && a.type === type; };
    var filter = function (actions) {
        return actions.filter(is).map(function () { return null; });
    };
    var result = Object.assign(create, {
        actionName: actionName,
        type: type,
        prefix: prefix,
        hasPayload: false,
        reducer: reducer,
        filter: filter,
        is: is
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
exports.partial = function (prefix, actionName, pReducer) { return exports.action(prefix, actionName, exports.partialReducer(pReducer)); };
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
exports.partialEmpty = function (prefix, actionName, aPartialReducer) { return exports.actionEmpty(prefix, actionName, exports.simpleReducer(aPartialReducer)); };
/**
 * Creates a @ngrx/store compatible ActionReducer given an initial sttate and a
 * collection of ActionMaps
 * @template S The state type
 * @param {S} initialState The initial state in case a previous state is
 * undefined.
 */
exports.makeReducer = function (initialState) { return function () {
    var actionGroups = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actionGroups[_i] = arguments[_i];
    }
    var byType = new Map();
    actionGroups.forEach(function (actions) {
        return Object.keys(actions).forEach(function (key) {
            return byType.set(actions[key].type, actions[key].reducer);
        });
    });
    return function (s, a) {
        if (s === void 0) { s = initialState; }
        return (byType.get(a.type) || common_1.id)(s, a['payload']);
    };
}; };
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
exports.overrideActions = function (actions, newReducers) {
    return common_1.objMapValues(function (def, key) {
        var newReducer = newReducers && newReducers[key] ? newReducers[key] : common_1.id;
        return def.hasPayload
            ? exports.partial(def.prefix, def.actionName, newReducer)
            : exports.partialEmpty(def.prefix, def.actionName, function (s) {
                return newReducer(s, undefined);
            });
    })(actions);
};
//# sourceMappingURL=redux.js.map