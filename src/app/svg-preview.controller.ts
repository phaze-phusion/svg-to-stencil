import { fromEvent, type Subscription } from 'rxjs';
import { ElementId } from './models/elementId.const';
import { type Nullable, pickById } from './shared/utilities';

let _previewContainer: HTMLDivElement;
let _previewInjectionDiv: HTMLDivElement;
let _previewButton: HTMLButtonElement;
let _previewButtonIcon: HTMLSpanElement;
let _previewBtnListener: Nullable<Subscription> = null;

export function initializePreview(): void {
  _previewButton = <HTMLButtonElement>pickById(ElementId.PreviewBtn);
  _previewButtonIcon = <HTMLSpanElement>pickById(ElementId.PreviewBtnIcon);
  _previewContainer = <HTMLDivElement>pickById(ElementId.SvgPreviewContainer);
  _previewInjectionDiv = <HTMLDivElement>pickById(ElementId.SvgPreviewInjectionEl);

  resetPreview();
}

export function toggleListeningToPreviewBtn(inputValue: string): void {
  const inputIsNotEmpty = inputValue !== '';

  if (inputIsNotEmpty) {
    // inject the SVG
    _previewInjectionDiv.innerHTML = inputValue;
    _previewButton.removeAttribute('disabled');

    // Check if subscription already exists, if not add it
    if (!_previewBtnListener) {
      _previewBtnListener = fromEvent(_previewButton, 'click')
        .subscribe(() => {
          // Toggle preview visibility
          if (_previewContainer.classList.contains(ElementId.PreviewShowingCls)) {
            _previewContainer.classList.remove(ElementId.PreviewShowingCls);
            _previewButtonIcon.textContent = 'expand_more';
          } else {
            _previewContainer.classList.add(ElementId.PreviewShowingCls);
            _previewButtonIcon.textContent = 'expand_less';
          }
        });
    }
  } else {
    resetPreview();
  }
}

function resetPreview(): void {
  if (_previewBtnListener) {
    _previewBtnListener.unsubscribe();
  }
  _previewContainer.classList.remove(ElementId.PreviewShowingCls);
  _previewButton.setAttribute('disabled', 'disabled');
  _previewButtonIcon.textContent = 'expand_more';
  _previewInjectionDiv.innerHTML = '';
}
