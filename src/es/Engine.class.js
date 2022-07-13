import {PathToLinesClass} from "./PathToLinesClass";
import {fixFloatOverflow, pickById} from "./utlis";
import {parse} from 'svgson';

export class EngineClass {
  /** @type {INode} */
  _svgObject = null;

  /** @type {string} */
  _stencilForegroundContent = '';

  constructor() {
  }

  start() {
    pickById('convert-btn').addEventListener('click', this);
  }

  onConvert() {
    this._stencilForegroundContent = '';
    parse(pickById('svg-in').value)
      .then(
        (svgJson) => {
          // When 2 or more svg objects are present
          if (svgJson instanceof Array)
            svgJson = svgJson[0];

          this._svgObject = svgJson;
          // console.log(svgJson);

          for (let know = 0; know < svgJson.children.length; know++) {
            const svgChild = svgJson.children[know];
            switch (svgChild.name) {
              case 'path':
                /** @type {PathToLinesClass} */
                const pathToLine = new PathToLinesClass(svgChild.attributes.d);

                this._stencilForegroundContent += `<path>\n  `
                  + pathToLine.mxGraph.split('\n').join('\n  ')
                  + `\n</path>\n`
                  + `<fillstroke/>`;
                break;
              case 'circle': {
                const ellipseW = fixFloatOverflow(svgChild.attributes.r * 2);
                const ellipseX = fixFloatOverflow(svgChild.attributes.cx - svgChild.attributes.r);
                const ellipseY = fixFloatOverflow(svgChild.attributes.cy - svgChild.attributes.r);
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
          return svgJson;
        }
      )
      .finally(
        () => {
          let stencilContent;

          if (pickById('include-full').checked) {
            stencilContent = `<shape w="${this._svgObject.attributes.width}" `
              + `h="${this._svgObject.attributes.height}" `
              + `aspect="fixed" strokewidth="inherit">\n`
              + `  <connections />\n  <background>\n    <fillstroke />\n  </background>\n`
              + `  <foreground>\n    `
              + this._stencilForegroundContent.replace(/\n/g, '\n    ')
              + `\n  </foreground>\n`
              + `</shape>`;
          } else {
            stencilContent = this._stencilForegroundContent;
          }

          pickById('mx-out').textContent = stencilContent;
        }
      )
      .catch(
        error => {
          console.error('svgson experience an error', error);
        }
      );
  }

  handleEvent(event) {
    if (event.type === 'click') {
      this.onConvert();
    }
  }
}

