import { ObsLike } from '../utils/rxutils';
import { IProcessor, TaskItem } from './processor.interfaces';
export interface DirectProcessorOptions {
    /**
     * `maxRetries` is the max number of retries of a failing task when it
     * fails with transient errors.
     */
    maxRetries: number;
    /**
     * `minDelay` is the minimum delay used between task retries
     */
    minDelay: number;
    /**
     * `maxDelay` is the maximum delay used between task retries
     */
    maxDelay: number;
    /**
     * `nextDelay` is a function to compute the next delay given the
     * previous one and the retry number.
     */
    nextDelay: (delay: number, retry: number) => number;
    /**
     * `isTransientError` is a function to find out whether an error is
     * considered transient or not.
     */
    isTransientError: (error: any, retry: number) => boolean;
    caption: string;
}
export declare function startDirectProcessor(runTask: (task: TaskItem) => ObsLike<any>, options?: Partial<DirectProcessorOptions>): IProcessor;
/**
 * Creates an instance of IProcessor (Direct), from a given service, where each
 * TaskItem of the form { kind: 'method', payload: T } is implemented as
 * service.method(payload).
 */
export declare const fromServiceToDirectProcessor: (service: any, caption?: string, options?: Partial<DirectProcessorOptions>) => IProcessor;
