import { ObsLike } from '../utils/rxutils';
import { IProcessor, TaskItem } from './processor.interfaces';
/**
 * Options for starting a new sequential processor
 */
export interface SequentialProcessorOptions {
    /**
     * `bufferSize` represents the size of the input channel. After that limit
     * the sequentiality of tasks is undefined.
     */
    bufferSize: number;
    /**
     * `interTaskDelay` is the time between task executions to wait before
     * continuing the task execution loop.
     * Use 0 to prevent the artificial delay between tasks.
     * Use 1 to use the minimum artificial delay between tasks.
     */
    interTaskDelay: number;
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
    taskTimeout: number;
    logToConsole: boolean;
}
/**
 * Creates a Processor that executes sequentially the given tasks
 * @param runTask
 * @param opts
 */
export declare function startSequentialProcessor(runTask: (task: TaskItem) => ObsLike<any>, options?: Partial<SequentialProcessorOptions>): IProcessor;
