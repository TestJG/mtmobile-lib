import {
    Observable,
    Notification,
    ReplaySubject,
    timer,
    throwError,
    of,
} from 'rxjs';
import { deepEqual } from '../../src/utils/equality';
import { joinStr, conditionalLog, ValueOrFunc, LogOpts } from '../../src/utils';
import {
    timeoutWith,
    materialize,
    tap,
    toArray,
    take,
    concatMap,
} from 'rxjs/operators';

export interface DoneCallback {
    (...args: any[]): any;
    fail(error?: string | { message: string }): any;
}

export type TestObsOptions<T = any> = {
    anyValue: T;
    anyError: any;
    doneTimeout: number;
} & LogOpts;

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) => {
    const opts = Object.assign(
        <TestObsOptions<T>>{
            anyValue: undefined,
            anyError: undefined,
            doneTimeout: 500,
        },
        options
    );
    const { anyValue, anyError, doneTimeout } = opts;
    const log = conditionalLog(opts, { prefix: 'TEST_OBS: ' });

    const toStr = (n: Notification<any>) => {
        switch (n.kind) {
            case 'N': {
                const str =
                    n.value instanceof Error
                        ? `${n.value.name || 'Error'}('${n.value.message}')`
                        : JSON.stringify(n.value);
                return `a VALUE ${str}`;
            }
            case 'E': {
                const str =
                    n.error instanceof Error
                        ? `${n.error.name || 'Error'}('${n.error.message}')`
                        : JSON.stringify(n.error);
                return `an ERROR ${str}`;
            }
            case 'C':
                return `a COMPLETE`;
            default:
                return `an unknown notification of kind: ${n.kind}`;
        }
    };

    return actual
        .pipe(
            timeoutWith(doneTimeout, ['TIMEOUT']),
            materialize(),
            tap(n => log('RECEIVED ', toStr(n))),
            toArray()
        )
        .subscribe({
            next: actArr => {
                try {
                    expect(actArr.map(toStr)).toEqual(expected.map(toStr));
                } catch (e) {
                    done.fail(e);
                }
            },
            error: e => done.fail(e),
            complete: () => done(),
        });
};

export const testObs = <T = any>(
    actual: Observable<T>,
    expectedValues: T[],
    expectedError: any | undefined,
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) =>
    testObsNotifications(
        actual,
        expectedValues
            .map(v => Notification.createNext(v))
            .concat(
                !!expectedError
                    ? [Notification.createError(expectedError)]
                    : [Notification.createComplete()]
            ),
        done,
        options
    );

export const testObsValues = <T = any>(
    actual: Observable<T>,
    expected: T[],
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) =>
    testObsNotifications(
        actual,
        expected.map(v => Notification.createNext(v)),
        done,
        options
    );

export const testTaskOf = (due: number, period: number = 0) => (
    ...args: any[]
) => (p?: any) =>
    timer(due, period).pipe(
        take(args.length),
        concatMap(i => {
            const elem = args[i];
            if (i === args.length - 1 && elem instanceof Error) {
                return throwError(elem);
            } else {
                return of(elem);
            }
        })
    );
