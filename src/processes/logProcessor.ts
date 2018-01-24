import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
import { Observable } from 'rxjs';
import { capString } from '../utils/common';

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
        console.log(`(${processor.caption}) COMPLETE :`, JSON.stringify(t))
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
    taskFormatter: (item: TaskItem, showPayload: boolean) => string;
    valueFormatter: (value: any, item: TaskItem) => string;
    errorFormatter: (error: any, item: TaskItem) => string;
}

export const defaultTaskFormatter = (
    maxPayloadLength: number = 60,
    maxTaskIdLength: number = undefined
) => (item: TaskItem, showPayload: boolean) => {
    let payload =
        showPayload && item.payload && maxPayloadLength
            ? JSON.stringify(item.payload)
            : '';
    if (maxPayloadLength && payload) {
        payload = capString(payload, maxPayloadLength);
    }
    if (payload) {
        payload = ` ${payload}`;
    }

    let taskId = item.uid;
    if (maxTaskIdLength && taskId) {
        taskId = capString(taskId, maxTaskIdLength, '');
    }
    if (taskId) {
        taskId = ` [${taskId}]`;
    }
    return `${item.kind}${taskId}${payload}`;
};

export const defaultValueFormatter = (maxValueLength = 60) => (value: any) =>
    capString(JSON.stringify(value), maxValueLength);

export const defaultErrorFormatter = (showStack: boolean = true) => (
    error: any
) => {
    if (error instanceof Error) {
        let result = `${error.name || 'Error'}: ${error.message ||
            '(no message)'}`;
        if (error.stack && showStack) {
            result = result + '\n' + error.stack;
        }
        return result;
    }
    return undefined;
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
            showPayloads: true,
            caption: (<any>processor).caption || 'Log',
            preCaption: '',
            // taskFormatter: defaultTaskFormatter(60),
            // valueFormatter: defaultValueFormatter(30),
            // errorFormatter: defaultErrorFormatter(true)
        },
        options
    );

    if (!options.taskFormatter) {
        options.taskFormatter = defaultTaskFormatter(60);
    }
    if (!options.valueFormatter) {
        options.valueFormatter = defaultValueFormatter(30);
    }
    if (!options.errorFormatter) {
        options.errorFormatter = defaultErrorFormatter(true);
    }

    if (opts.disabled) {
        return processor;
    }

    const process = (item: TaskItem): Observable<any> => {
        if (opts.processDisabled) {
            return processor.process(item);
        } else {
            const msg = opts.taskFormatter(item, opts.showPayloads);
            const print = op =>
                `${opts.preCaption}${opts.caption}: ${op} process. ${msg}`;
            console.log(`${print('START')}`);
            let result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: x =>
                        console.log(
                            `${print('NEXT ')} VAL: ${opts.valueFormatter(x)}`
                        ),
                    error: x =>
                        console.log(
                            `${print('ERROR')} ERR: ${opts.errorFormatter(x) ||
                                opts.valueFormatter(x)}`
                        ),
                    complete: () => console.log(`${print('COMPL')}`)
                });
            }
            return result;
        }
    };

    const isAlive = (): boolean => {
        if (opts.isAliveDisabled) {
            return processor.isAlive();
        } else {
            const print = op =>
                `${opts.preCaption}${opts.caption}: ${op} isAlive.`;
            const result = processor.isAlive();
            console.log(`${print('START')}: ${result ? 'isAlive' : 'isDead'}`);
            return result;
        }
    };

    const finish = (): Observable<void> => {
        if (opts.finishDisabled) {
            return processor.finish();
        } else {
            const print = op =>
                `${opts.preCaption}${opts.caption}: ${op} finish.`;
            console.log(print('START'));
            let result = processor.finish();
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: () => console.log(print('NEXT')),
                    error: x =>
                        console.log(
                            `${print('ERROR')} ${opts.errorFormatter(x) ||
                                opts.valueFormatter(x)}`
                        ),
                    complete: () => console.log(print('COMPLETE'))
                });
            }
            return result;
        }
    };

    return Object.assign({}, processor, { process, isAlive, finish });
}
