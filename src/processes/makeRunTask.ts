import { Observable } from 'rxjs/Observable';
import { TaskItem } from './processor.interfaces';
import { ObsLike, tryTo } from '../utils/rxutils';

export function makeRunTask(runners: {
    [name: string]: (payload: any) => ObsLike;
}) {
    return (task: TaskItem) => {
        if (!task) {
            return Observable.throw(new Error('argument.null.task'));
        }

        if (!task.kind) {
            return Observable.throw(new Error('argument.null.task.kind'));
        }

        const runner: (payload: any) => ObsLike = runners[task.kind];

        if (!runner) {
            return Observable.throw(new Error(`unknown.task:${task.kind}`));
        }

        return tryTo(() => runner(task.payload));
    };
}
