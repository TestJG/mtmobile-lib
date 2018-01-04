import { Subject } from 'rxjs';
import { uuid } from '../utils/common';
export const createBackgroundWorker = (opts) => {
    opts.processor.onFinished$.subscribe({
        complete: () => {
            opts.terminate();
        }
    });
    const process = (item) => {
        switch (item.kind) {
            case 'process': {
                opts.processor.process(item.task).subscribe({
                    next: v => opts.postMessage({
                        kind: 'N',
                        uid: item.uid,
                        valueOrError: v
                    }),
                    error: err => opts.postMessage({
                        kind: 'E',
                        uid: item.uid,
                        valueOrError: err
                    }),
                    complete: () => opts.postMessage({
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
export const createForegroundWorker = (opts) => {
    const worker = opts.createWorker();
    const run = opts.run || ((f) => f());
    let status = 'open';
    const terminateUUID = uuid();
    const terminateSub = new Subject();
    const terminate$ = terminateSub.asObservable();
    terminateSub.subscribe({
        complete: () => {
            status = 'closed';
            run(() => worker.terminate());
            // worker.terminate();
        }
    });
    const observers = new Map();
    observers.set(terminateUUID, terminateSub);
    const isAlive = () => status === 'open';
    const finish = () => {
        if (status === 'open') {
            status = 'closing';
            worker.postMessage({
                kind: 'terminate',
                uid: terminateUUID
            });
        }
        return terminate$;
    };
    const process = (task) => {
        const id = uuid();
        const sub = new Subject();
        const obs$ = sub.asObservable();
        observers.set(id, sub);
        worker.postMessage({
            kind: 'process',
            uid: id,
            task
        });
        return obs$;
    };
    worker.onmessage = msg => {
        const resp = msg.data;
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
//# sourceMappingURL=worker-processor.js.map