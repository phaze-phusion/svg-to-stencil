const precision = 1e2;

export type Nullable<T> = T | null;

export function pickById(id: string): Nullable<HTMLElement> {
  return document.getElementById(id);
}

export function fixFloatOverflow(value: number): number {
  if ((value + '').length > 15) {
    value = Math.round(value * precision) / precision;
  }
  return value;
}
