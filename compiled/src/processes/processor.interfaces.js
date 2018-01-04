"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
exports.task = function (kind, payload, uid) { return ({
    kind: kind,
    payload: payload,
    uid: uid || utils_1.uuid(''),
}); };
/**
 * Creates an instance of a service, from a given processor and service methods,
 * where each call to * service.method(payload) is implemented as
 * processor.process({ kind: 'method', payload, uid }).
 */
exports.fromProcessorToService = function (processor, methodNames) {
    return utils_1.toKVMap(methodNames.map(function (key) {
        var func = function (payload) {
            return processor.process({ kind: key, payload: payload, uid: utils_1.uuid() });
        };
        return [key, func];
    }));
};
//# sourceMappingURL=processor.interfaces.js.map