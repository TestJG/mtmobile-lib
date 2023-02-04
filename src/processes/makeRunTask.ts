import { throwError } from 'rxjs';
import { tryTo } from '../utils/rxutils';
import type { TaskItem } from './processor.interfaces';

type TaskRunner<TPayload, TResult = unknown> = (payload: TPayload) => TResult;

type RunnersDict<TKind extends string, TPayload> = Record<
    TKind,
    TaskRunner<TPayload>
>;

export function makeRunTask<T extends RunnersDict<string, unknown>>(
    runners: T
) {
    return <
        TKind extends string & keyof T,
        TPayload extends Parameters<T[TKind]>[0],
        TResult extends T[TKind] extends TaskRunner<TPayload, infer R>
            ? R
            : never,
        TTask extends TaskItem<TKind, TPayload>
    >(
        task: TTask
    ) => {
        if (!task) {
            return throwError(new Error('argument.null.task'));
        }

        if (!task.kind) {
            return throwError(new Error('argument.null.task.kind'));
        }

        const runner = runners[task.kind];

        if (!runner) {
            return throwError(new Error(`unknown.task:${task.kind}`));
        }

        return tryTo(() => runner(task.payload) as TResult);
    };
}
