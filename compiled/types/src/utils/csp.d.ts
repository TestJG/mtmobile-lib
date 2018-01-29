import { Observable } from 'rxjs';
/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
export declare const firstToChannel: (obs: Observable<any>, autoClose?: boolean) => any;
export declare const startLeasing: (leaseFn: (leaseTimeSecs: number) => Observable<boolean>, releaseFn: () => Observable<void>, options?: Partial<{
    timeoutSecs: number;
    leaseMarginSecs: number;
    autoClose: boolean;
}>) => {
    leaseCh: any;
    pingCh: any;
    releaseCh: any;
};
