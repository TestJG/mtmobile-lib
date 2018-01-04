import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
export interface WorkerItem {
    kind: 'process' | 'terminate';
    uid: string;
    task?: TaskItem;
}
export interface WorkerItemResponse {
    kind: 'N' | 'C' | 'E';
    uid: string;
    valueOrError?: any;
}
export declare const createBackgroundWorker: (opts: {
    processor: IProcessor;
    postMessage: (message: any, transfer?: any[]) => void;
    terminate: () => void;
}) => {
    process: (item: WorkerItem) => void;
};
export interface SimpleWorker {
    onmessage: typeof Worker.prototype.onmessage;
    postMessage: typeof Worker.prototype.postMessage;
    terminate: typeof Worker.prototype.terminate;
}
export declare const createForegroundWorker: (opts: {
    createWorker: () => SimpleWorker;
    run?: (f: () => void) => void;
}) => IProcessorCore;
