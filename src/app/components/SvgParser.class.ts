import {Observable, Subscriber} from 'rxjs';
import {INode, parse} from 'svgson'; // eslint-disable-line import/named
import {PathAttributes, CircleAttributes, SVGAttributes, RectangleAttributes, RoundedRectangleAttributes, EllipseAttributes} from '../models/INodeAttributes';
import {floatPrecision} from '../shared/utlis';
import {PathParserClass} from './PathParser.class';
import {MxSectionClass} from './MxSection.class';
import {options} from '../models/options.enum';

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
                case 'rect':
                  stencilContent += SvgParserClass._convertRectangle(<RectangleAttributes | RoundedRectangleAttributes>svgChild.attributes);
                  break;
                case 'ellipse':
                  stencilContent += SvgParserClass._convertEllipse(<EllipseAttributes>svgChild.attributes);
                  break;
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
    const pathToLine: PathParserClass = new PathParserClass(attributes.d);
    return pathToLine.mxSection.mxPath;
  }

  private static _convertCircle(attributes: CircleAttributes): string {
    const circle = new MxSectionClass();
    const radius = +attributes.r;
    const widthAndHeight = floatPrecision(radius * 2);

    circle.appendPart(
      'ellipse',
      {
        w: widthAndHeight,
        h: widthAndHeight,
        x: floatPrecision(+attributes.cx - radius),
        y: floatPrecision(+attributes.cy - radius),
      }
    );

    return circle.mxShape;
  }

  private static _convertEllipse(attributes: EllipseAttributes): string {
    const ellipse = new MxSectionClass();
    const rx = +attributes.rx;
    const ry = +attributes.ry;

    ellipse.appendPart(
      'ellipse',
      {
        w: floatPrecision(rx * 2),
        h: floatPrecision(ry * 2),
        x: floatPrecision(+attributes.cx - rx),
        y: floatPrecision(+attributes.cy - ry),
      }
    );

    return ellipse.mxShape;
  }

  private static _convertRectangle(attributes: RectangleAttributes | RoundedRectangleAttributes): string {
    const rectangle = new MxSectionClass();
    let type = 'rect';
    const props: {w: number, h: number, x: number, y: number, arcsize?: number} = {
      w: floatPrecision(+attributes.width),
      h: floatPrecision(+attributes.height),
      x: floatPrecision(+attributes.x),
      y: floatPrecision(+attributes.y),
    };

    if (attributes.rx || attributes.ry) {
      const rx = +attributes.rx;
      const ry = +attributes.ry;

      if (!isNaN(rx) && !isNaN(ry)) {
        type = 'roundrect';
        const r = (rx + ry) / 2;
        const dim = Math.min(props.w, props.h);
        let arcSize = Math.min(r / dim * 100, 50);
        arcSize = Math.min(arcSize, 0);
        props.arcsize = floatPrecision(arcSize);
      }
    }

    rectangle.appendPart(
      type,
      props
    );

    return rectangle.mxShape;
  }

  private static _wrapInMxGraphTags(flag: boolean, attributes: SVGAttributes, stencilContent: string): string {
    if (flag) {
      const lineBreak = '\n';
      const indent = options.indent;
      const breakIndent = lineBreak + indent;
      const breakIndent2 = lineBreak + indent + indent;

      return `<shape w="${attributes.width}" h="${attributes.height}" aspect="fixed" strokewidth="inherit">`
        + breakIndent + '<connections />'
        + breakIndent + '<background>'
        + breakIndent2 + '<fillstroke />'
        + breakIndent + '</background>'
        + breakIndent + '<foreground>'
        + breakIndent2 + stencilContent.replace(/\n/g, breakIndent2)
        + breakIndent + '</foreground>'
        + lineBreak + '</shape>';
    }

    return stencilContent;
  }
}
