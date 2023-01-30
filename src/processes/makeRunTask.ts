import { throwError } from 'rxjs';
import type { ObsLike } from '../utils/rxutils';
import { tryTo } from '../utils/rxutils';
import type { TaskItem } from './processor.interfaces';

export function makeRunTask(runners: {
    [name: string]: (payload: any) => ObsLike;
}) {
    return (task: TaskItem) => {
        if (!task) {
            return throwError(new Error('argument.null.task'));
        }

        if (!task.kind) {
            return throwError(new Error('argument.null.task.kind'));
        }

        const runner: (payload: any) => ObsLike = runners[task.kind];

        if (!runner) {
            return throwError(new Error(`unknown.task:${task.kind}`));
        }

        return tryTo(() => runner(task.payload));
    };
}
