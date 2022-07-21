import {parse} from 'svgson';
import {fromEvent} from 'rxjs';
import {default as packageInfo} from '../../package.json';
import {INode} from './models/INode.interface';
import {PathToLinesClass} from './PathToLines.class';
import {elementId} from './models/elementId.enum';
import {fixFloatOverflow, pickById} from './shared/utlis';
import {toggleListeningToPreviewBtn} from './svg-preview';

let _stencilForegroundContent = '';

export function initializeInterface(): void {
  const VERSION = packageInfo.version;
  (<HTMLSpanElement>pickById(elementId.appVersionOutput)).textContent = `v${VERSION}`;

  fromEvent(<HTMLButtonElement>pickById(elementId.convertButton), 'click')
    .subscribe(
      () => {
        onConvert();
      }
    );
}

function onConvert(): void {
  _stencilForegroundContent = '';
  let inputValue = (<HTMLTextAreaElement>pickById(elementId.svgInput)).value;

  // remove line breaks
  inputValue = inputValue.replace(/\n+/g, ' ');

  toggleListeningToPreviewBtn(inputValue);

  parse(inputValue)
    .then(
      (svgJsonObject: INode | INode[]) => {

        // When 2 or more svg objects are erroneously present
        if (svgJsonObject instanceof Array) {
          svgJsonObject = <INode>svgJsonObject[0];
        }

        const svgJson: INode = <INode>svgJsonObject;

        for (let know = 0; know < svgJson.children.length; know++) {
          const svgChild = svgJson.children[know];
          switch (svgChild.name) {
            case 'path': {
              const pathToLine: PathToLinesClass = new PathToLinesClass(svgChild.attributes.d);

              _stencilForegroundContent += `<path>\n  `
                + pathToLine.mxGraph.split('\n').join('\n  ')
                + `\n</path>\n`
                + `<fillstroke/>`;
              break;
            }
            case 'circle': {
              const ellipseW: number = fixFloatOverflow(+svgChild.attributes.r * 2);
              const ellipseX: number = fixFloatOverflow(+svgChild.attributes.cx - +svgChild.attributes.r);
              const ellipseY: number = fixFloatOverflow(+svgChild.attributes.cy - +svgChild.attributes.r);
              _stencilForegroundContent += `<ellipse `
                + `w="${ellipseW}" `
                + `h="${ellipseW}" `
                + `x="${ellipseX}" `
                + `y="${ellipseY}" />\n`
                + `<fillstroke/>`;
              break;
            }
            // case 'rect':
            // case 'ellipse':
            // case 'line':
            // case 'polyline':
            // case 'polygon':
            default:
              console.error(`Engine doesn't yet cater for "${svgChild.name}"`, svgChild);
          }

          if ((know + 1) < svgJson.children.length) {
            _stencilForegroundContent += '\n';
          }
        }

        outputMxGraph(svgJson);

        return svgJson;
      }
    )
    .catch(
      error => {
        console.error('svgson experience an error', error);
      }
    );
}

function outputMxGraph(svgObject: INode): void {
  let stencilContent;

  if ((<HTMLInputElement>pickById(elementId.checkboxIncludeFull)).checked) {
    stencilContent = `<shape w="${svgObject.attributes.width}" `
      + `h="${svgObject.attributes.height}" `
      + `aspect="fixed" strokewidth="inherit">\n`
      + `  <connections />\n  <background>\n    <fillstroke />\n  </background>\n`
      + `  <foreground>\n    `
      + _stencilForegroundContent.replace(/\n/g, '\n    ')
      + `\n  </foreground>\n`
      + `</shape>`;
  } else {
    stencilContent = _stencilForegroundContent;
  }

  (<HTMLTextAreaElement>pickById(elementId.stencilOutput)).value = stencilContent;
}
