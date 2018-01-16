import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
import { Observable } from 'rxjs';

export function logProcessor(processor: IProcessor) {
    processor.onTaskStarted$.subscribe(t =>
        console.log(`(${processor.caption}) START :`, JSON.stringify(t))
    );
    processor.onTaskReStarted$.subscribe(t =>
        console.log(`(${processor.caption}) RETRY :`, JSON.stringify(t))
    );
    processor.onTaskResult$.subscribe(t =>
        console.log(`(${processor.caption}) RESULT:`, JSON.stringify(t))
    );
    processor.onTaskError$.subscribe(t =>
        console.log(`(${processor.caption}) ERROR :`, JSON.stringify(t))
    );
    processor.onTaskCompleted$.subscribe(t =>
        console.log(`(${processor.caption}) COMPL :`, JSON.stringify(t))
    );
    processor.onFinished$.subscribe(() =>
        console.log(`(${processor.caption}) FINISHED`)
    );
    return processor;
}

export interface LogProcessorCoreOptions {
    disabled: boolean;
    processDisabled: boolean;
    isAliveDisabled: boolean;
    finishDisabled: boolean;
    basicProcessLog: boolean;
    caption: string;
    preCaption: string;
    taskFormatter: (item: TaskItem) => string;
}

export const defaultTaskFormatter = (maxPayloadLength = 60) => (
    item: TaskItem
) => {
    let payload =
        item.payload && maxPayloadLength
            ? JSON.stringify(item.payload)
            : undefined;
    if (maxPayloadLength && payload && payload.length > maxPayloadLength) {
        payload = ' ' + payload.substr(0, maxPayloadLength - 3) + '...';
    }
    return `${item.kind} [${item.uid}]${payload}`;
};

export function logProcessorCore<T extends IProcessorCore>(
    processor: T,
    options?: Partial<LogProcessorCoreOptions>
): T {
    const opts = Object.assign(
        {
            disabled: false,
            processDisabled: false,
            isAliveDisabled: false,
            finishDisabled: false,
            basicProcessLog: false,
            caption: (<any>processor).caption || 'Log',
            preCaption: '',
            taskFormatter: defaultTaskFormatter(60)
        },
        options
    );

    const process = (item: TaskItem): Observable<any> => {
        if (opts.disabled || opts.processDisabled) {
            return processor.process(item);
        } else {
            const msg = opts.taskFormatter(item);
            const print = (op) =>
                `${opts.preCaption}${opts.caption}: ${op} process.`;
            console.log(print('START'), msg);
            let result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: x => console.log(print('NEXT'), x, msg),
                    error: x => console.log(print('ERROR'), x, msg),
                    complete: () => console.log(print('COMPLETE'), msg),
                });
            }
            return result;
        }
    };

    const isAlive = (): boolean => {
        if (opts.disabled || opts.isAliveDisabled) {
            return processor.isAlive();
        } else {
            const print = (op) =>
                `${opts.preCaption}${opts.caption}: ${op} isAlive.`;
            const result = processor.isAlive();
            console.log(print('START'), result);
            return result;
        }
    };

    const finish = (): Observable<void> => {
        if (opts.disabled || opts.finishDisabled) {
            return processor.finish();
        } else {
            const print = (op) =>
                `${opts.preCaption}${opts.caption}: ${op} finish.`;
            console.log(print('START'));
            let result = processor.finish();
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: () => console.log(print('NEXT')),
                    error: x => console.log(print('ERROR'), x),
                    complete: () => console.log(print('COMPLETE'))
                });
            }
            return result;
        }
    };

    return Object.assign({}, processor, { process, isAlive, finish });
}
