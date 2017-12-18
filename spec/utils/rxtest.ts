import { Observable, Notification } from 'rxjs';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { deepEqual } from '../../src/utils/equality';

export interface DoneCallback {
    (...args: any[]): any;
    fail(error?: string | { message: string }): any;
}

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    anyValue?: T,
    anyError?: any,
    doneTimeout: number | undefined = 1000
) => {
    expect(actual).toBeInstanceOf(Observable);
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
    const checkKind = (
        kind: string,
        exp: Notification<T>,
        act: Notification<any>
    ) => {
        if (exp.kind !== kind) {
            const expStr = toStr(exp);
            const actStr = toStr(act);
            done.fail(`Expected ${expStr}, but ${actStr} was received}`);
        } else if (kind === 'N') {
            if (anyValue === undefined || exp.value !== anyValue) {
                if (!deepEqual(act.value, exp.value)) {
                    done.fail(
                        `Expected value ${JSON.stringify(
                            exp.value
                        )}, but value ${JSON.stringify(
                            act.value
                        )} was received}`
                    );
                }
            }
        } else if (kind === 'E') {
            if (anyError === undefined || exp.error !== anyError) {
                if (!deepEqual(act.error, exp.error)) {
                    done.fail(
                        `Expected error ${JSON.stringify(
                            exp.error
                        )}, but error ${JSON.stringify(
                            act.error
                        )} was received}`
                    );
                }
            }
        }
    };

    const finished$ = new ReplaySubject(1);

    actual.subscribe({
        next: actualValue => {
            expect(completeSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            const expectedNotification = fetchExpected();
            const actualNotification = Notification.createNext(actualValue);
            checkKind('N', expectedNotification, actualNotification);
        },
        error: err => {
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
        Observable.of(1)
            .delay(1000)
            .takeUntil(finished$)
            .subscribe(() => {
                done.fail('DONE by custom TIMEOUT');
                done();
            });
    }
};

export const testObs = <T = any>(
    actual: Observable<T>,
    expectedValues: T[],
    expectedError: any | undefined,
    done: DoneCallback,
    anyValue?: T,
    anyError?: any
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
        anyValue,
        anyError
    );

export const testObsValues = <T = any>(
    actual: Observable<T>,
    expected: T[],
    done: DoneCallback,
    anyValue?: T,
    anyError?: any
) =>
    testObsNotifications(
        actual,
        expected.map(v => Notification.createNext(v)),
        done,
        anyValue,
        anyError
    );
