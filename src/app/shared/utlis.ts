import {options} from '../models/options.enum';

export type Nullable<T> = T | null;

export function pickById(id: string): Nullable<HTMLElement> {
  return document.getElementById(id);
}

export function floatPrecision(value: number): number {
  return +value.toFixed(options.floatPrecision);
}
