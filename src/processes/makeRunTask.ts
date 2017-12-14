import { Observable, Subject, ReplaySubject } from "rxjs";
import { IProcessor, TaskItem, ObsLike } from "./processor.interfaces";
import * as csp from "js-csp";
import { assign } from "../utils/common";

export function makeRunTask(
    runners: { [name: string]: (payload: any) => ObsLike<any> })
    : (task: TaskItem) => ObsLike<any> {
    return function (task: TaskItem) {
        if (!task) {
            return Observable.throw(new Error("argument.null.task"));
        }
        if (!task.kind) {
            return Observable.throw(new Error("argument.null.task.kind"));
        }
        const runner = runners[task.kind];
        if (!runner) {
            return Observable.throw(new Error(`unknown.task:${task.kind}`));
        }
        return runner(task.payload);
    }
}
