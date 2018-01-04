import { Observable } from 'rxjs';
import { tryTo } from '../utils/rxutils';
export function makeRunTask(runners) {
    return (task) => {
        if (!task) {
            return Observable.throw(new Error('argument.null.task'));
        }
        if (!task.kind) {
            return Observable.throw(new Error('argument.null.task.kind'));
        }
        const runner = runners[task.kind];
        if (!runner) {
            return Observable.throw(new Error(`unknown.task:${task.kind}`));
        }
        return tryTo(() => runner(task.payload));
    };
}
//# sourceMappingURL=makeRunTask.js.map