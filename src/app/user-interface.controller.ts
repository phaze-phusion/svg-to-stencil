import {fromEvent} from 'rxjs';
import {default as packageInfo} from '../../package.json';
import {elementId} from './models/elementId.enum';
import {pickById} from './shared/utlis';
import {toggleListeningToPreviewBtn} from './svg-preview.controller';
import {SvgParserClass} from './components/SvgParser.class';

const parser = new SvgParserClass();

export function initializeInterface(): void {
  const VERSION = packageInfo.version;
  (<HTMLSpanElement>pickById(elementId.appVersionOutput)).textContent = `v${VERSION}`;

  fromEvent(<HTMLButtonElement>pickById(elementId.convertButton), 'click')
    .subscribe(
      () => {
        parseInput();
      }
    );
}

function parseInput(): void {
  let input = (<HTMLTextAreaElement>pickById(elementId.svgInput)).value;

  // remove line breaks
  input = input.replace(/\n+/g, ' ');

  toggleListeningToPreviewBtn(input);

  parser.incFullMxGraphTags = (<HTMLInputElement>pickById(elementId.checkboxIncludeFull)).checked;

  parser.app_convert(input)
    .subscribe(
      (outputContent: string) => {
        (<HTMLTextAreaElement>pickById(elementId.stencilOutput)).value = outputContent;
      }
    );
}
