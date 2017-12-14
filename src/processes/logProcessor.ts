import { IProcessor } from './processor.interfaces';

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
