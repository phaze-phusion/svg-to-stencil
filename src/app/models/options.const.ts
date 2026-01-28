export const Options = {
  Indent: '  ',
  PathLengthLimit: 250,
  FloatPrecision: 2,
} as const

export type Options = (typeof Options)[keyof typeof Options];
