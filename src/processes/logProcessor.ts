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
}

export function logProcessorCore(
    processor: IProcessorCore,
    options?: Partial<LogProcessorCoreOptions>
): IProcessorCore {
    const opts = Object.assign(
        {
            disabled: false,
            processDisabled: false,
            isAliveDisabled: false,
            finishDisabled: false,
            basicProcessLog: true,
            caption: 'Log'
        },
        options
    );

    const process = (item: TaskItem): Observable<any> => {
        if (opts.disabled || opts.processDisabled) {
            return processor.process(item);
        } else {
            console.log(
                `${opts.caption}: START process of ${item.kind} [${item.uid}]`
            );
            let result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: x => {
                        console.log(
                            `${opts.caption}: NEXT process of ${item.kind} [${
                                item.uid
                            }]: ${JSON.stringify(x)}`
                        );
                    },
                    error: x => {
                        console.log(
                            `${opts.caption}: ERROR process of ${item.kind} [${
                                item.uid
                            }]: ${x}`
                        );
                    },
                    complete: () => {
                        console.log(
                            `${opts.caption}: COMPLETE process of ${
                                item.kind
                            } [${item.uid}]`
                        );
                    }
                });
            }
            console.log(
                `${opts.caption}: END process of ${item.kind} [${item.uid}]`
            );
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
