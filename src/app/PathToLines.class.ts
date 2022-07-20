import {fixFloatOverflow} from './shared/utlis';

/*
 * jgraph/svg2xml on Github [https://github.com/jgraph/svg2xml/blob/merge/src/com/mxgraph/svg2xml/mxPathParser.java]
 * helped me a lot to figure out how to calculate the coordinates for the curves
 */

export class PathToLinesClass {
  private currentX: number;
  private currentY: number;
  private curveCenterX = 0;
  private curveCenterY = 0;
  private isRelative = true;

  private static readonly pathLengthLimit = 250;
  private static readonly matchesPerRegexValue = 4; // From the regex a value can come from N separate match indexes
  private static readonly pathFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
  private static readonly pathRest = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
  private static readonly regexFlags = ' (([01])|(W)|(W))'; // (W) is used to fill up the matches to the same length as the rest (used for arcs)

  private static readonly regexLine = new RegExp(
    '^[lmLM]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest
  );

  private static readonly regexSingle = new RegExp(
    '^[hvHV]'
    + PathToLinesClass.pathFirst
  );

  private static readonly regexCubicCurve = new RegExp(
    '^[cC]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest.repeat(5)
  );

  private static readonly regexCubicSmooth = new RegExp(
    '[sS]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest.repeat(3)
  );

  private static readonly regexCubicSmoothRest = new RegExp(
    '^'
    + PathToLinesClass.pathRest.repeat(4)
  );

  private static readonly regexQuadraticCurve = new RegExp(
    '^[qQ]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest.repeat(2)
  );

  private static readonly regexQuadraticSmooth = new RegExp(
    '[tT]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest.repeat(3)
  );

  private static readonly regexQuadraticSmoothRest = new RegExp(
    '^'
    + PathToLinesClass.pathRest.repeat(4)
  );


  private static readonly regexArc = new RegExp(
    '^[aA]'
    + PathToLinesClass.pathFirst
    + PathToLinesClass.pathRest.repeat(2)
    + PathToLinesClass.regexFlags.repeat(2)
    + PathToLinesClass.pathRest.repeat(2)
  );

  public mxGraph: string;

  constructor(private svgPath: string) {
    this.currentX = 0;
    this.currentY = 0;
    this.mxGraph = '';
    this.convert();
  }

  private convert(): void {
    for (let safeBreak = 0; safeBreak < PathToLinesClass.pathLengthLimit && this.svgPath.length > 0; safeBreak++) {
      const char = this.svgPath[0].toLowerCase();
      this.isRelative = char === this.svgPath[0];

      switch (char) {
        // Move
        case 'm': this.pathBasics('m', false); break;
        // Line
        case 'l': this.pathBasics('l'); break;
        // Horizontal line
        case 'h': this.pathBasics('h'); break;
        // Vertical line
        case 'v': this.pathBasics('v'); break;
        // Cubic Curve
        case 'c': this.pathCubicCurve(); break;
        // Smooth Curve
        case 's': this.pathSmoothCurve(); break;
        // // Quadratic Curve
        case 'q': this.pathQuadraticCurve(); break;
        // Arc
        case 'a': this.pathArc(); break;
        // End path
        case 'z': this.pathClose(); break;
      }

      if ((safeBreak + 1) === PathToLinesClass.pathLengthLimit) {
        console.warn('Path length limit reached');
      }
    }

    this.mxGraph = this.mxGraph.trim();
  }

  /**
   * Handle SVG LineTo paths m/M, l/L, h/H, v/V
   *
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataLinetoCommands
   */
  private pathBasics(forPath: string, penDown = true): void {
    let matches;
    let x = null;
    let y = null;

    if (forPath === 'm' || forPath === 'l') {
      matches = this.svgPath.match(PathToLinesClass.regexLine);

      if (matches === null) {
        console.error('Path Basic: matches is null for "m" or "l"');
        return;
      }

      const values = PathToLinesClass.valueInMultipleMatches(matches);
      // console.log('lineMatches', matches);
      // console.log('lineValues', values);

      x = values[0];
      y = values[1];

      if (this.isRelative) {
        x += this.currentX;
        y += this.currentY;
      }

    } else if (forPath === 'h' || forPath === 'v') {
      matches = this.svgPath.match(PathToLinesClass.regexSingle);

      if (matches === null) {
        console.error('Path Basic: matches is null for "h" or "v"');
        return;
      }

      const values = PathToLinesClass.valueInMultipleMatches(matches);
      // console.log('singleMatches', matches);
      // console.log('singleValues', values);

      if (forPath === 'h') {
        x = values[0] + (this.isRelative ? this.currentX : 0);
      } else { // if (forPath === 'v')
        y = values[0] + (this.isRelative ? this.currentY : 0);
      }
    } else {
      throw new Error('Method only caters for paths m, l, v and h');
    }

    this.setCoordinates(x, y);
    this.cutCharsFromFront(matches[0].length);

    this.mxGraph += `<${penDown ? 'line' : 'move'} x="${this.currentX}" y="${this.currentY}"/>\n`;
  }

  /**
   * Write the Stencil Curve XML
   * @param {number[]} values    4 values when called by Smooth Curve and 6 values when called by cubic curve
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  private curveWriter(values: number[], isSmooth: boolean) {
    if (isSmooth) {
      values = [
        this.currentX * 2 - this.curveCenterX, // x1
        this.currentY * 2 - this.curveCenterY, // y1
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

    if (this.isRelative) {
      if (!isSmooth) {
        coords.x1 = fixFloatOverflow(this.currentX + coords.x1);
        coords.y1 = fixFloatOverflow(this.currentY + coords.y1);
      }
      coords.x2 = fixFloatOverflow(this.currentX + coords.x2);
      coords.y2 = fixFloatOverflow(this.currentY + coords.y2);
      coords.x = fixFloatOverflow(this.currentX + coords.x);
      coords.y = fixFloatOverflow(this.currentY + coords.y);
    }

    this.curveCenterX = coords.x2;
    this.curveCenterY = coords.y2;

    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<curve `
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
  private pathCubicCurve(): void {
    // console.log('this.svgPath', this.svgPath);
    const cubicMatches = this.svgPath.match(PathToLinesClass.regexCubicCurve);
    // console.log('cubicMatches', cubicMatches);
    if (cubicMatches === null) {
      console.error('Path C: cubicMatches is null');
      return;
    }
    this.cutCharsFromFront(cubicMatches[0].length);
    this.curveWriter(
      PathToLinesClass.valueInMultipleMatches(cubicMatches),
      false
    );
  }

  /**
   * Handle the SVG Smooth Curve bezier path s/S
   * Smooth curves can only come after a Cubic Curve, and they have values in multiples of 4
   * It has this form:
   *    S x2 y2 x y
   * or
   *    s dx2 dy2 dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
   */
  private pathSmoothCurve(): void {
    // Match the first multiple of 4 in the line as it has a different form to the rest
    const smoothFirstMultiple = this.svgPath.match(PathToLinesClass.regexCubicSmooth);

    if (smoothFirstMultiple === null) {
      console.error('Path S: smoothFirstMultiple is null');
      return;
    }

    // Cut the first multiple of 4 from the front of the line
    this.cutCharsFromFront(smoothFirstMultiple[0].length);
    this.curveWriter(
      PathToLinesClass.valueInMultipleMatches(smoothFirstMultiple),
      true
    );

    // If the next character in the line is a letter then there are no more smooth curve values to extract
    if (this.svgPath.substring(0, 1).match(/[a-z]/i)) {
      return;
    }

    for (let safetyBreak = 0; safetyBreak < 20; safetyBreak++) {
      try {
        const smoothMatches = this.svgPath.match(PathToLinesClass.regexCubicSmoothRest);
        if (smoothMatches === null) {
          console.error('Path S: smoothMatches is null');
          break;
        }
        this.cutCharsFromFront(smoothMatches[0].length);
        this.curveWriter(
          PathToLinesClass.valueInMultipleMatches(smoothMatches),
          true
        );
      } catch {
        break;
      }
    }
  }

  /**
   * Handle the SVG Quadratic curve path 'q'/'Q'
   * It has this form:
   *    Q x1 y1, x y
   * or
   *    q dx1 dy1, dx dy
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#curve_commands
   * @see https://www.w3.org/TR/SVG/paths.html#PathDataQuadraticBezierCommands
   */
  private pathQuadraticCurve() {
    const quadraticMatches = this.svgPath.match(PathToLinesClass.regexQuadraticCurve);

    if (quadraticMatches === null) {
      console.error('Path Q: quadraticMatches is null');
      return;
    }

    this.cutCharsFromFront(quadraticMatches[0].length);
    const quadValues = PathToLinesClass.valueInMultipleMatches(quadraticMatches);
    // console.log('quadraticMatches', quadraticMatches);
    // console.log('quadValues', quadValues);

    const coords: {x1: number, y1: number, x: number, y: number} = {
      x1: quadValues[0],
      y1: quadValues[1],
      x: quadValues[2],
      y: quadValues[3],
    };

    if (this.isRelative) {
      coords.x1 = fixFloatOverflow(this.currentX + coords.x1);
      coords.y1 = fixFloatOverflow(this.currentY + coords.y1);
      coords.x = fixFloatOverflow(this.currentX + coords.x);
      coords.y = fixFloatOverflow(this.currentY + coords.y);
    }

    this.curveCenterX = this.currentX;
    this.curveCenterY = this.currentY;

    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<quad `
      + `x1="${coords.x1}" y1="${coords.y1}" `
      + `x2="${this.currentX}" y2="${this.currentY}"/>\n`;
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
  private pathArc(): void {
    const arcMatches = this.svgPath.match(PathToLinesClass.regexArc);

    if (arcMatches === null) {
      console.error('Path A: arcMatches is null');
      return;
    }

    this.cutCharsFromFront(arcMatches[0].length);
    const arcValues = PathToLinesClass.valueInMultipleMatches(arcMatches);
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

    if (this.isRelative) {
      coords.x = fixFloatOverflow(this.currentX + coords.x);
      coords.y = fixFloatOverflow(this.currentY + coords.y);
    }

    this.setCoordinates(coords.x, coords.y);

    if (coords.rx > 0 && coords.ry > 0) {
      this.curveCenterX = this.currentX;
      this.curveCenterY = this.currentY;
    }

    this.mxGraph += `<arc `
      + `rx="${coords.rx}" ry="${coords.ry}" `
      + `x-axis-rotation="${coords.deg}" `
      + `large-arc-flag="${coords.af}" `
      + `sweep-flag="${coords.sf}" `
      + `x="${this.currentX}" y="${this.currentY}"/>\n`;
  }

  /**
   * Handle SVG close path z/Z
   */
  private pathClose(): void {
    this.cutCharsFromFront(1);
    this.mxGraph += `<close/>\n`;
  }

  private static valueInMultipleMatches(matches: string[]): number[] {
    // console.log('valueInMultipleMatches matches', matches);
    const valueArr = [];
    for (let bushPig = 1; bushPig < matches.length; bushPig++) {
      for (let piglet = 0; piglet < PathToLinesClass.matchesPerRegexValue; piglet++) {
        const matchToTest = matches[bushPig + piglet];
        if (typeof matchToTest !== 'undefined') {
          valueArr.push(+matchToTest);
          bushPig += (PathToLinesClass.matchesPerRegexValue - piglet - 1); // advance outer for-loop minus 1 for outer loops iterator
          break;
        }
      }
    }
    return valueArr;
  }

  /**
   * Remove strings from front of working SVG path
   */
  private cutCharsFromFront(indexStart: number) {
    this.svgPath = this.svgPath.substring(indexStart);
  }

  /**
   * Set the X and Y coordinates to use in relative calculations
   */
  private setCoordinates(x: number|null = null, y: number|null = null) {
    if (x !== null) {
      this.currentX = fixFloatOverflow(x);
    }
    if (y !== null) {
      this.currentY = fixFloatOverflow(y);
    }
  }
}
