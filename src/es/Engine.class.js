import {PathToLinesClass} from "./PathToLinesClass";
import {fixFloatOverflow, pickById} from "./utlis";
import {parse, INode} from 'svgson';

export class EngineClass {
  /** @type {HTMLTextAreaElement} */
  taInputEl = null;

  /** @type {HTMLTextAreaElement} */
  taOutputEl = null;

  /** @type {INode} */
  svgObject = null;

  /** @type {string} */
  stencilForegroundContent = '';

  /** @type {string} */
  stencilContent = '';

  /** @type {PathToLinesClass} */
  _pathToLine = new PathToLinesClass();

  constructor() {
  }

  start() {
    this.taInputEl = pickById('svg-in');
    this.taOutputEl = pickById('mx-out');
    pickById('convert-btn').addEventListener('click', this);
  }

  onConvert() {
    this.stencilForegroundContent = '';
    parse(this.taInputEl.value)
      .then(
        (svgJson) => {
          // When 2 or more svg objects are present
          if (svgJson instanceof Array)
            svgJson = svgJson[0];

          this.svgObject = svgJson;
          // console.log(svgJson);

          for (let know = 0; know < svgJson.children.length; know++) {
            const svgChild = svgJson.children[know];
            switch (svgChild.name) {
              case 'path':
                this.stencilForegroundContent += `<path>\n  `
                  + this._pathToLine.convert(svgChild.attributes.d).split('\n').join('\n  ')
                  + `\n</path>\n`
                  + `<fillstroke/>`;
                break;
              case 'circle':
                const ellipseW = fixFloatOverflow(svgChild.attributes.r * 2);
                const ellipseX = fixFloatOverflow(svgChild.attributes.cx - svgChild.attributes.r);
                const ellipseY = fixFloatOverflow(svgChild.attributes.cy - svgChild.attributes.r);
                this.stencilForegroundContent += `<ellipse `
                  + `w="${ellipseW}" `
                  + `h="${ellipseW}" `
                  + `x="${ellipseX}" `
                  + `y="${ellipseY}" />\n`
                  + `<fillstroke/>`;
                break;
              case 'rect':
              case 'ellipse':
              case 'line':
              case 'polyline':
              case 'polygon':
              default: console.error(`Engine doesn't yet cater for "${svgChild.name}"`, svgChild);
            }

            if ((know + 1) < svgJson.children.length) {
              this.stencilForegroundContent += '\n'
            }
          }
        }
      )
      .finally(
        () => {

          if (pickById('include-full').checked) {
            this.stencilContent = `<shape w="${this.svgObject.attributes.width}" `
              + `h="${this.svgObject.attributes.height}" `
              + `aspect="fixed" strokewidth="inherit">\n`
              + `  <connections />\n  <background>\n    <fillstroke />\n  </background>\n`
              + `  <foreground>\n    `
              + this.stencilForegroundContent.replace(/\n/g, '\n    ')
              + `\n  </foreground>\n`
              + `</shape>`

          } else {
            this.stencilContent = this.stencilForegroundContent;
          }

          this.taOutputEl.textContent = this.stencilContent;
        }
      )
  }

  handleEvent(event) {
    if (event.type === 'click') {
      this.onConvert();
    }
  }
}

