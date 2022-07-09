import {PathToLinesClass} from "./PathToLinesClass";
import {pickById} from "./utlis";
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
    parse(this.taInputEl.textContent)
      .then(
        (svgJson) => {
          this.svgObject = svgJson;

          for (let know = 0; know < svgJson.children.length; know++) {
            const svgChild = svgJson.children[know];
            switch (svgChild.name) {
              case 'path':
                this.stencilForegroundContent = `<path>\n  `
                  + this._pathToLine.convert(svgChild.attributes.d).split('\n').join('\n  ')
                  + `\n</path>\n`
                  + `<fillstroke/>`;
                break;
            }
          }
          console.log(svgJson);
        }
      )
      .finally(
        () => {

          if (pickById('include-full').checked) {
            this.stencilContent = `<shape w="${this.svgObject.attributes.width}" `
              + `h="${this.svgObject.attributes.height}" `
              + `aspect="variable" strokewidth="inherit">\n`
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

