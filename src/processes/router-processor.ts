import { Observable } from "rxjs";
import { IProcessor, IProcessorCore, TaskItem } from "./processor.interfaces";
import { assign } from "../utils/common";

export interface RouterProcessorOptions {
    caption: string;
    routeSeparator: string;
}

export function startRouterProcessor(
    routes: { [prefix: string]: IProcessor },
    opts?: Partial<RouterProcessorOptions>)
    : IProcessor {
    const routeKeys = Object.keys(routes);
    const defaultOptions: RouterProcessorOptions = {
        caption: 'RtrProc',
        routeSeparator: '/',
    };

    const options = assign(defaultOptions, opts || {});

    const isAlive = () => routeKeys.some(key => routes[key].isAlive());

    const finish = () => Observable
        .merge(...routeKeys.map(key => routes[key].finish()))
        .last();

    const process = (task: TaskItem) => {
        const pos = task.kind.indexOf(options.routeSeparator);
        if (pos < 0) {
            return Observable.throw(new Error("argument.invalid.task.kind"));
        }
        const prefix = task.kind.substr(0, pos);
        const route = routes[prefix];
        if (!route) {
            return Observable.throw(new Error("argument.invalid.task.prefix"));
        }
        const newKind = task.kind.substr(pos + options.routeSeparator.length);
        const newTask = assign(task, { kind: newKind });
        return route.process(newTask);
    };

    const recoverPrefix = (prefix: string) => (item: TaskItem) => assign(item,
        { kind: `${prefix}${options.routeSeparator}${item.kind}` });

    const onFinished$ = Observable
        .merge(...routeKeys.map(key => routes[key].onFinished$))
        .last();

    const onTaskStarted$ = Observable
        .merge(...routeKeys.map(key =>
            routes[key].onTaskStarted$.map(recoverPrefix(key))));

    const onTaskReStarted$ = Observable
        .merge(...routeKeys.map(key =>
            routes[key].onTaskReStarted$.map(recoverPrefix(key))));

    const onTaskResult$ = Observable
        .merge(...routeKeys.map(key =>
            routes[key].onTaskResult$.map(([item, value]) =>
                <[TaskItem, any]>[recoverPrefix(key)(item), value])));

    const onTaskError$ = Observable
        .merge(...routeKeys.map(key =>
            routes[key].onTaskError$.map(([item, value]) =>
                <[TaskItem, any]>[recoverPrefix(key)(item), value])));

    const onTaskCompleted$ = Observable
        .merge(...routeKeys.map(key =>
            routes[key].onTaskCompleted$.map(recoverPrefix(key))));

    return {
        caption: options.caption,
        process, isAlive, finish,
        onFinished$,
        onTaskStarted$,
        onTaskReStarted$,
        onTaskResult$,
        onTaskError$,
        onTaskCompleted$,
    };
}

export interface RouterProxyOptions {
    routeSeparator: string;
}

export function startRouterProxy(
    processor: IProcessorCore,
    prefix: string,
    opts?: Partial<RouterProxyOptions>)
    : IProcessorCore {
    const defaultOptions: RouterProxyOptions = {
        routeSeparator: '/',
    };

    const options = assign(defaultOptions, opts || {});

    const isAlive = () => processor.isAlive();

    const finish = () => Observable
        .throw(new Error("invalidop.proxy.finish"));

    const process = (task: TaskItem) => {
        const newTask = assign(task,
            { kind: `${prefix}${options.routeSeparator}${task.kind}` });
        return processor.process(newTask);
    };

    return {
        process, isAlive, finish,
    };
}
