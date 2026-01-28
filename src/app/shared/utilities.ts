import { Options } from '../models/options.const';

export type Nullable<T> = T | null;

export function pickById(id: string): Nullable<HTMLElement> {
  return document.getElementById(id);
}

export function floatPrecision(value: number): number {
  return +value.toFixed(Options.FloatPrecision);
}
