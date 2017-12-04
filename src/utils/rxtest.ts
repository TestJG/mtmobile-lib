import { Observable, Notification } from 'rxjs';

export interface DoneCallback {
    (...args: any[]): any;
    fail(error?: string | { message: string }): any;
}

export const testObsNotifications = <T = any>(
    actual: Observable<T>,
    expected: Notification<T>[],
    done: DoneCallback,
    anyValue?: T,
    anyError?: any
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
    const toStringNotif = (n: Notification<any>) => {
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
            const expStr = toStringNotif(exp);
            const actStr = toStringNotif(act);
            done.fail(`Expected ${expStr}, but ${actStr} was received}`);
        } else if (kind === 'N') {
            if (anyValue === undefined || exp.value !== anyValue) {
                expect(act.value).toEqual(exp.value);
            }
        } else if (kind === 'E') {
            if (anyError === undefined || exp.error !== anyError) {
                expect(act.error).toEqual(exp.error);
            }
        }
    };

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
            done();
        },
        complete: () => {
            expect(completeSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
            const expectedNotification = fetchExpected();
            const actualNotification = Notification.createComplete();
            completeSpy();
            checkKind('C', expectedNotification, actualNotification);
            done();
        }
    });
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
