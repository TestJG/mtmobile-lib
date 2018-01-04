import { toKVMap, uuid } from '../utils';
export const task = (kind, payload, uid) => ({
    kind,
    payload,
    uid: uid || uuid(''),
});
/**
 * Creates an instance of a service, from a given processor and service methods,
 * where each call to * service.method(payload) is implemented as
 * processor.process({ kind: 'method', payload, uid }).
 */
export const fromProcessorToService = (processor, methodNames) => toKVMap(methodNames.map(key => {
    const func = payload => processor.process({ kind: key, payload, uid: uuid() });
    return [key, func];
}));
//# sourceMappingURL=processor.interfaces.js.map