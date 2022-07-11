import {fixFloatOverflow} from "./utlis";

const pathMatchesPerValue = 4; // From the regex a value can come from 3 separate match indexes
const pathFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
const pathRest  = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
const arcFlag = ' (([01])|(W)|(W))'; // (W) is used to fill up the matches to the same length as the rest
const regexPathCubicCurve = new RegExp('^[cC]' + pathFirst + pathRest.repeat(5));
const regexPathArc = new RegExp('^[aA]' + pathFirst + pathRest.repeat(2) + arcFlag.repeat(2) + pathRest.repeat(2));
const regexPathLine = new RegExp('^[lmLM]' + pathFirst + pathRest);
const regexPathSingle = new RegExp('^[hvHV]' + pathFirst);

export class PathToLinesClass {
  x = 0;
  y = 0;
  nextDeltaX1 = 0;
  nextDeltaY1 = 0;
  svgPath = '';
  mxGraph = '';

  constructor() {
  }

  convert(path) {
    this.x = 0;
    this.y = 0;
    this.svgPath = '';
    this.mxGraph = '';
    this.svgPath = path;

    for (let safeBreak = 0; safeBreak < 50 && this.svgPath.length > 0; safeBreak++) {
      const char = this.svgPath[0];
      // console.log('loop ALPHA', char, ' - ', this.svgPath);
      switch (char) {
        // Move
        case 'M': this.path_basic('m', false, false); break;
        case 'm': this.path_basic('m', true, false); break;
        // Line
        case 'L': this.path_basic('l', false); break;
        case 'l': this.path_basic('l', true); break;
        // Horizontal line
        case 'H': this.path_basic('h', false); break;
        case 'h': this.path_basic('h', true); break;
        // Vertical line
        case 'V': this.path_basic('v', false); break;
        case 'v': this.path_basic('v', true); break;
        // Arc
        case 'A': this.path_A(false); break;
        case 'a': this.path_A(true); break;
        // Cubic Curve
        case 'C': this.path_C(false); break;
        case 'c': this.path_C(true); break;
        // Curve
        case 'S': this.path_S(false); break;
        case 's': this.path_S(true); break;
        // End path
        case 'Z':
        case 'z': this.path_Z(); break;
      }
      // console.log('loop OMEGA', char, ' - ', this.svgPath);

      safeBreak++;
      if (safeBreak > 100)
        break;
    }

    return this.mxGraph.trim();
  }

  cutCharsFromFront(indexStart) {
    this.svgPath = this.svgPath.substring(indexStart);
  }

  setCoordinates(x = null, y = null) {
    if (x !== null) {
      this.x = fixFloatOverflow(x);
    }
    if (y !== null) {
      this.y = fixFloatOverflow(y);
    }
  }

  path_basic(forPath, isRelative, penDown = true) {
    let matches;
    let x = null;
    let y = null;

    if (forPath === 'm' || forPath === 'l') {
      matches = this.svgPath.match(regexPathLine);
      const values = this.valueInMultipleMatches(matches, pathMatchesPerValue);
      // console.log('lineMatches', values);

      x = values[0];
      y = values[1];

      if (isRelative) {
        x += this.x;
        y += this.y;
      }

    } else if (forPath === 'h' || forPath === 'v') {
      matches = this.svgPath.match(regexPathSingle);
      const values = this.valueInMultipleMatches(matches, pathMatchesPerValue);
      // console.log('singleMatches', matches);
      // console.log('singleValues', values);

      if (forPath === 'h') {
        x = values[0] + (isRelative ? this.x : 0);
      } else { // if (forPath === 'v')
        y = values[0] + (isRelative ? this.y : 0);
      }
    } else {
      throw new Error('Method only caters for paths m, l, v and h');
    }

    this.setCoordinates(x, y);
    this.cutCharsFromFront(matches[0].length);
    // console.log('coords path', this.svgPath);

    if (penDown) {
      this.mxGraph += `<line x="${this.x}" y="${this.y}"/>\n`;
    } else {
      this.mxGraph += `<move x="${this.x}" y="${this.y}"/>\n`;
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
   *
   * @param {boolean} isRelative
   */
  path_A(isRelative) {
    const arcKeysInOrder = ['rx', 'ry', 'deg', 'af', 'sf', 'x', 'y'];
    const arcMatches = this.svgPath.match(regexPathArc);
    this.cutCharsFromFront(arcMatches[0].length);
    const values = this.valueInMultipleMatches(arcMatches, pathMatchesPerValue);
    // console.log('arcMatches', arcMatches);
    // console.log('arcValues', values);

    /** @type {{rx: number, ry: number, deg: number, af: number, sf: number, x: number, y: number }} */
    const coords = {};
    for (let reedBuck = 0; reedBuck < values.length; reedBuck++) {
      coords[arcKeysInOrder[reedBuck]] = values[reedBuck];
    }

    if (isRelative) {
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
   * @param {boolean} isRelative
   * @param {number[]} values    4 values when called by Smooth Curve and 6 values when called by cubic curve
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  curveWriter(isRelative, values, isSmooth) {
    const curveKeysInOrder = ['x1', 'y1', 'x2', 'y2', 'x', 'y'];

    /** @type {{x1: number, y1: number, x2: number, y2: number, x: number, y: number}} */
    const coords = {};
    if (isSmooth) {
      values = [
        this.nextDeltaX1, // x1, comes from preceding curve's x-end minus x2
        this.nextDeltaY1, // y1, comes from preceding curve's y-end minus y2
        ...values,
      ];
    }

    for (let buffalo = 0; buffalo < values.length; buffalo++) {
      coords[curveKeysInOrder[buffalo]] = values[buffalo];
    }

    if (isRelative) {
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
   *
   * @param {boolean} isRelative
   */
  path_C(isRelative) {
    // console.log('this.svgPath', this.svgPath);
    const cubicMatches = this.svgPath.match(regexPathCubicCurve);
    // console.log('cubicMatches', cubicMatches);
    this.cutCharsFromFront(cubicMatches[0].length);
    this.curveWriter(
      isRelative,
      this.valueInMultipleMatches(cubicMatches, pathMatchesPerValue),
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
   *
   * @param {boolean} isRelative
   */
  path_S(isRelative) {
    // Match the first multiple of 4 in the line as it has a different form to the rest
    const smoothFirstMultiple = this.svgPath.match(new RegExp('[sS]' + pathFirst + pathRest.repeat(3)));

    // Cut the first multiple of 4 from the front of the line
    this.cutCharsFromFront(smoothFirstMultiple[0].length);
    this.curveWriter(
      isRelative,
      this.valueInMultipleMatches(smoothFirstMultiple, pathMatchesPerValue),
      true
    );

    // If the next character in the line is a letter then there are no more smooth curve values to extract
    if (this.svgPath.substring(0, 1).match(/[a-z]/i)) {
      return;
    }

    for (let safetyBreak = 0; safetyBreak < 20; safetyBreak++) {
      try {
        let smoothMatches = this.svgPath.match(new RegExp('^' + pathRest.repeat(4)));
        this.cutCharsFromFront(smoothMatches[0].length);
        this.curveWriter(
          isRelative,
          this.valueInMultipleMatches(smoothMatches, pathMatchesPerValue),
          true
        );
      } catch {
        break;
      }
    }

  }

  /**
   * @param {string[]} matches
   * @param {number} matchesPerValue
   * @returns {number[]}
   */
  valueInMultipleMatches(matches, matchesPerValue) {
    // console.log('matches', matches);
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

  path_Z() {
    this.cutCharsFromFront(1);
    this.mxGraph += `<close/>\n`;
  }

}
