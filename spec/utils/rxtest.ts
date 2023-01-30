import type { Observable } from 'rxjs';
import { Notification, of, throwError, timer } from 'rxjs';
import {
    concatMap,
    materialize,
    take,
    tap,
    timeoutWith,
    toArray
} from 'rxjs/operators';
import type { LogOpts } from '../../src/utils';
import { conditionalLog } from '../../src/utils';

export type TestObsOptions<T = any> = {
    anyValue: T;
    anyError: any;
    doneTimeout: number;
} & LogOpts;

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: jest.DoneCallback,
    options?: Partial<TestObsOptions<T>>
) => {
    const opts = Object.assign(
        <TestObsOptions<T>>{
            anyValue: undefined,
            anyError: undefined,
            doneTimeout: 500
        },
        options
    );
    const { doneTimeout } = opts;
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
            next: actArr =>
                expect(actArr.map(toStr)).toEqual(expected.map(toStr)),
            error: e => done(e),
            complete: () => done()
        });
};

export const testObs = <T = any>(
    actual: Observable<T>,
    expectedValues: T[],
    expectedError: any | undefined,
    done: jest.DoneCallback,
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
    done: jest.DoneCallback,
    options?: Partial<TestObsOptions<T>>
) =>
    testObsNotifications(
        actual,
        expected.map(v => Notification.createNext(v)),
        done,
        options
    );

export const testTaskOf =
    (due: number, period: number = 0) =>
    (...args: any[]) =>
    (p?: any) =>
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
