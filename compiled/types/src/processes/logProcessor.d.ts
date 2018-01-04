import { IProcessor, IProcessorCore } from './processor.interfaces';
export declare function logProcessor(processor: IProcessor): IProcessor;
export interface LogProcessorCoreOptions {
    disabled: boolean;
    processDisabled: boolean;
    isAliveDisabled: boolean;
    finishDisabled: boolean;
    basicProcessLog: boolean;
    caption: string;
}
export declare function logProcessorCore(processor: IProcessorCore, options?: Partial<LogProcessorCoreOptions>): IProcessorCore;
