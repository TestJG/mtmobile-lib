import { Observable, Notification } from 'rxjs';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { deepEqual } from '../../src/utils/equality';
import { joinStr, conditionalLog, ValueOrFunc } from '../../src/utils';

export interface DoneCallback {
    (...args: any[]): any;
    fail(error?: string | { message: string }): any;
}

export interface TestObsOptions<T = any> {
    anyValue: T;
    anyError: any;
    doneTimeout: number;
    logActualValues: boolean | ValueOrFunc<string>;
}

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) => {
    const { anyValue, anyError, doneTimeout, logActualValues } = Object.assign(
        <TestObsOptions<T>>{
            anyValue: undefined,
            anyError: undefined,
            doneTimeout: 500,
            logActualValues: false
        },
        options
    );
    const log = conditionalLog(logActualValues, { prefix: 'TEST_OBS: ',  });

    const toStr = (n: Notification<any>) => {
        switch (n.kind) {
            case 'N':
                return `a VALUE ${JSON.stringify(n.value)}`;
            case 'E':
                return `an ERROR ${JSON.stringify(n.error.message || n.error)}`;
            case 'C':
                return `a COMPLETE`;
            default:
                return `an unknown notification of kind: ${n.kind}`;
        }
    };

    return actual
        .timeoutWith(doneTimeout, ['TIMEOUT'])
        .materialize()
        .do(n => log('RECEIVED ', toStr(n)))
        .toArray()
        .subscribe({
            next: actArr => {
                try {
                    expect(actArr.map(toStr)).toEqual(expected.map(toStr));
                } catch (e) {
                    done.fail(e);
                }
            },
            error: e => done.fail(e),
            complete: () => done()
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
    Observable.timer(due, period)
        .take(args.length)
        .concatMap(i => {
            const elem = args[i];
            if (i === args.length - 1 && elem instanceof Error) {
                return Observable.throw(elem);
            } else {
                return Observable.of(elem);
            }
        });
