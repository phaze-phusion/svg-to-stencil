import {fixFloatOverflow} from './shared/utlis';

const pathLengthLimit = 250;
const pathMatchesPerValue = 4; // From the regex a value can come from 3 separate match indexes
const pathFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
const pathRest  = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
const arcFlag = ' (([01])|(W)|(W))'; // (W) is used to fill up the matches to the same length as the rest
const regexPathCubicCurve = new RegExp('^[cC]' + pathFirst + pathRest.repeat(5));
const regexPathArc = new RegExp('^[aA]' + pathFirst + pathRest.repeat(2) + arcFlag.repeat(2) + pathRest.repeat(2));
const regexPathLine = new RegExp('^[lmLM]' + pathFirst + pathRest);
const regexPathSingle = new RegExp('^[hvHV]' + pathFirst);

export class PathToLinesClass {
  private x: number;
  private y: number;
  private nextDeltaX1 = 0;
  private nextDeltaY1 = 0;
  // private curveCenterX = 0;
  // private curveCenterY = 0;
  private isRelative = true;
  public mxGraph: string;

  constructor(private svgPath: string) {
    this.x = 0;
    this.y = 0;
    this.mxGraph = '';
    this.convert();
  }

  private convert(): void {
    for (let safeBreak = 0; safeBreak < pathLengthLimit && this.svgPath.length > 0; safeBreak++) {
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
        // Arc
        case 'a': this.pathArc(); break;
        // Cubic Curve
        case 'c': this.pathCubicCurve(); break;
        // Curve
        case 's': this.pathSmoothCurve(); break;
        // End path
        case 'z': this.pathClose(); break;
      }

      if ((safeBreak + 1) === pathLengthLimit) {
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
      matches = this.svgPath.match(regexPathLine);

      if (matches === null) {
        console.error('Path Basic: matches is null for "m" or "l"');
        return;
      }

      const values = PathToLinesClass.valueInMultipleMatches(matches, pathMatchesPerValue);
      // console.log('lineMatches', matches);
      // console.log('lineValues', values);

      x = values[0];
      y = values[1];

      if (this.isRelative) {
        x += this.x;
        y += this.y;
      }

    } else if (forPath === 'h' || forPath === 'v') {
      matches = this.svgPath.match(regexPathSingle);

      if (matches === null) {
        console.error('Path Basic: matches is null for "h" or "v"');
        return;
      }

      const values = PathToLinesClass.valueInMultipleMatches(matches, pathMatchesPerValue);
      // console.log('singleMatches', matches);
      // console.log('singleValues', values);

      if (forPath === 'h') {
        x = values[0] + (this.isRelative ? this.x : 0);
      } else { // if (forPath === 'v')
        y = values[0] + (this.isRelative ? this.y : 0);
      }
    } else {
      throw new Error('Method only caters for paths m, l, v and h');
    }

    this.setCoordinates(x, y);
    this.cutCharsFromFront(matches[0].length);

    this.mxGraph += `<${penDown ? 'line' : 'move'} x="${this.x}" y="${this.y}"/>\n`;
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
    const arcMatches = this.svgPath.match(regexPathArc);

    if (arcMatches === null) {
      console.error('Path A: arcMatches is null');
      return;
    }

    this.cutCharsFromFront(arcMatches[0].length);
    const values = PathToLinesClass.valueInMultipleMatches(arcMatches, pathMatchesPerValue);
    // console.log('arcMatches', arcMatches);
    // console.log('arcValues', values);

    const coords: {rx: number, ry: number, deg: number, af: number, sf: number, x: number, y: number} = {
      rx: values[0],
      ry: values[1],
      deg: values[2],
      af: values[3],
      sf: values[4],
      x: values[5],
      y: values[6]
    };

    if (this.isRelative) {
      // coords.rx = fixFloatOverflow(this.x + coords.rx);
      // coords.ry = fixFloatOverflow(this.y + coords.ry);
      coords.x = fixFloatOverflow(this.x + coords.x);
      coords.y = fixFloatOverflow(this.y + coords.y);
    }
    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<arc `
      + `rx="${coords.rx}" ry="${coords.ry}" `
      + `x-axis-rotation="${coords.deg}" `
      + `large-arc-flag="${coords.af}" `
      + `sweep-flag="${coords.sf}" `
      + `x="${this.x}" y="${this.y}"/>\n`;
  }

  /**
   * Write the Stencil Curve XML
   * @param {number[]} values    4 values when called by Smooth Curve and 6 values when called by cubic curve
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  private curveWriter(values: number[], isSmooth: boolean) {
    if (isSmooth) {
      let x1 = this.nextDeltaX1;
      let y1 = this.nextDeltaY1;

      if (!this.isRelative) {
        x1 = x1 !== 0 ? (x1 + this.x) : this.x;
        y1 = y1 !== 0 ? (y1 + this.y) : this.y;
      }

      values = [
        x1,
        y1,
        ...values,
      ];
    }

    const coords: {x1: number, y1: number, x2: number, y2: number, x: number, y: number} = {
      x1: values[0],
      y1: values[1],
      x2: values[2],
      y2: values[3],
      x: values[4],
      y: values[5]
    };

    // for (let buffalo = 0; buffalo < values.length; buffalo++) {
    //   coords[curveKeysInOrder[buffalo]] = values[buffalo];
    // }

    if (this.isRelative) {
      coords.x1 = fixFloatOverflow(this.x + coords.x1);
      coords.y1 = fixFloatOverflow(this.y + coords.y1);
      coords.x2 = fixFloatOverflow(this.x + coords.x2);
      coords.y2 = fixFloatOverflow(this.y + coords.y2);
      coords.x = fixFloatOverflow(this.x + coords.x);
      coords.y = fixFloatOverflow(this.y + coords.y);
    }

    // Used to fake a matrix conversion for smooth curves
    this.nextDeltaX1 = coords.x - coords.x2;
    this.nextDeltaY1 = coords.y - coords.y2;

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
    const cubicMatches = this.svgPath.match(regexPathCubicCurve);
    // console.log('cubicMatches', cubicMatches);
    if (cubicMatches === null) {
      console.error('Path C: cubicMatches is null');
      return;
    }
    this.cutCharsFromFront(cubicMatches[0].length);
    this.curveWriter(
      PathToLinesClass.valueInMultipleMatches(cubicMatches, pathMatchesPerValue),
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
    const smoothFirstMultiple = this.svgPath.match(new RegExp('[sS]' + pathFirst + pathRest.repeat(3)));

    if (smoothFirstMultiple === null) {
      console.error('Path S: smoothFirstMultiple is null');
      return;
    }

    // Cut the first multiple of 4 from the front of the line
    this.cutCharsFromFront(smoothFirstMultiple[0].length);
    this.curveWriter(
      PathToLinesClass.valueInMultipleMatches(smoothFirstMultiple, pathMatchesPerValue),
      true
    );

    // If the next character in the line is a letter then there are no more smooth curve values to extract
    if (this.svgPath.substring(0, 1).match(/[a-z]/i)) {
      return;
    }

    for (let safetyBreak = 0; safetyBreak < 20; safetyBreak++) {
      try {
        const smoothMatches = this.svgPath.match(new RegExp('^' + pathRest.repeat(4)));
        if (smoothMatches === null) {
          console.error('Path S: smoothMatches is null');
          break;
        }
        this.cutCharsFromFront(smoothMatches[0].length);
        this.curveWriter(
          PathToLinesClass.valueInMultipleMatches(smoothMatches, pathMatchesPerValue),
          true
        );
      } catch {
        break;
      }
    }

  }

  /**
   * Handle SVG close path z/Z
   */
  private pathClose(): void {
    this.cutCharsFromFront(1);
    this.mxGraph += `<close/>\n`;
  }

  private static valueInMultipleMatches(matches: string[], matchesPerValue: number): number[] {
    // console.log('valueInMultipleMatches matches', matches);
    const valueArr = [];
    for (let bushPig = 1; bushPig < matches.length; bushPig++) {
      for (let piglet = 0; piglet < matchesPerValue; piglet++) {
        const matchToTest = matches[bushPig + piglet];
        if (typeof matchToTest !== 'undefined') {
          valueArr.push(+matchToTest);
          bushPig += (matchesPerValue - piglet - 1); // advance outer for-loop minus 1 for outer loops iterator
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
      this.x = fixFloatOverflow(x);
    }
    if (y !== null) {
      this.y = fixFloatOverflow(y);
    }
  }

}
