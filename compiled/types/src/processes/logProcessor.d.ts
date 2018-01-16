import { IProcessor, IProcessorCore, TaskItem } from './processor.interfaces';
export declare function logProcessor(processor: IProcessor): IProcessor;
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
export declare const defaultTaskFormatter: (maxPayloadLength?: number) => (item: TaskItem) => string;
export declare const defaultValueFormatter: (maxValueLength?: number) => (v: any, item: TaskItem) => string;
export declare function logProcessorCore<T extends IProcessorCore>(processor: T, options?: Partial<LogProcessorCoreOptions>): T;
