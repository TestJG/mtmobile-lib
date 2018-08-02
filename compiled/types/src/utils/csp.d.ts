import { Observable, Observer } from 'rxjs';
import { LogOpts, Logger } from './common';
export declare const isChan: (value: any) => boolean;
export declare const isInstruction: (value: any) => any;
export declare const promiseOf: (value: any) => any;
export declare const protectChan: (name: string) => (ch: any) => any;
export declare type ToChanOptions = {
    bufferOrN;
    transducer;
    exHandler;
    keepOpen: boolean;
    includeErrors: boolean;
    nullReplacement: any;
} & LogOpts;
export declare const bufferedObserver: (options?: Partial<ToChanOptions>) => Observer<any> & {
    channel: any;
} & Logger;
export declare const generatorToChan: (gen: any, options?: Partial<ToChanOptions>) => any;
export declare const iterableToChan: (iterable: any, options?: Partial<ToChanOptions>) => any;
export declare const promiseToChan: (promise: Promise<any>, options?: Partial<ToChanOptions>) => any;
export declare const observableToChan: (obs: Observable<any>, options?: Partial<ToChanOptions>) => any;
export declare const firstToChan: (obs: Observable<any>, options?: Partial<ToChanOptions>) => any;
export declare const toChan: (source: any, options?: Partial<ToChanOptions>) => any;
export declare const toYielder: (source: any) => any;
export declare const chanToObservable: <T>(ch: any, options?: Partial<LogOpts>) => Observable<T> & Logger;
export interface PingHandler {
    release: () => any;
    finishedProm: any;
}
export declare const startPinging: (pingCh: any, pingTimeMilliseconds: number, options?: Partial<{
    pingAsync: boolean;
    autoClose: boolean;
} & LogOpts>) => PingHandler & Logger;
export interface LeaseHandler {
    release: () => any;
    pingCh: any;
    startedProm: any;
    finishedProm: any;
}
/**
 * Starts a leasing process that works like so:
 * - A leaseFn is used to borrow a lease for a given duration in seconds.
 *   Upon failure to get the lease the process stops.
 * - Every timeout seconds, a ping is expected from outside the leasing process,
 *   through the channel pingCh. If at least one ping arrives by that time,
 *   the lease is tried to be renewed, otherwise the lease is released and the
 *   process stops.
 * -
 * @param leaseFn   A leasing function to perform a lease for a given amount of
 *                  time. This is a client defined operation. It should accept a
 *                  duration in seconds and return a channel that returns
 *                  true or false whether the lease was acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease was reserved, to ensure
 *                  release.
 * @param options   - leaseTimeoutSecs: Represents the lease time in seconds.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  subtract from leaseTimeoutSecs to consider that the client
 *                  will not issue a ping in time.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 */
export declare const startLeasing: (leaseFn: (leaseTimeSecs: number) => any, releaseFn: () => any, options?: Partial<{
    leaseTimeoutSecs: number;
    leaseMarginSecs: number;
} & LogOpts>) => LeaseHandler & Logger;
export interface PipelineNodeHandler {
    startedProm: any;
    finishedProm: any;
    input: (value: any) => any;
    cancel: () => void;
    release: () => any;
}
export declare const runPipelineNode: (opts: {
    process: (value: any) => any;
} & Partial<{
    inputCh?: any;
    initialValues?: any;
} & LogOpts>) => PipelineNodeHandler & Logger;
export declare class PipelineSequenceTarget {
    value: any;
    name?: string;
    index?: number;
    offset?: number;
    constructor(value: any, options?: {
        name: string;
    } | {
        index: number;
    } | {
        offset: number;
    });
    static fromValue(value: any, factory?: (value: any) => PipelineSequenceTarget): PipelineSequenceTarget;
    selectWith<T = any, R = any>(dict: Map<string, T>, arr: T[], currentIndex: number, foundFn: (node: T) => R, notFoundFn: (lastIndex: boolean) => R): R;
    select<T = any>(dict: Map<string, T>, arr: T[], currentIndex: number): T;
    toString(): string;
}
export declare const toNamedTarget: (value: any, name: string) => PipelineSequenceTarget;
export declare const toIndexedTarget: (value: any, index: number) => PipelineSequenceTarget;
export declare const toOffsetTarget: (value: any, offset: number) => PipelineSequenceTarget;
export declare const toCurrentTarget: (value: any) => PipelineSequenceTarget;
export declare const toNextTarget: (value: any) => PipelineSequenceTarget;
export declare const toPreviousTarget: (value: any) => PipelineSequenceTarget;
export declare type PipelineSequenceNodeInit = {
    process: (value: any) => any;
} & Partial<{
    name: string;
    inputCh: number | any;
    initialValues: any;
} & LogOpts>;
export interface PipelineSequenceHandler {
    startedProm: any;
    finishedProm: any;
    input: (index: string | number, value: any) => any;
    cancel: () => void;
    release: () => any;
}
export declare const runPipelineSequence: (opts: {
    nodes: PipelineSequenceNodeInit[];
    processLast: (value: any) => any;
} & Partial<LogOpts>) => PipelineSequenceHandler & Logger;
