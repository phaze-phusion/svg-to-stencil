import {Observable, Subscriber} from 'rxjs';
import {INode, parse} from 'svgson'; // eslint-disable-line import/named
import {PathAttributes, CircleAttributes, SVGAttributes} from '../models/INode.interface';
import {fixFloatOverflow} from '../shared/utlis';
import {PathToLinesClass} from './PathToLines.class';

export class SvgParserClass {
  public incFullMxGraphTags = false;

  public app_convert(inputValue: string): Observable<string> {
    let stencilContent = '';

    return new Observable<string>((observer: Subscriber<string>) => {

      parse(inputValue)
        .then(
          (svgJsonObject: INode | INode[]) => {

            // When 2 or more svg objects are erroneously present
            if (svgJsonObject instanceof Array) {
              svgJsonObject = <INode>svgJsonObject[0];
            }

            const svgJson: INode = <INode>svgJsonObject;

            for (let waterBear = 0; waterBear < svgJson.children.length; waterBear++) {
              const svgChild = svgJson.children[waterBear];
              switch (svgChild.name) {
                case 'style':
                  console.info('Parser cannot parse Styles', svgChild);
                  break;
                case 'path':
                  stencilContent += SvgParserClass._convertPath(<PathAttributes>svgChild.attributes);
                  break;
                case 'circle':
                  stencilContent += SvgParserClass._convertCircle(<CircleAttributes>svgChild.attributes);
                  break;
                // case 'rect':
                // case 'ellipse':
                // case 'line':
                // case 'polyline':
                // case 'polygon':
                default:
                  console.error(`Parser doesn't yet cater for "${svgChild.name}"`, svgChild);
              }

              if ((waterBear + 1) < svgJson.children.length) {
                stencilContent += '\n';
              }
            }

            stencilContent = SvgParserClass._wrapInMxGraphTags(
              this.incFullMxGraphTags,
              <SVGAttributes>svgJson.attributes,
              stencilContent
            );

            observer.next(stencilContent);
            observer.complete();

            return svgJson;
          }
        )
        .catch(
          error => {
            console.error('svgson experience an error', error);
            observer.error(null);
            observer.complete();
          }
        );

    });
  }

  private static _convertPath(attributes: PathAttributes): string {
    const pathToLine: PathToLinesClass = new PathToLinesClass(attributes.d);

    return `<path>\n  `
      + pathToLine.p_output.split('\n').join('\n  ')
      + `\n</path>\n`
      + `<fillstroke/>`;
  }

  private static _convertCircle(attributes: CircleAttributes): string {
    const ellipseW: number = fixFloatOverflow(+attributes.r * 2);
    const ellipseX: number = fixFloatOverflow(+attributes.cx - +attributes.r);
    const ellipseY: number = fixFloatOverflow(+attributes.cy - +attributes.r);
    return `<ellipse `
      + `w="${ellipseW}" `
      + `h="${ellipseW}" `
      + `x="${ellipseX}" `
      + `y="${ellipseY}" />\n`
      + `<fillstroke/>`;
  }

  private static _wrapInMxGraphTags(flag: boolean, attributes: SVGAttributes, stencilContent: string): string {
    if (flag) {
      return `<shape w="${attributes.width}" `
        + `h="${attributes.height}" `
        + `aspect="fixed" strokewidth="inherit">\n`
        + `  <connections />\n  <background>\n    <fillstroke />\n  </background>\n`
        + `  <foreground>\n    `
        + stencilContent.replace(/\n/g, '\n    ')
        + `\n  </foreground>\n`
        + `</shape>`;
    }

    return stencilContent;
  }
}
