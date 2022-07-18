import {PathToLinesClass} from "./PathToLinesClass";
import {fixFloatOverflow, pickById} from "../shared/utlis";
import {parse} from 'svgson';
import {INode} from '../models/INode.interface';

export class EngineClass {
  private _stencilForegroundContent = '';

  // constructor() {
  // }

  start(): void {
    (pickById('convert-btn') as HTMLButtonElement).addEventListener('click', this);
  }

  onConvert(): void {
    this._stencilForegroundContent = '';
    let inputValue = (pickById('svg-in') as HTMLTextAreaElement).value;

    // remove line breaks
    inputValue = inputValue.replace(/\n+/g, ' ');

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

                this._stencilForegroundContent += `<path>\n  `
                  + pathToLine.mxGraph.split('\n').join('\n  ')
                  + `\n</path>\n`
                  + `<fillstroke/>`;
                break;
              }
              case 'circle': {
                const ellipseW: number = fixFloatOverflow(+svgChild.attributes.r * 2);
                const ellipseX: number = fixFloatOverflow(+svgChild.attributes.cx - +svgChild.attributes.r);
                const ellipseY: number = fixFloatOverflow(+svgChild.attributes.cy - +svgChild.attributes.r);
                this._stencilForegroundContent += `<ellipse `
                  + `w="${ellipseW}" `
                  + `h="${ellipseW}" `
                  + `x="${ellipseX}" `
                  + `y="${ellipseY}" />\n`
                  + `<fillstroke/>`;
                break;
              }
              case 'rect':
              case 'ellipse':
              case 'line':
              case 'polyline':
              case 'polygon':
              default: console.error(`Engine doesn't yet cater for "${svgChild.name}"`, svgChild);
            }

            if ((know + 1) < svgJson.children.length) {
              this._stencilForegroundContent += '\n';
            }
          }

          this.outputMxGraph(svgJson);

          return svgJson;
        }
      )
      .catch(
        error => {
          console.error('svgson experience an error', error);
        }
      );
  }

  handleEvent(event: Event): void {
    if (event.type === 'click') {
      this.onConvert();
    }
  }

  outputMxGraph(svgObject: INode): void {
    let stencilContent;

    if ((pickById('include-full') as HTMLInputElement).checked) {
      stencilContent = `<shape w="${svgObject.attributes.width}" `
        + `h="${svgObject.attributes.height}" `
        + `aspect="fixed" strokewidth="inherit">\n`
        + `  <connections />\n  <background>\n    <fillstroke />\n  </background>\n`
        + `  <foreground>\n    `
        + this._stencilForegroundContent.replace(/\n/g, '\n    ')
        + `\n  </foreground>\n`
        + `</shape>`;
    } else {
      stencilContent = this._stencilForegroundContent;
    }

    (pickById('mx-out') as HTMLTextAreaElement).textContent = stencilContent;
  }
}

