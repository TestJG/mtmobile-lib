"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
exports.partialReducer = function (p) {
    return !p
        ? undefined
        : function (state, payload) {
            var changes = p(state, payload);
            // If false or the same state is returned, then do not alter the state
            if (changes && changes !== state) {
                if (changes instanceof Array) {
                    return Object.assign.apply(Object, [{}, state].concat(changes));
                }
                else {
                    return Object.assign({}, state, changes);
                }
            }
            else {
                return state;
            }
        };
};
exports.simpleReducer = function (p) {
    return !p
        ? undefined
        : function (state) {
            var changes = p(state);
            // If false or the same state is returned, then do not alter the state
            if (changes && changes !== state) {
                return Object.assign({}, state, changes);
            }
            else {
                return state;
            }
        };
};
exports.action = function (prefix, name, reducer) {
    var type = common_1.joinStr(':', [prefix, name]);
    var create = function (payload) { return ({ type: type, payload: payload }); };
    reducer = reducer || common_1.id;
    var is = function (a) { return a.type === type; };
    var filter = function (actions) {
        return actions.filter(is).map(function (a) { return a.payload; });
    };
    var result = Object.assign(create, {
        name: name,
        type: type,
        prefix: prefix,
        create: create,
        reducer: reducer,
        filter: filter,
        is: is
    });
    return result;
};
exports.actionEmpty = function (prefix, name, aSimpleReducer) {
    var type = common_1.joinStr(':', [prefix, name]);
    var create = function () { return ({ type: type }); };
    var reducer = aSimpleReducer || common_1.id;
    var is = function (a) { return a.type === type; };
    var filter = function (actions) {
        return actions.filter(is).map(function () { return null; });
    };
    var result = Object.assign(create, {
        name: name,
        type: type,
        prefix: prefix,
        create: create,
        reducer: reducer,
        filter: filter,
        is: is
    });
    return result;
};
exports.partial = function (prefix, name, pReducer) { return exports.action(prefix, name, exports.partialReducer(pReducer)); };
exports.partialEmpty = function (prefix, name, aPartialReducer) { return exports.actionEmpty(prefix, name, exports.simpleReducer(aPartialReducer)); };
exports.overrideActions = function (actions, newReducers) {
    return common_1.objMapValues(function (def, key) {
        return common_1.assign(actions[key], {
            reducer: (newReducers || {})[key] || common_1.id
        });
    })(actions);
};
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
