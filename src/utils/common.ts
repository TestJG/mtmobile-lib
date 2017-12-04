import { flatMap } from 'lodash';

export const assign = <T>(s: T, ...u: Partial<T>[]): T =>
    Object.assign({}, s, ...u);

export const id = <T>(a: T) => a;
