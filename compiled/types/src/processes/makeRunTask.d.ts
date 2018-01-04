import { Observable } from 'rxjs';
import { TaskItem } from './processor.interfaces';
import { ObsLike } from '../utils/rxutils';
export declare function makeRunTask(runners: {
    [name: string]: (payload: any) => ObsLike;
}): (task: TaskItem) => Observable<any>;
