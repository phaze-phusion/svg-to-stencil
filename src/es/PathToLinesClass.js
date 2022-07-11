import {fixFloatOverflow} from "./utlis";

const curveFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
const curveRest  = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
const regexPathCubicCurve = new RegExp('^[cC]' + curveFirst + curveRest.repeat(5));
const curveMatchesPerValue = 4; // From the regex a value can come from 3 separate match indexes

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

    let safeBreak = 0;
    while (this.svgPath.length > 0) {
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

  fixLeadingZeroMatches(matches) {

    // start at index 1 as 0 is the whole string that was matched
    for (let kudu = 1; kudu < matches.length; kudu++) {
      // 2 or more decimals in a group will cause a NaN when converted to a number
      if (isNaN(+matches[kudu])) {
        console.log('matches before', matches);

        // If the match only contains a decimal point
        if (matches[kudu] === '.') {
          // TODO: Finish thought process
        }


        // when 2 or more numbers are joined by decimal points it
        // means they're all fractions and the leading zero was omitted
        // example: "-.11.35.03.74"
        if (matches[kudu].substring(0, 1) === '.' || matches[kudu].substring(0, 2) === '-.') {
          const fractions = matches[kudu].split('.');
          let matchesInsertionPoint = kudu + 1;

          // Join the first 2 fraction parts with a decimal as they're part of the same number (eg "-" and "11)
          // and splice them into the matches array right after the one we're working on
          matches.splice(matchesInsertionPoint, 0, `${fractions[0]}.${fractions[1]}`);

          // For the rest of the fraction parts, prepend a decimal point
          // and splice them into the matches array one after the other
          for (let aardvark = 2; aardvark < fractions.length; aardvark++) {
            matchesInsertionPoint++;
            matches.splice(matchesInsertionPoint, 0, `.${fractions[aardvark]}`);
          }

          // lastly remove the original match that we just worked on
          matches.splice(kudu, 1);
        }

        // // next coordinate is a decimal without the preceding zero
        // const decimalSplit = matches[kudu].split('.');
        // // console.log('decimalSplit', decimalSplit);
        // if (decimalSplit.length === 3) {
        //   matches[kudu] = `${decimalSplit[0]}.${decimalSplit[1]}`;
        //   matches.splice(kudu + 1, 0, `.${decimalSplit[2]}`);
        // }
        // console.log('matches after', matches);
      } else if (matches[kudu].substring(matches[kudu].length - 1, matches[kudu].length) === '.') {
        // console.log('last dot before', matches);
        // trailing dot clearly means this match was cut up
        matches[kudu] = matches[kudu] + matches[kudu + 1];
        matches.splice(kudu + 1, 1); // remove the match that has been joined with the previous match
        // console.log('last dot after', matches);
      }
    }
    return matches;
  }

  setCoordinates(x = null, y = null) {
    if (x !== null) {
      this.x = fixFloatOverflow(x);
    }
    if (y !== null) {
      this.y = fixFloatOverflow(y);
    }
    console.log('x-y', this.x, this.y);
  }

  path_basic(forPath, isRelative, penDown = true) {
    let matches;
    let x = null;
    let y = null;

    if (forPath === 'm' || forPath === 'l') {
      matches = this.svgPath.match(/[ml](-?[0-9.]+) ?(-?[0-9.]+)/i);
      matches = this.fixLeadingZeroMatches(matches);
      x = +matches[1];
      y = +matches[2];

      if (isRelative) {
        x += this.x;
        y += this.y;
      }

    } else if (forPath === 'h' || forPath === 'v') {
      matches = this.svgPath.match(/[hv](-?[0-9.]+)/i);

      if (forPath === 'h') {
        x = +matches[1] + (isRelative ? this.x : 0);
      } else { // if (forPath === 'v')
        y = +matches[1] + (isRelative ? this.y : 0);
      }
    } else {
      throw error('Method only caters for paths m, l, v and h');
    }

    this.setCoordinates(x, y);

    const cutStartIndex = matches[0].length;
    // console.log('coords matches', matches);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    this.cutCharsFromFront(cutStartIndex);
    // console.log('coords path', this.svgPath);

    if (penDown) {
      this.mxGraph += `<line x="${this.x}" y="${this.y}"/>\n`;
    } else {
      this.mxGraph += `<move x="${this.x}" y="${this.y}"/>\n`;
    }
  }

  path_A(isRelative) {
    // match 1 -> radius x
    // match 2 -> radius y
    // match 3 -> tilt degrees
    // match 4 -> large-arc-flag
    // match 5 -> sweep-flag
    // match 6 -> end x
    // match 7 -> end y
    // let matches = this.svgPath.match(/[aA](-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ([01]) ([01]) ?(-?[0-9.]+) ?(-?[0-9.]+)/);
    let matches = this.svgPath.match(/[aA](-?[0-9.]+)([- .][0-9.]+)([- .][0-9.]+) ([01]) ([01])([- .][0-9.]+)([- .][0-9.]+)/);
    console.log('match A', matches);
    matches = this.fixLeadingZeroMatches(matches);
    const cutStartIndex = matches[0].length;
    this.cutCharsFromFront(cutStartIndex);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    // console.log('match A path', this.svgPath);
    const coords = {
      rx: +matches[1],
      ry: +matches[2],
      dg: +matches[3],
      af: matches[4].trim(),
      sf: matches[5].trim(),
      x: +matches[6],
      y: +matches[7],
    }

    if (isRelative) {
      coords.rx = fixFloatOverflow(this.x + coords.rx);
      coords.ry = fixFloatOverflow(this.y + coords.ry);
      coords.x = fixFloatOverflow(this.x + coords.x);
      coords.y = fixFloatOverflow(this.y + coords.y);
    }
    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<arc `
      + `rx="${coords.rx}" ry="${coords.ry}" `
      + `x-axis-rotation="${coords.dg}" `
      + `large-arc-flag="${coords.af}" `
      + `sweep-flag="${coords.sf}" `
      + `x="${this.x}" y="${this.y}"/>\n`
  }

  /**
   * Write the Stencil Curve XML
   * @param {boolean} isRelative
   * @param {number[]} values    4 values when called by Smooth Curve and 6 values when called by cubic curve
   * @param {boolean} isSmooth   Flag to say this call is for a smooth curve
   */
  curveWriter(isRelative, values, isSmooth) {
    const curveKeysInOrder = ['x1', 'y1', 'x2', 'y2', 'x', 'y'];

    /** @type {{x1: number, y1: number, x2: number, y2: number, x: number, y: number, }} */
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
      + `x3="${coords.x}" y3="${coords.y}"/>\n`
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
    console.log('this.svgPath', this.svgPath);
    const cubicMatches = this.svgPath.match(regexPathCubicCurve);
    console.log('cubicMatches', cubicMatches);
    this.cutCharsFromFront(cubicMatches[0].length);
    this.curveWriter(
      isRelative,
      this.valueInMultipleMatches(cubicMatches, curveMatchesPerValue),
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
    const smoothFirstMultiple = this.svgPath.match(new RegExp('[sS]' + curveFirst + curveRest.repeat(3)));

    // Cut the first multiple of 4 from the front of the line
    this.cutCharsFromFront(smoothFirstMultiple[0].length);
    this.curveWriter(
      isRelative,
      this.valueInMultipleMatches(smoothFirstMultiple, curveMatchesPerValue),
      true
    );

    // If the next character in the line is a letter then there are no more smooth curve values to extract
    if (this.svgPath.substring(0, 1).match(/[a-z]/i)) {
      return;
    }

    let safetyBreak = 0;
    while (true) {
      try {
        let smoothMatches = this.svgPath.match(new RegExp('^' + curveRest.repeat(4)));
        this.cutCharsFromFront(smoothMatches[0].length);
        this.curveWriter(
          isRelative,
          this.valueInMultipleMatches(smoothMatches, curveMatchesPerValue),
          true
        );
      } catch {
        break;
      }

      safetyBreak++;
      if (safetyBreak > 50)
        break;
    }

  }

  /**
   * @param {string[]} matches
   * @param {number} matchesPerValue
   * @returns {number[]}
   */
  valueInMultipleMatches(matches, matchesPerValue) {
    console.log('matches', matches);
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
