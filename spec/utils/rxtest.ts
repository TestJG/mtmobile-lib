import { Observable, Notification } from 'rxjs';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { deepEqual } from '../../src/utils/equality';
import { joinStr } from '../../src/utils';

export interface DoneCallback {
    (...args: any[]): any;
    fail(error?: string | { message: string }): any;
}

export interface TestObsOptions<T = any> {
    anyValue: T;
    anyError: any;
    doneTimeout: number;
    logActualValues: boolean;
}

export const testObsNotificationsOld = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) => {
    expect(actual).toBeInstanceOf(Observable);
    const { anyValue, anyError, doneTimeout, logActualValues } = Object.assign(
        <TestObsOptions<T>>{
            anyValue: undefined,
            anyError: undefined,
            doneTimeout: 1000,
            logActualValues: false
        },
        options
    );
    let count = 0;
    const inc = () => count++;
    const errorSpy = jasmine.createSpy('error');
    const completeSpy = jasmine.createSpy('complete');
    const fetchExpected = () => {
        const result =
            count < expected.length
                ? expected[count]
                : Notification.createComplete();
        count++;
        return result;
    };
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
    const valuesSoFar = [];
    const checkKind = (
        kind: string,
        exp: Notification<T>,
        act: Notification<any>
    ) => {
        let failed = false;
        if (exp.kind !== kind) {
            const expStr = toStr(exp);
            const actStr = toStr(act);
            done.fail(
                `Expected ${expStr}, but ${actStr} was received}\nValues so far:\n${joinStr(
                    '\n',
                    valuesSoFar.map(toStr)
                )}`
            );
            failed = true;
        } else if (kind === 'N') {
            if (anyValue === undefined || exp.value !== anyValue) {
                if (!deepEqual(act.value, exp.value)) {
                    done.fail(
                        `Expected value ${JSON.stringify(
                            exp.value
                        )}, but value ${JSON.stringify(
                            act.value
                        )} was received}\nValues so far:\n${joinStr(
                            '\n',
                            valuesSoFar.map(toStr)
                        )}`
                    );
                    failed = true;
                }
            }
        } else if (kind === 'E') {
            if (anyError === undefined || exp.error !== anyError) {
                if (!deepEqual(act.error, exp.error)) {
                    done.fail(
                        `Expected error ${JSON.stringify(
                            exp.error.message || exp.error
                        )}, but error ${JSON.stringify(
                            act.error.message || act.error
                        )} was received}\nValues so far:\n${joinStr(
                            '\n',
                            valuesSoFar.map(toStr)
                        )}`
                    );
                    failed = true;
                }
            }
        }
        if (!failed) {
            valuesSoFar.push(act);
        }
    };

    const finished$ = new ReplaySubject(1);

    if (logActualValues) {
        console.log('SUBSCRIBING');
    }
    actual.subscribe({
        next: actualValue => {
            if (logActualValues) {
                console.log('NEXT', actualValue);
            }
            expect(completeSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            const expectedNotification = fetchExpected();
            const actualNotification = Notification.createNext(actualValue);
            checkKind('N', expectedNotification, actualNotification);
        },
        error: err => {
            if (logActualValues) {
                console.log('ERROR', err);
            }
            expect(completeSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            const expectedNotification = fetchExpected();
            const actualNotification = Notification.createError(err);
            errorSpy(err);
            checkKind('E', expectedNotification, actualNotification);
            finished$.next('E');
            done();
        },
        complete: () => {
            if (logActualValues) {
                console.log('COMPLETE');
            }
            expect(completeSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            const expectedNotification = fetchExpected();
            const actualNotification = Notification.createComplete();
            completeSpy();
            checkKind('C', expectedNotification, actualNotification);
            finished$.next('C');
            done();
        }
    });

    if (typeof doneTimeout === 'number' && doneTimeout > 0) {
        Observable.timer(1000)
            .takeUntil(finished$)
            .subscribe(() => {
                done.fail('DONE by custom TIMEOUT');
                done();
            });
    }
};

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    options?: Partial<TestObsOptions<T>>
) => {
    // expect(actual).toBeInstanceOf(Observable);
    const { anyValue, anyError, doneTimeout, logActualValues } = Object.assign(
        <TestObsOptions<T>>{
            anyValue: undefined,
            anyError: undefined,
            doneTimeout: 500,
            logActualValues: false
        },
        options
    );

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

    const tout = Observable.of(1).delay(100);
    actual
        .timeoutWith(doneTimeout, ['TIMEOUT'])
        .materialize()
        .do(n => {
            if (logActualValues) {
                console.log('RECEIVED ', toStr(n));
            }
        })
        .toArray()
        .subscribe({
            next: actArr => {
                try {
                    expect(actArr).toEqual(expected);
                } catch(e) {
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
