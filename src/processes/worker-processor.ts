import { Observable, Subject, Observer, Subscription } from 'rxjs';
import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
import { uuid } from '../utils/common';

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

    const subscriptions = new Map<string, Subscription>();

    const process = (item: WorkerItem) => {
        switch (item.kind) {
            case 'process': {
                const subs = opts.processor.process(item.task).subscribe({
                    next: v =>
                        opts.postMessage(
                            <WorkerItemResponse>{
                                kind: 'N',
                                uid: item.uid,
                                valueOrError: v
                            }
                        ),
                    error: err => {
                        subscriptions.delete(item.uid);
                        opts.postMessage(
                            <WorkerItemResponse>{
                                kind: 'E',
                                uid: item.uid,
                                valueOrError: err
                            }
                        );
                    },
                    complete: () => {
                        subscriptions.delete(item.uid);
                        opts.postMessage(
                            <WorkerItemResponse>{
                                kind: 'C',
                                uid: item.uid
                            }
                        );
                    }
                });
                subscriptions.set(item.uid, subs);
                break;
            }

            case 'unsubscribe': {
                const subs = subscriptions.get(item.uid);
                if (subs) {
                    subs.unsubscribe();
                    subscriptions.delete(item.uid);
                }
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
    onmessage: (msg: WorkerItemResponse) => void;
    postMessage: (msg: WorkerItem) => void;
    terminate: () => void;
}

export const createForegroundWorker = (opts: {
    createWorker: () => SimpleWorker;
    run?: (f: () => void) => void;
    caption?: string;
}): IProcessorCore => {
    const worker = opts.createWorker();
    const run = opts.run || (f => f());
    const caption = opts.caption || 'worker';

    let status = 'open';
    const terminateUUID = uuid();
    const terminateSub = new Subject<any>();
    const terminate$ = terminateSub.asObservable();
    const terminateSubscription = terminateSub.subscribe({
        complete: () => {
            status = 'closed';
            run(() => worker.terminate());
            terminateSubscription.unsubscribe();
        }
    });

    const observers = new Map<string, Subject<any>>();

    const isAlive = () => status === 'open';

    const finish = () => {
        if (status === 'open') {
            status = 'closing';
            worker.postMessage(
                <WorkerItem>{
                    kind: 'terminate',
                    uid: terminateUUID
                }
            );
        }
        return terminate$;
    };

    const process = (task: TaskItem): Observable<any> => {
        const result = <Observable<
            any
        >>Observable.create((o: Observer<any>) => {
            const id = uuid();
            const sub = new Subject<any>();
            const obs$ = sub.asObservable();
            observers.set(id, sub);
            worker.postMessage({ kind: 'process', uid: id, task });
            const subs = obs$.subscribe({
                next: x => o.next(x),
                error: e => o.error(e),
                complete: () => o.complete()
            });

            return () => {
                subs.unsubscribe();
                worker.postMessage({ kind: 'unsubscribe', uid: id });
            };
        });
        return result;
    };

    worker.onmessage = resp => {
        if (resp.uid === terminateUUID) {
            if (resp.kind === 'C') {
                run(() => terminateSub.complete());
            }
        } else {
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
        }
    };

    return {
        process,
        isAlive,
        finish
    };
};
