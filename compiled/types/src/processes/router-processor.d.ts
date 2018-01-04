import { IProcessor, IProcessorCore } from './processor.interfaces';
export interface RouterProcessorOptions {
    caption: string;
    routeSeparator: string;
}
export declare function startRouterProcessor(routes: {
    [prefix: string]: IProcessor;
}, opts?: Partial<RouterProcessorOptions>): IProcessor;
export interface RouterProxyOptions {
    routeSeparator: string;
}
export declare function startRouterProxy(processor: IProcessorCore, prefix: string, opts?: Partial<RouterProxyOptions>): IProcessorCore;
