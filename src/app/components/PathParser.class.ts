import {MxSectionClass} from './MxSection.class';
import {Nullable, floatPrecision} from '../shared/utlis';
import {options} from '../models/options.enum';

export class PathParserClass {
  private _currentX = 0;
  private _currentY = 0;
  private _segmentStartX = 0;
  private _segmentStartY = 0;
  private _curveCenterX = 0;
  private _curveCenterY = 0;
  private readonly _mxSection: MxSectionClass;

  constructor(svgPath: string) {
    this._mxSection = new MxSectionClass();
    const normalizedPath = PathParserClass._normalizePath(svgPath);
    const splitPath = PathParserClass._splitPath(normalizedPath);
    // console.log(splitPath);
    this._parse(splitPath);
  }

  public get mxSection(): MxSectionClass {
    // console.log(this._mxSection);
    return this._mxSection;
  }

  private _parse(pathParts: PathPart[]): void {
    for (let kangaroo = 0; kangaroo < pathParts.length; kangaroo++) {
      const part: PathPart = pathParts[kangaroo];

      switch (part.type) {
        case 'M': // Move
        case 'L': // Line
        case 'H': // Horizontal line
        case 'V': this._pathBasics(part); break; // Vertical line
        case 'C': // Cubic Curve
        case 'S': this._pathCubic(part); break; // Cubic Smooth Curve
        case 'Q': // Quadratic Curve
        case 'T': this._pathQuad(part); break; // Quadratic Smooth Curve
        case 'A': this._pathArc(part); break; // Arc
        case 'Z': this._pathClose(); break; // End path
        // default:
        //   this._removeWhitespace();
      }

      if ((kangaroo + 1) === options.pathLengthLimit) {
        console.warn('Path length limit reached');
      }
    }
  }

  /**
   * Handle SVG LineTo paths m/M, l/L, h/H, v/V
   *
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataLinetoCommands
   */
  private _pathBasics(part: PathPart): void {
    let x = null;
    let y = null;

    if (part.type === 'M' || part.type === 'L') {
      x = part.values[0];
      y = part.values[1];

      if (part.relative) {
        x += this._currentX;
        y += this._currentY;
      }
    } else if (part.type === 'H' || part.type === 'V') {
      if (part.type === 'H') {
        x = part.values[0] + (part.relative ? this._currentX : 0);
      } else { // if (forPath === 'v')
        y = part.values[0] + (part.relative ? this._currentY : 0);
      }
    } else {
      throw new Error(`PathBasics error for '${part.type}'`);
    }

    if (part.type === 'M') {
      this._segmentStartX = <number>x;
      this._segmentStartY = <number>y;
    }

    this._setCoordinates(x, y);

    this._mxSection.appendPart(
      part.type !== 'M' ? 'line' : 'move',
      {
        x: this._currentX,
        y: this._currentY,
      }
    );
  }

  /**
   * Handle the SVG Cubic bezier path c/C and s/S
   *
   * The regular Curve has this form:
   *    C x1 y1 x2 y2 x y
   * or
   *    c dx1 dy1 dx2 dy2 dx dy
   *
   * The Smooth cubic curve has this form:
   *    S x2 y2 x y
   * or
   *    s dx2 dy2 dx dy
   *
   * Note: Cubic Smooth curves can only come after a Cubic Curve, and they have values in multiples of 4
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
   */
  private _pathCubic(pathPart: PathPart): void {
    if (pathPart.type === 'C') {
      this._pathCubicCompiler(pathPart);
      return;
    }

    const valuesPerSection = 4;
    for (let ostrich = 0; 0 < pathPart.values.length; ostrich + valuesPerSection) {
      const next4Values = pathPart.values.splice(0, valuesPerSection);
      this._pathCubicCompiler(new PathPartValues(pathPart, next4Values));
    }

    if (pathPart.values.length) {
      console.error('pathCubic error', pathPart);
    }
  }

  /**
   * Compile the Stencil Cubic Curve XML
   */
  private _pathCubicCompiler(part: PathPart): void {
    const isSmooth = part.type === 'S';
    const values = this._addSmoothValues(isSmooth, part.values);
    const coords: {x1: number, y1: number, x2: number, y2: number, x3: number, y3: number} = {
      x1: values[0],
      y1: values[1],
      x2: values[2],
      y2: values[3],
      x3: values[4],
      y3: values[5],
    };

    if (part.relative) {
      if (!isSmooth) {
        coords.x1 = this._addToX(coords.x1);
        coords.y1 = this._addToY(coords.y1);
      }
      coords.x2 = this._addToX(coords.x2);
      coords.y2 = this._addToY(coords.y2);
      coords.x3 = this._addToX(coords.x3);
      coords.y3 = this._addToY(coords.y3);
    }

    this._setCurveCenter(coords.x2, coords.y2);
    this._setCoordinates(coords.x3, coords.y3);

    this._mxSection.appendPart(
      'curve',
      coords
    );
  }

  /**
   * Handle the SVG Quadratic curve path q/Q and t/T
   * The regular quadratic curve has this form:
   *    Q x1 y1, x y
   * or
   *    q dx1 dy1, dx dy
   *
   * The smooth quadratic curve has this form:
   *    T x y
   * or
   *    t dx dy
   *
   * Note: Quadratic Smooth curves can only come after a Quadratic Curve, and they have values in multiples of 2
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataQuadraticBezierCommands
   */
  private _pathQuad(part: PathPart): void {
    if (part.type === 'Q') {
      this._pathQuadCompiler(part);
      return;
    }

    const valuesPerSection = 2;
    for (let dromedary = 0; 0 < part.values.length; dromedary + valuesPerSection) {
      const next2Values = part.values.splice(0, valuesPerSection);
      this._pathQuadCompiler(new PathPartValues(part, next2Values));
    }

    if (part.values.length) {
      console.error('pathQuad error', part);
    }
  }

  /**
   * Compile the Stencil Quadratic Curve XML
   */
  private _pathQuadCompiler(part: PathPart): void {
    const isSmooth = part.type === 'T';
    const values = this._addSmoothValues(isSmooth, part.values);
    const coords: {x1: number, y1: number, x2: number, y2: number} = {
      x1: values[0],
      y1: values[1],
      x2: values[2],
      y2: values[3],
    };

    if (part.relative) {
      if (!isSmooth) {
        coords.x1 = this._addToX(coords.x1);
        coords.y1 = this._addToY(coords.y1);
      }
      coords.x2 = this._addToX(coords.x2);
      coords.y2 = this._addToY(coords.y2);
    }

    this._setCurveCenter(coords.x1, coords.y1);
    this._setCoordinates(coords.x2, coords.y2);

    this._mxSection.appendPart(
      'quad',
      coords
    );
  }

  /**
   * Handle the SVG Arc path 'a'/'A'
   * It has this form:
   *    A rx ry x-axis-rotation large-arc-flag sweep-flag x y
   * or
   *    a rx ry x-axis-rotation large-arc-flag sweep-flag dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#arcs
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
   */
  private _pathArc(part: PathPart): void {
    const values = part.values;
    const coords: {
      rx: number,
      ry: number,
      'x-axis-rotation': number,
      'large-arc-flag': number,
      'sweep-flag': number,
      x: number,
      y: number
    } = {
      rx: values[0],
      ry: values[1],
      'x-axis-rotation': values[2],
      'large-arc-flag': values[3],
      'sweep-flag': values[4],
      x: values[5],
      y: values[6],
    };

    if (part.relative) {
      coords.x = this._addToX(coords.x);
      coords.y = this._addToY(coords.y);
    }

    this._setCoordinates(coords.x, coords.y);

    if (coords.rx > 0 && coords.ry > 0) {
      this._setCurveCenter(this._currentX, this._currentY);
    }

    this._mxSection.appendPart(
      'arc',
      coords
    );
  }

  /**
   * Handle SVG close path z/Z
   */
  private _pathClose(): void {
    if (this._segmentStartX !== this._currentX || this._segmentStartY !== this._currentY) {
      // Close the path with a line
      // this._pathBasics(new PathPart(
      //   'L',
      //   false,
      //   [this._segmentStartX, this._segmentStartY]
      // ));
      // OR just update the current coordinates and let the drawing engine handle the joining line
      this._setCoordinates(this._segmentStartX, this._segmentStartY);
    }

    this._mxSection.appendPart(
      'close',
      {}
    );
  }

  private static _normalizePath(svgPath: string): string {
    while (svgPath.match(/\.\d+\./g) !== null) {
      svgPath = svgPath.replace(/(\.\d+)\./g, '$1 0.');
    }

    svgPath = svgPath.replace(/\n+/g, ' ')
      .replace(/[^a-zA-Z0-9.-]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/([a-z-])\./ig, '$10.')
      .replace(/([0-9])-/g, '$1 -');

    return svgPath;
  }

  private static _splitPath(svgPath: string): PathPart[] {
    const parts: PathPart[] = [];

    for (let safetyStop = 0; safetyStop < options.pathLengthLimit && svgPath.length > 0; safetyStop++) {
      const charEnd = svgPath.slice(1).search(/[a-z]/i) + 1;
      const tmpPart = svgPath.substring(0, charEnd);
      const typeUppercase = tmpPart[0].toUpperCase();
      const isRelative = typeUppercase !== tmpPart[0];

      parts.push(new PathPart(
        typeUppercase,
        isRelative,
        tmpPart.slice(1).split(' ').map((v: string): number => +v)
      ));
      svgPath = svgPath.slice(charEnd);

      if (svgPath.length === 1 && (svgPath === 'z' || svgPath === 'Z')) {
        const closeUpper = svgPath.toUpperCase();
        const closeIsRelative = closeUpper === svgPath;
        parts.push(new PathPart(closeUpper, closeIsRelative, [0]));
        break;
      }
    }

    return parts;
  }

  /**
   * Set the X and Y coordinates to use in relative calculations
   */
  private _setCoordinates(x: Nullable<number> = null, y: Nullable<number> = null) {
    if (x !== null) {
      this._currentX = floatPrecision(x);
    }
    if (y !== null) {
      this._currentY = floatPrecision(y);
    }
  }

  private _setCurveCenter(x: number, y: number) {
    this._curveCenterX = x;
    this._curveCenterY = y;
  }

  private _addSmoothValues(isSmooth: boolean, values: number[]): number[] {
    if (isSmooth) {
      values = [
        floatPrecision(this._currentX * 2 - this._curveCenterX), // x1
        floatPrecision(this._currentY * 2 - this._curveCenterY), // y1
        ...values,
      ];
    }
    return values;
  }

  private _addToX(value: number): number {
    return floatPrecision(this._currentX + value);
  }

  private _addToY(value: number): number {
    return floatPrecision(this._currentY + value);
  }
}

class PathPart {
  constructor(
    public type: string,
    public relative: boolean,
    public values: number[]
  ) {
  }
}

class PathPartValues extends PathPart implements PathPart{
  constructor(
    parentPathPart: PathPart,
    values: number[]
  ) {
    super(parentPathPart.type, parentPathPart.relative, values);
  }
}
