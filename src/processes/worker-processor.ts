import { Observable, Subject } from 'rxjs';
import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
import { uuid } from '../utils/common';

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

export const createBackgroundWorker = (opts: {
    processor: IProcessor;
    postMessage: typeof Worker.prototype.postMessage;
    terminate: typeof Worker.prototype.terminate;
}) => {
    opts.processor.onFinished$.subscribe({
        complete: () => {
            opts.terminate();
        }
    });

    const process = (item: WorkerItem) => {
        switch (item.kind) {
            case 'process': {
                opts.processor.process(item.task).subscribe({
                    next: v =>
                        opts.postMessage(<WorkerItemResponse>{
                            kind: 'N',
                            uid: item.uid,
                            valueOrError: v
                        }),
                    error: err =>
                        opts.postMessage(<WorkerItemResponse>{
                            kind: 'E',
                            uid: item.uid,
                            valueOrError: err
                        }),
                    complete: () =>
                        opts.postMessage(<WorkerItemResponse>{
                            kind: 'C',
                            uid: item.uid
                        })
                });
                break;
            }

            case 'terminate': {
                opts.processor.finish().subscribe();
                break;
            }

            default:
                throw new Error('Unknown WorkerItem type: ' + item.kind);
        }
    };

    return { process };
};

export interface SimpleWorker {
    onmessage: typeof Worker.prototype.onmessage;
    postMessage: typeof Worker.prototype.postMessage;
    terminate: typeof Worker.prototype.terminate;
}

export const createForegroundWorker = (opts: {
    createWorker: () => SimpleWorker;
    run?: (f: () => void) => void;
}): IProcessorCore => {
    const worker = opts.createWorker();
    const run = opts.run || ((f: () => void) => f());

    let status = 'open';
    const terminateUUID = uuid();
    const terminateSub = new Subject<any>();
    const terminate$ = terminateSub.asObservable();
    terminateSub.subscribe({
        complete: () => {
            status = 'closed';
            run(() => worker.terminate());
            // worker.terminate();
        }
    });

    const observers = new Map<string, Subject<any>>();
    observers.set(terminateUUID, terminateSub);

    const isAlive = () => status === 'open';

    const finish = () => {
        if (status === 'open') {
            status = 'closing';
            worker.postMessage(<WorkerItem>{
                kind: 'terminate',
                uid: terminateUUID
            });
        }
        return terminate$;
    };

    const process = (task: TaskItem): Observable<any> => {
        const id = uuid();
        const sub = new Subject<any>();
        const obs$ = sub.asObservable();
        observers.set(id, sub);
        worker.postMessage(<WorkerItem>{
            kind: 'process',
            uid: id,
            task
        });
        return obs$;
    };

    worker.onmessage = msg => {
        const resp = <WorkerItemResponse>msg.data;
        const obs = observers.get(resp.uid);
        if (!!obs) {
            switch (resp.kind) {
                case 'N':
                    run(() => obs.next(resp.valueOrError));
                    break;
                case 'E':
                    run(() => obs.error(resp.valueOrError));
                    observers.delete(resp.uid);
                    break;
                case 'C':
                    run(() => obs.complete());
                    observers.delete(resp.uid);
                    break;
            }
        }
    };

    return {
        process,
        isAlive,
        finish
    };
};
