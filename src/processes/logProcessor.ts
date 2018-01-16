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
    taskFormatter: (item: TaskItem) => string;
    valueFormatter: (v: any, item: TaskItem) => string;
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

export const defaultValueFormatter = (maxValueLength = 30) => (
    v: any, item: TaskItem
) => {
    let value = maxValueLength ? JSON.stringify(v) : undefined;
    if (maxValueLength && value && value.length > maxValueLength) {
        value = ' ' + value.substr(0, maxValueLength - 3) + '...';
    }
    return value;
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
            taskFormatter: defaultTaskFormatter(60),
            valueFormatter: defaultValueFormatter(30)
        },
        options
    );

    const process = (item: TaskItem): Observable<any> => {
        if (opts.disabled || opts.processDisabled) {
            return processor.process(item);
        } else {
            const msg = opts.taskFormatter(item);
            console.log(`${opts.caption}: START process. ${msg}`);
            let result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: x => {
                        console.log(`${opts.caption}: NEXT process. ${msg}`, x);
                    },
                    error: x => {
                        console.log(`${opts.caption}: ERROR process. ${msg}`, x);
                    },
                    complete: () => {
                        console.log(
                            `${opts.caption}: COMPLETE process. ${msg}`
                        );
                    }
                });
            }
            return result;
        }
    };

    const isAlive = (): boolean => {
        if (opts.disabled || opts.isAliveDisabled) {
            return processor.isAlive();
        } else {
            console.log(`${opts.caption}: START isAlive`);
            const result = processor.isAlive();
            console.log(`${opts.caption}: END isAlive: ${result}`);
            return result;
        }
    };

    const finish = (): Observable<void> => {
        if (opts.disabled || opts.finishDisabled) {
            return processor.finish();
        } else {
            console.log(`${opts.caption}: START finish`);
            let result = processor.finish();
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: () => {
                        console.log(`${opts.caption}: NEXT finish`);
                    },
                    error: x => {
                        console.log(`${opts.caption}: ERROR finish`);
                    },
                    complete: () => {
                        console.log(`${opts.caption}: COMPLETE finish`);
                    }
                });
            }
            console.log(`${opts.caption}: END finish`);
            return result;
        }
    };

    return Object.assign({}, processor, { process, isAlive, finish });
}
