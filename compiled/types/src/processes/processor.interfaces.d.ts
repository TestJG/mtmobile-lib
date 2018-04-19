import { Observable } from 'rxjs/Observable';
export interface TaskItem {
    kind: string;
    payload?: any;
    uid?: string;
}
export interface IProcessorCore {
    process(item: TaskItem): Observable<any>;
    isAlive(): boolean;
    finish(): Observable<void>;
}
export interface IProcessor extends IProcessorCore {
    readonly caption: string;
    readonly onFinished$: Observable<void>;
    readonly onTaskStarted$: Observable<TaskItem>;
    readonly onTaskReStarted$: Observable<TaskItem>;
    readonly onTaskResult$: Observable<[TaskItem, any]>;
    readonly onTaskError$: Observable<[TaskItem, any]>;
    readonly onTaskCompleted$: Observable<TaskItem>;
}
export declare const task: (kind: string, payload?: any, uid?: string) => TaskItem;
/**
 * Creates an instance of a service, from a given processor and service methods,
 * where each call to * service.method(payload) is implemented as
 * processor.process({ kind: 'method', payload, uid }).
 */
export declare const fromProcessorToService: <T = any>(processor: IProcessorCore, methodNames: string[]) => T;
