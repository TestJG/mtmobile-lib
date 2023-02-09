import { merge, throwError } from 'rxjs';
import { last, map } from 'rxjs/operators';
import { assign } from '../utils/common';
import type {
    IProcessor,
    IProcessorCore,
    TaskItem
} from './processor.interfaces';

export interface RouterProcessorOptions {
    caption: string;
    routeSeparator: string;
}

export function startRouterProcessor(
    routes: { [prefix: string]: IProcessor },
    opts?: Partial<RouterProcessorOptions>
): IProcessor {
    const routeKeys = Object.keys(routes);
    const defaultOptions: RouterProcessorOptions = {
        caption: 'RtrProc',
        routeSeparator: '/'
    };

    const options = assign(defaultOptions, opts || {});

    const isAlive = () => routeKeys.some(key => routes[key].isAlive());

    const finish = () =>
        merge(...routeKeys.map(key => routes[key].finish())).pipe(last());

    const process = (task: TaskItem) => {
        const pos = task.kind.indexOf(options.routeSeparator);
        if (pos < 0) {
            return throwError(() => new Error('argument.invalid.task.kind'));
        }
        const prefix = task.kind.substr(0, pos);
        const route = routes[prefix];
        if (!route) {
            return throwError(() => new Error('argument.invalid.task.prefix'));
        }
        const newKind = task.kind.substr(pos + options.routeSeparator.length);
        const newTask = assign(task, { kind: newKind });
        return route.process(newTask);
    };

    const recoverPrefix = (prefix: string) => (item: TaskItem) =>
        assign(item, {
            kind: `${prefix}${options.routeSeparator}${item.kind}`
        });

    const onFinished$ = merge(
        ...routeKeys.map(key => routes[key].onFinished$)
    ).pipe(last());

    const onTaskStarted$ = merge(
        ...routeKeys.map(key =>
            routes[key].onTaskStarted$.pipe(map(recoverPrefix(key)))
        )
    );

    const onTaskReStarted$ = merge(
        ...routeKeys.map(key =>
            routes[key].onTaskReStarted$.pipe(map(recoverPrefix(key)))
        )
    );

    const onTaskResult$ = merge(
        ...routeKeys.map(key =>
            routes[key].onTaskResult$.pipe(
                map(
                    ([item, value]) =>
                        <[TaskItem, any]>[recoverPrefix(key)(item), value]
                )
            )
        )
    );

    const onTaskError$ = merge(
        ...routeKeys.map(key =>
            routes[key].onTaskError$.pipe(
                map(
                    ([item, value]) =>
                        <[TaskItem, any]>[recoverPrefix(key)(item), value]
                )
            )
        )
    );

    const onTaskCompleted$ = merge(
        ...routeKeys.map(key =>
            routes[key].onTaskCompleted$.pipe(map(recoverPrefix(key)))
        )
    );

    return {
        caption: options.caption,
        process,
        isAlive,
        finish,
        onFinished$,
        onTaskStarted$,
        onTaskReStarted$,
        onTaskResult$,
        onTaskError$,
        onTaskCompleted$
    };
}

export interface RouterProxyOptions {
    routeSeparator: string;
}

export function startRouterProxy(
    processor: IProcessorCore,
    prefix: string,
    opts?: Partial<RouterProxyOptions>
): IProcessorCore {
    const defaultOptions: RouterProxyOptions = {
        routeSeparator: '/'
    };

    const options = assign(defaultOptions, opts || {});

    const isAlive = () => processor.isAlive();

    const finish = () => throwError(() => new Error('invalidop.proxy.finish'));

    const process = (task: TaskItem) => {
        const newTask = assign(task, {
            kind: `${prefix}${options.routeSeparator}${task.kind}`
        });
        return processor.process(newTask);
    };

    return {
        process,
        isAlive,
        finish
    };
}
