import { Observable } from 'rxjs';
import { ValueOrFunc } from './common';
/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
export declare const firstToChannel: (obs: Observable<any>, channel?: any, autoClose?: boolean, finishCh?: any) => any;
export declare const observableToChannel: (obs: Observable<any>, channel?: any, autoClose?: boolean, finishCh?: any) => any;
export declare function startPinging(req: {
    pingCh: any;
    pingValue: any;
    pingTimeMilliseconds: number;
    cancelCh: any;
    pingAsync?: boolean;
    logToConsole?: boolean;
    onFinish?: (error: any) => void;
}): IterableIterator<any>;
export interface LeaseChannels {
    leaseCh: any;
    pingCh: any;
    releaseCh: any;
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
 *                  duration in seconds and return an observable that returns
 *                  true or false whether the lease is acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease is reserved, to ensure
 *                  release.
 * @param options   - timeoutSecs: Represents maximum time in seconds when the
 *                  client is expected to use the ping channel to communicate
 *                  it's interest in keeping the lease. If that time elapses and
 *                  no ping is received the lease will be released.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  add to timeoutSecs to reserve the lease. After that time the
 *                  underlying lease mechanism could decide to automatically
 *                  release the lease for other processes.
 *                  - autoClose: Indicates whether the lease channels will be
 *                  closed after the process has stopped.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 * @returns A lease channels to communicate with the client code, with channels:
 *          - leaseCh:  To communicate lease status. true to indicate the first
 *                      lease acquisition, before that the lease cannot be
 *                      considered taken. false to indicate that the lease was
 *                      not taken or that it was released, due to timeout or
 *                      explicit request.
 */
export declare const startLeasing: (leaseFn: (leaseTimeSecs: number) => Observable<boolean>, releaseFn: () => Observable<void>, options?: Partial<{
    timeoutSecs: number;
    leaseMarginSecs: number;
    autoClose: boolean;
    logToConsole: boolean;
}>) => LeaseChannels;
export declare class PipelineTarget {
    value: any;
    targetName?: string;
    targetIndex?: number;
    targetOffset?: number;
    constructor(value: any, options?: {
        targetName?: string;
        targetIndex?: number;
        targetOffset?: number;
    });
    static fromValue(value: any): PipelineTarget;
    select<T>(dict: Map<number | string, T>, currentIndex: number): T;
}
export interface PipelineNodeInit {
    name: string;
    process: (value: any) => Observable<PipelineTarget | any>;
    inputCh?: ValueOrFunc<any>;
    bufferSize?: number;
    cancelFast?: boolean;
}
export interface PipelineNode {
    name: string;
    inputCh: any;
    statusCh: any;
}
export interface PipelineChannels {
    statusCh: any;
    inputChByName: {
        [key: string]: any;
    };
    inputChByIndex: any[];
}
export declare const runPipelineNode: (req: PipelineNodeInit & {
    outputCh: any;
    cancelCh?: any;
}, options?: Partial<{
    logToConsole: boolean;
}>) => PipelineNode;
export declare const runPipeline: (nodes: (PipelineNodeInit & {
    initialValues?: any;
})[], options: Partial<{
    cancelCh: any;
    leasing: ValueOrFunc<LeaseChannels>;
    leasingPingTimeSecs: number;
    logToConsole: boolean;
}>) => PipelineChannels;
