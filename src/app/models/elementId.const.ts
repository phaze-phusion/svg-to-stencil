export const ElementId = {
  AppVersionOutput: 'app-version',
  ConvertButton: 'convert-btn',
  SvgInput: 'svg-in',
  SvgPreviewContainer: 'svg-preview-container',
  SvgPreviewInjectionEl: 'svg-preview-injection',
  PreviewBtn: 'svg-preview-btn',
  PreviewBtnIcon: 'svg-preview-btn-icon',
  PreviewShowingCls: 'preview-showing',
  CheckboxIncludeFull: 'include-full',
  StencilOutput: 'mx-out',
} as const

export type ElementId = (typeof ElementId)[keyof typeof ElementId];
