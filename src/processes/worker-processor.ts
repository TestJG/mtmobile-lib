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
    return {
        process: (item: WorkerItem) => {
            if (item.kind === 'process') {
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
            } else if (item.kind === 'terminate') {
                opts.processor.finish().subscribe();
            }
        }
    };
};

export const createForegroundWorker = (opts: {
    workerScript: string;
}): IProcessorCore => {
    const worker = new Worker(opts.workerScript);

    let status = 'open';
    const terminateUUID = uuid();
    const terminateSub = new Subject<any>();
    const terminate$ = terminateSub.asObservable();
    terminateSub.subscribe({
        complete: () => {
            status = 'closed';
            worker.terminate();
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
                    obs.next(resp.valueOrError);
                    break;
                case 'E':
                    obs.error(resp.valueOrError);
                    observers.delete(resp.uid);
                    break;
                case 'C':
                    obs.complete();
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