import type { Observable } from 'rxjs';
import { of, throwError, timer } from 'rxjs';
import {
    concatMap,
    materialize,
    take,
    tap,
    timeout,
    toArray
} from 'rxjs/operators';
import type { LogOpts } from '../../src/utils';
import { conditionalLog } from '../../src/utils';

export type TestObsOptions<T = any> = {
    anyValue: T;
    anyError: any;
    doneTimeout: number;
} & LogOpts;

type RxNotification<T> =
    | {
          kind: 'N';
          value: T;
      }
    | {
          kind: 'E';
          error: unknown;
      }
    | {
          kind: 'C';
      };

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: RxNotification<T>[],
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

    const toStr = (n: RxNotification<any>) => {
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
        }
    };

    return actual
        .pipe(
            timeout({ each: doneTimeout, with: () => ['TIMEOUT'] }),
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

const createNextNotification = <T>(value: T) => ({ kind: 'N' as const, value });

const createErrorNotification = (error: unknown) => ({
    kind: 'E' as const,
    error
});

const createCompleteNotification = () => ({ kind: 'C' as const });

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
            .map<RxNotification<T>>(createNextNotification)
            .concat(
                !!expectedError
                    ? createErrorNotification(expectedError)
                    : createCompleteNotification()
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
        expected.map(createNextNotification),
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
                    return throwError(() => elem);
                } else {
                    return of(elem);
                }
            })
        );
