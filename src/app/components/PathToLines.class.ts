import {fixFloatOverflow} from '../shared/utlis';
import {PathRegexClass} from './PathRegex.class';

/*
 * Credit to jgraph/svg2xml on Github [https://github.com/jgraph/svg2xml/blob/merge/src/com/mxgraph/svg2xml/mxPathParser.java]
 * which helped me a lot to figure out how to calculate the coordinates for the curves
 */

export class PathToLinesClass {
  private _currentX: number;
  private _currentY: number;
  private _curveCenterX = 0;
  private _curveCenterY = 0;
  private _isRelative = true;

  private static readonly _pathLengthLimit = 250;

  public p_output: string;

  constructor(private _svgPath: string) {
    this._currentX = 0;
    this._currentY = 0;
    this.p_output = '';
    this._convert();
  }

  private _convert(): void {
    for (let safeBreak = 0; safeBreak < PathToLinesClass._pathLengthLimit && this._svgPath.length > 0; safeBreak++) {
      const char = this._svgPath[0].toLowerCase();
      this._isRelative = char === this._svgPath[0];

      switch (char) {
        // Move
        case 'm': this._pathBasics('m', false); break;
        // Line
        case 'l': this._pathBasics('l'); break;
        // Horizontal line
        case 'h': this._pathBasics('h'); break;
        // Vertical line
        case 'v': this._pathBasics('v'); break;
        // Cubic Curve
        case 'c': this._pathCubic(); break;
        // Cubic Smooth Curve
        case 's': this._pathCubicSmooth(); break;
        // Quadratic Curve
        case 'q': this._pathQuadratic(); break;
        // Quadratic Smooth Curve
        case 't': this._pathQuadraticSmooth(); break;
        // Arc
        case 'a': this._pathArc(); break;
        // End path
        case 'z': this._pathClose(); break;
        default:
          this._removeWhitespace();
      }

      if ((safeBreak + 1) === PathToLinesClass._pathLengthLimit) {
        console.warn('Path length limit reached');
      }
    }

    this.p_output = this.p_output.trim();
  }

  private _removeWhitespace() {
    const whitespaceMatches = this._svgPath.match(PathRegexClass.p_leadingWhitespace);
    if (whitespaceMatches === null) {
      console.error('Whitespace: matches is null');
      return;
    }
    // console.log('whitespaceMatches', whitespaceMatches);
    this._cutCharsFromFront(whitespaceMatches[0].length);
  }

  /**
   * Handle SVG LineTo paths m/M, l/L, h/H, v/V
   *
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataLinetoCommands
   */
  private _pathBasics(forPath: string, penDown = true): void {
    let matches;
    let x = null;
    let y = null;

    if (forPath === 'm' || forPath === 'l') {
      matches = this._svgPath.match(PathRegexClass.p_lmLine);

      if (matches === null) {
        console.error('Path Basic: matches is null for "m" or "l"');
        return;
      }

      const values = PathToLinesClass._valueInMultipleMatches(matches);
      // console.log('lineMatches', matches);
      // console.log('lineValues', values);

      x = values[0];
      y = values[1];

      if (this._isRelative) {
        x += this._currentX;
        y += this._currentY;
      }

    } else if (forPath === 'h' || forPath === 'v') {
      matches = this._svgPath.match(PathRegexClass.p_hvLine);

      if (matches === null) {
        console.error('Path Basic: matches is null for "h" or "v"');
        return;
      }

      const values = PathToLinesClass._valueInMultipleMatches(matches);
      // console.log('singleMatches', matches);
      // console.log('singleValues', values);

      if (forPath === 'h') {
        x = values[0] + (this._isRelative ? this._currentX : 0);
      } else { // if (forPath === 'v')
        y = values[0] + (this._isRelative ? this._currentY : 0);
      }
    } else {
      throw new Error('Method only caters for paths m, l, v and h');
    }

    this._setCoordinates(x, y);
    this._cutCharsFromFront(matches[0].length);

    this.p_output += `<${penDown ? 'line' : 'move'} x="${this._currentX}" y="${this._currentY}"/>\n`;
  }

  /**
   * Write the Stencil Cubic Curve XML
   * @param {number[]} values    6 values when called by Cubic, 4 values when called by Cubic Smooth
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  private _cubicWriter(values: number[], isSmooth: boolean) {
    if (isSmooth) {
      values = [
        this._currentX * 2 - this._curveCenterX, // x1
        this._currentY * 2 - this._curveCenterY, // y1
        ...values,
      ];
    }

    const coords: {x1: number, y1: number, x2: number, y2: number, x: number, y: number} = {
      x1: values[0],
      y1: values[1],
      x2: values[2],
      y2: values[3],
      x: values[4],
      y: values[5],
    };

    if (this._isRelative) {
      if (!isSmooth) {
        coords.x1 = fixFloatOverflow(this._currentX + coords.x1);
        coords.y1 = fixFloatOverflow(this._currentY + coords.y1);
      }
      coords.x2 = fixFloatOverflow(this._currentX + coords.x2);
      coords.y2 = fixFloatOverflow(this._currentY + coords.y2);
      coords.x = fixFloatOverflow(this._currentX + coords.x);
      coords.y = fixFloatOverflow(this._currentY + coords.y);
    }

    this._curveCenterX = coords.x2;
    this._curveCenterY = coords.y2;

    this._setCoordinates(coords.x, coords.y);

    this.p_output += `<curve `
      + `x1="${coords.x1}" y1="${coords.y1}" `
      + `x2="${coords.x2}" y2="${coords.y2}" `
      + `x3="${coords.x}" y3="${coords.y}"/>\n`;
  }

  /**
   * Handle the SVG Cubic Curve bezier path c/C
   * It has this form:
   *    C x1 y1 x2 y2 x y
   * or
   *    c dx1 dy1 dx2 dy2 dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
   */
  private _pathCubic(): void {
    // console.log('this.svgPath', this.svgPath);
    const cubicMatches = this._svgPath.match(PathRegexClass.p_cubic);
    // console.log('cubicMatches', cubicMatches);
    if (cubicMatches === null) {
      console.error('Path C: cubicMatches is null');
      return;
    }
    this._cutCharsFromFront(cubicMatches[0].length);
    this._cubicWriter(
      PathToLinesClass._valueInMultipleMatches(cubicMatches),
      false
    );
  }

  /**
   * Handle the SVG Cubic Smooth curve bezier path s/S
   * Cubic Smooth curves can only come after a Cubic Curve, and they have values in multiples of 4
   * It has this form:
   *    S x2 y2 x y
   * or
   *    s dx2 dy2 dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
   */
  private _pathCubicSmooth(): void {
    // Match the first multiple of 4 in the line as it has a different form to the rest
    const cubicSmoothFirstMultiple = this._svgPath.match(PathRegexClass.p_cubicSmoothFirst);

    if (cubicSmoothFirstMultiple === null) {
      console.error('Path S: first multiple is null');
      return;
    }

    // Cut the first multiple of 4 from the front of the line
    this._cutCharsFromFront(cubicSmoothFirstMultiple[0].length);
    this._cubicWriter(
      PathToLinesClass._valueInMultipleMatches(cubicSmoothFirstMultiple),
      true
    );

    // If the next character in the line is a letter then there are no more cubic smooth curve values to extract
    if (this._hasNoMoreNumberComing()) {
      return;
    }

    for (let safetyBreak = 0; safetyBreak < 20; safetyBreak++) {
      const cubicSmoothRest = this._svgPath.match(PathRegexClass.p_cubicSmoothRest);
      if (cubicSmoothRest === null) {
        console.error('Path S: rest is null');
        break;
      }

      this._cutCharsFromFront(cubicSmoothRest[0].length);
      this._cubicWriter(PathToLinesClass._valueInMultipleMatches(cubicSmoothRest), true);

      if (this._hasNoMoreNumberComing()) {
        break;
      }
    }
  }

  /**
   * Write the Stencil Quadratic Curve XML
   * @param {number[]} values    4 values when called by Quad, 2 values when called by Quad Smooth
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  private _quadWriter(values: number[], isSmooth: boolean) {
    if (isSmooth) {
      values = [
        this._currentX * 2 - this._curveCenterX, // x1
        this._currentY * 2 - this._curveCenterY, // y1
        ...values,
      ];
    }

    const coords: {x1: number, y1: number, x: number, y: number} = {
      x1: values[0],
      y1: values[1],
      x: values[2],
      y: values[3],
    };

    if (this._isRelative) {
      if (!isSmooth) {
        coords.x1 = fixFloatOverflow(this._currentX + coords.x1);
        coords.y1 = fixFloatOverflow(this._currentY + coords.y1);
      }
      coords.x = fixFloatOverflow(this._currentX + coords.x);
      coords.y = fixFloatOverflow(this._currentY + coords.y);
    }

    this._curveCenterX = coords.x1;
    this._curveCenterY = coords.y1;

    this._setCoordinates(coords.x, coords.y);

    this.p_output += `<quad `
      + `x1="${coords.x1}" y1="${coords.y1}" `
      + `x2="${this._currentX}" y2="${this._currentY}"/>\n`;
  }

  /**
   * Handle the SVG Quadratic curve path q/Q
   * It has this form:
   *    Q x1 y1, x y
   * or
   *    q dx1 dy1, dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataQuadraticBezierCommands
   */
  private _pathQuadratic() {
    const quadraticMatches = this._svgPath.match(PathRegexClass.p_quad);
    if (quadraticMatches === null) {
      console.error('Path Q: quadraticMatches is null');
      return;
    }
    // console.log('quadraticMatches', quadraticMatches);
    // console.log('quadValues', quadValues);
    this._cutCharsFromFront(quadraticMatches[0].length);
    this._quadWriter(
      PathToLinesClass._valueInMultipleMatches(quadraticMatches),
      false
    );
  }

  /**
   * Handle the SVG Quadratic Smooth curve path t/T
   * Quadratic Smooth curves can only come after a Quadratic Curve, and they have values in multiples of 2
   * It has this form:
   *    T x y
   * or
   *    t dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataQuadraticBezierCommands
   */
  private _pathQuadraticSmooth(): void {

    // Match the first multiple of 2 in the line as it has a different form to the rest
    const quadSmoothFirstMultiple = this._svgPath.match(PathRegexClass.p_quadSmoothFirst);
    // console.log('quadSmoothFirstMultiple', quadSmoothFirstMultiple);

    if (quadSmoothFirstMultiple === null) {
      console.error('Path T: first multiple is null');
      return;
    }

    // Cut the first multiple of 2 from the front of the line
    this._cutCharsFromFront(quadSmoothFirstMultiple[0].length);
    this._quadWriter(
      PathToLinesClass._valueInMultipleMatches(quadSmoothFirstMultiple),
      true
    );

    // If the next character in the line is a letter or whitespace then there are no more smooth curve values to extract
    if (this._hasNoMoreNumberComing()) {
      return;
    }

    for (let safetyBreak = 0; safetyBreak < 20; safetyBreak++) {
      const quadSmoothRest = this._svgPath.match(PathRegexClass.p_quadSmoothRest);

      if (quadSmoothRest === null) {
        console.error('Path T: rest is null');
        break;
      }

      this._cutCharsFromFront(quadSmoothRest[0].length);
      this._quadWriter(PathToLinesClass._valueInMultipleMatches(quadSmoothRest), true);

      if (this._hasNoMoreNumberComing()) {
        break;
      }
    }
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
  private _pathArc(): void {
    const arcMatches = this._svgPath.match(PathRegexClass.p_arc);

    if (arcMatches === null) {
      console.error('Path A: arcMatches is null');
      return;
    }

    this._cutCharsFromFront(arcMatches[0].length);
    const arcValues = PathToLinesClass._valueInMultipleMatches(arcMatches);
    // console.log('arcMatches', arcMatches);
    // console.log('arcValues', arcValues);

    const coords: {rx: number, ry: number, deg: number, af: number, sf: number, x: number, y: number} = {
      rx: arcValues[0],
      ry: arcValues[1],
      deg: arcValues[2],
      af: arcValues[3],
      sf: arcValues[4],
      x: arcValues[5],
      y: arcValues[6],
    };

    if (this._isRelative) {
      coords.x = fixFloatOverflow(this._currentX + coords.x);
      coords.y = fixFloatOverflow(this._currentY + coords.y);
    }

    this._setCoordinates(coords.x, coords.y);

    if (coords.rx > 0 && coords.ry > 0) {
      this._curveCenterX = this._currentX;
      this._curveCenterY = this._currentY;
    }

    this.p_output += `<arc `
      + `rx="${coords.rx}" ry="${coords.ry}" `
      + `x-axis-rotation="${coords.deg}" `
      + `large-arc-flag="${coords.af}" `
      + `sweep-flag="${coords.sf}" `
      + `x="${this._currentX}" y="${this._currentY}"/>\n`;
  }

  /**
   * Handle SVG close path z/Z
   */
  private _pathClose(): void {
    this._cutCharsFromFront(1);
    this.p_output += `<close/>\n`;
  }

  private _hasNoMoreNumberComing() {
    return this._svgPath.match(PathRegexClass.p_nextIsALetter) !== null;
  }

  private static _valueInMultipleMatches(matches: string[]): number[] {
    // console.log('valueInMultipleMatches matches', matches);
    const valueArr = [];
    for (let bushPig = 1; bushPig < matches.length; bushPig++) {
      for (let piglet = 0; piglet < PathRegexClass.p_matchesPerRegexValue; piglet++) {
        const matchToTest = matches[bushPig + piglet];
        if (typeof matchToTest !== 'undefined') {
          valueArr.push(+matchToTest);
          bushPig += (PathRegexClass.p_matchesPerRegexValue - piglet - 1); // advance outer for-loop minus 1 for outer loops iterator
          break;
        }
      }
    }
    return valueArr;
  }

  /**
   * Remove strings from front of working SVG path
   */
  private _cutCharsFromFront(indexStart: number) {
    this._svgPath = this._svgPath.substring(indexStart);
  }

  /**
   * Set the X and Y coordinates to use in relative calculations
   */
  private _setCoordinates(x: number|null = null, y: number|null = null) {
    if (x !== null) {
      this._currentX = fixFloatOverflow(x);
    }
    if (y !== null) {
      this._currentY = fixFloatOverflow(y);
    }
  }
}
