import { fromEvent } from 'rxjs';
import { default as packageInfo } from '../../package.json';
import { createDropAreas } from './components/DropFile.class';
import { SvgParserClass } from './components/SvgParser.class';
import { ElementId } from './models/elementId.const';
import { pickById } from './shared/utilities';
import { toggleListeningToPreviewBtn } from './svg-preview.controller';

const parser = new SvgParserClass();
let inputTextarea: HTMLTextAreaElement;
let outputTextarea: HTMLTextAreaElement;

export function initializeInterface(): void {
  const VERSION = packageInfo.version;
  (<HTMLSpanElement>pickById(ElementId.AppVersionOutput)).textContent = `v${VERSION}`;
  inputTextarea = <HTMLTextAreaElement>pickById(ElementId.SvgInput);
  outputTextarea = <HTMLTextAreaElement>pickById(ElementId.StencilOutput);

  createDropAreas(inputTextarea, outputTextarea);

  fromEvent(<HTMLButtonElement>pickById(ElementId.ConvertButton), 'click')
    .subscribe(
      () => {
        parseInput();
      }
    );
}

function parseInput(): void {
  let input = inputTextarea.value;

  // remove line breaks
  input = input.replace(/\n+/g, ' ');

  toggleListeningToPreviewBtn(input);

  parser.incFullMxGraphTags = (<HTMLInputElement>pickById(ElementId.CheckboxIncludeFull)).checked;

  parser.app_convert(input)
    .subscribe(
      (outputContent: string) => {
        (<HTMLTextAreaElement>pickById(ElementId.StencilOutput)).value = outputContent;
      }
    );
}
