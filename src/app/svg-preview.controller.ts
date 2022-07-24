import {fromEvent, Subscription} from 'rxjs';
import {Nullable, pickById} from './shared/utlis';
import {elementId} from './models/elementId.enum';

let _previewContainer: HTMLDivElement;
let _previewInjectionDiv: HTMLDivElement;
let _previewButton: HTMLButtonElement;
let _previewButtonIcon: HTMLSpanElement;
let _previewBtnListener: Nullable<Subscription> = null;

export function initializePreview(): void {
  _previewButton = <HTMLButtonElement>pickById(elementId.previewBtn);
  _previewButtonIcon = <HTMLSpanElement>pickById(elementId.previewBtnIcon);
  _previewContainer = <HTMLDivElement>pickById(elementId.svgPreviewContainer);
  _previewInjectionDiv = <HTMLDivElement>pickById(elementId.svgPreviewInjectionEl);

  resetPreview();
}

export function toggleListeningToPreviewBtn(inputValue: string) {
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
          if (_previewContainer.classList.contains(elementId.previewShowingCls)) {
            _previewContainer.classList.remove(elementId.previewShowingCls);
            _previewButtonIcon.textContent = 'expand_more';
          } else {
            _previewContainer.classList.add(elementId.previewShowingCls);
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
  _previewContainer.classList.remove(elementId.previewShowingCls);
  _previewButton.setAttribute('disabled', 'disabled');
  _previewButtonIcon.textContent = 'expand_more';
  _previewInjectionDiv.innerHTML = '';
}
