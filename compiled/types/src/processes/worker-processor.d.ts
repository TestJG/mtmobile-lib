import { Observable } from 'rxjs/Observable';
import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
export interface WorkerItem {
    kind: 'process' | 'terminate' | 'unsubscribe';
    uid: string;
    task?: TaskItem;
}
export interface WorkerItemResponse {
    kind: 'N' | 'C' | 'E';
    uid: string;
    valueOrError?: any;
}
export declare const createBackgroundWorker: (opts: {
    processor: Observable<IProcessor>;
    postMessage: (message: any, transfer?: any[]) => void;
    terminate: () => void;
}) => {
    process: (item: WorkerItem) => void;
};
export interface SimpleWorker {
    onmessage: (msg: WorkerItemResponse) => void;
    postMessage: (msg: WorkerItem) => void;
    terminate: () => void;
}
export declare const createForegroundWorker: (opts: {
    createWorker: () => SimpleWorker;
    run?: (f: () => void) => void;
    caption?: string;
}) => IProcessorCore;
