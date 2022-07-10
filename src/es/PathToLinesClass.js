import {fixFloatOverflow} from "./utlis";

export class PathToLinesClass {
  x = 0;
  y = 0;
  nextSx2 = 0;
  nextSy2 = 0;
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
        case 'M': this.path_M(false); break;
        case 'm': this.path_M(true); break;
        // Line
        case 'L': this.path_L(false); break;
        case 'l': this.path_L(true); break;
        // Horizontal line
        case 'H': this.path_H(false); break;
        case 'h': this.path_H(true); break;
        // Vertical line
        case 'V': this.path_V(false); break;
        case 'v': this.path_V(true); break;
        // Arc
        case 'A': this.path_A(false); break;
        case 'a': this.path_A(true); break;
        // Curve
        case 'C': this.path_C(false); break;
        case 'c': this.path_C(true); break;
        // S-Curve
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

  mxAppendMove() {
    this.mxGraph += `<move x="${this.x}" y="${this.y}"/>\n`;
    // this.mxGraph += `<move x='${this.x}' y='${this.y}'/>\n`;
  }

  mxAppendLine() {
    this.mxGraph += `<line x="${this.x}" y="${this.y}"/>\n`;
    // this.mxGraph += `<line x='${this.x}' y='${this.y}'/>\n`;
  }

  mxAppendClose() {
    this.mxGraph += `<close/>\n`;
  }

  fixLeadingZeroMatches(matches) {
    for (let beer = 1; beer < matches.length; beer++) {
      // Check for NaN
      if (isNaN(+matches[beer])) {
        // console.log('matches before', matches);
        // next coordinate is a decimal without the preceding zero
        const decimalSplit = matches[beer].split('.');
        // console.log('decimalSplit', decimalSplit);
        if (decimalSplit.length === 3) {
          matches[beer] = `${decimalSplit[0]}.${decimalSplit[1]}`;
          matches.splice(beer + 1, 0, `.${decimalSplit[2]}`);
          // matches[beer + 1] = `.${decimalSplit[2]}.${matches[beer + 1]}`;
        }
        // console.log('matches after', matches);
      } else if (matches[beer].substring(matches[beer].length - 1, matches[beer].length) === '.') {
        // console.log('last dot before', matches);
        // trailing dot clearly means this match was cut up
        matches[beer] = matches[beer] + matches[beer + 1];
        matches.splice(beer + 1, 1); // remove the match that has been joined with the previous match
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
  }

  get1Coordinate() {
    // console.log('match 1 path before', this.svgPath);
    const matches = this.svgPath.match(/[hv](-?[0-9.]+)/i);
    const cutStartIndex = matches[0].length;
    // console.log('match 1', matches);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    this.cutCharsFromFront(cutStartIndex);
    // console.log('match 1 path after', this.svgPath);
    return +matches[1];
  }

  get2Coordinates() {
    let matches = this.svgPath.match(/[ml](-?[0-9.]+) ?(-?[0-9.]+)/i);
    matches = this.fixLeadingZeroMatches(matches);

    const cutStartIndex = matches[0].length;
    // console.log('match 2', matches);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    this.cutCharsFromFront(cutStartIndex);
    // console.log('match 2 path', this.svgPath);
    return {
      x: +matches[1],
      y: +matches[2],
    };
  }

  path_M(isRelative) {
    const coords = this.get2Coordinates();
    if (isRelative) {
      coords.x += this.x;
      coords.y += this.y;
    }
    this.setCoordinates(coords.x, coords.y);
    this.mxAppendMove();
  }

  path_L(isRelative) {
    const coords = this.get2Coordinates();
    if (isRelative) {
      coords.x += this.x;
      coords.y += this.y;
    }
    this.setCoordinates(coords.x, coords.y);
    this.mxAppendLine();
  }

  path_H(isRelative) {
    let x = this.get1Coordinate();
    if (isRelative) {
      x += this.x;
    }
    this.setCoordinates(x, null);
    this.mxAppendLine();
  }

  path_V(isRelative) {
    let y = this.get1Coordinate();
    if (isRelative) {
      y += this.y;
    }
    this.setCoordinates(null, y);
    this.mxAppendLine();
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

  path_C_writer(matches, isRelative) {
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    // console.log('match C path', this.svgPath);
    const coords = {
      x1: +matches[1],
      y1: +matches[2],
      x2: +matches[3],
      y2: +matches[4],
      x: +matches[5],
      y: +matches[6],
    }

    // console.table(coords);

    if (isRelative) {
      coords.x1 = fixFloatOverflow(this.x + coords.x1);
      coords.y1 = fixFloatOverflow(this.y + coords.y1);
      coords.x2 = fixFloatOverflow(this.x + coords.x2);
      coords.y2 = fixFloatOverflow(this.y + coords.y2);
      coords.x = fixFloatOverflow(this.x + coords.x);
      coords.y = fixFloatOverflow(this.y + coords.y);
    }

    // Used to fake a matrix conversion for s-curves
    this.nextSx2 = coords.x - coords.x2;
    this.nextSy2 = coords.y - coords.y2;

    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<curve `
      + `x1="${coords.x1}" y1="${coords.y1}" `
      + `x2="${coords.x2}" y2="${coords.y2}" `
      + `x3="${coords.x}" y3="${coords.y}"/>\n`
  }

  path_C(isRelative) {
    // c dx1 dy1, dx2 dy2, dx dy

    // match 1 -> x1
    // match 2 -> y1
    // match 3 -> x2
    // match 4 -> y2
    // match 5 -> end x
    // match 6 -> end y
    let matches = this.svgPath.match(/[cC](-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+)/);
    matches = this.fixLeadingZeroMatches(matches);
    const cutStartIndex = matches[0].length;
    this.cutCharsFromFront(cutStartIndex);

    this.path_C_writer(matches, isRelative);
  }

  path_S(isRelative) {
    // s x2 y2, x y

    // match 1 -> x2
    // match 2 -> y2
    // match 3 -> end x
    // match 4 -> end y
    // rinse and repeat for multiples of 4
    this.svgPath = this.svgPath.substring(1); // lob off preceding 's'

    let safetyBreak = 0;
    while (true) {
      try {
        let matches = this.svgPath.match(/^([- ]?[0-9.]+[- ][0-9.]+[- ][0-9.]+[- ][0-9.]+)/);
        if (matches === null) {
          // TODO fix for leading zeros issue in these sets
          // matches = this.svgPath.match(/^([- ]?[0-9.]+[- ]?[0-9.]+[- ]?[0-9.]+[- ]?[0-9.]+)/)
          // fixLeadingZeroMatches
          // if (matches === null)
          break;
        }

        const cutStartIndex = matches[0].length;
        this.cutCharsFromFront(cutStartIndex);

        const matchesForCPath = matches[1].match(/(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+)/);
        matchesForCPath.splice(1, 0, this.nextSx2);
        matchesForCPath.splice(2, 0, this.nextSy2);

        // if not relative convert to relative to make math easier
        if (isRelative === false) {
          // matchesForCPath[1] is the spliced in value
          // matchesForCPath[2] is the spliced in value
          matchesForCPath[3] = (+matchesForCPath[3]) - this.x;
          matchesForCPath[4] = (+matchesForCPath[4]) - this.y;
          matchesForCPath[5] = (+matchesForCPath[5]) - this.x;
          matchesForCPath[6] = (+matchesForCPath[6]) - this.y;
        }

        this.path_C_writer(matchesForCPath, true);
      } catch {
        break;
      }

      safetyBreak++;
      if (safetyBreak > 50)
        break;
    }


    // let matchSets = this.svgPath.match(/[sS]([- ]?[0-9.]+[- ][0-9.]+[- ][0-9.]+[- ][0-9.]+)/);
    // let matches = this.svgPath.match(/[sS](-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+) ?(-?[0-9.]+)/);
    // matches = this.fixLeadingZeroMatches(matches);
    // const cutStartIndex = matches[0].length;
    // this.cutCharsFromFront(cutStartIndex);
    //
    // // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    // // console.log('match C path', this.svgPath);
    // const coords = {
    //   x1: +matches[1],
    //   y1: +matches[2],
    //   x2: +matches[3],
    //   y2: +matches[4],
    //   x: +matches[5],
    //   y: +matches[6],
    // }
    //
    // // console.table(coords);
    //
    // if (isRelative) {
    //   coords.x1 = fixFloatOverflow(this.x + coords.x1);
    //   coords.y1 = fixFloatOverflow(this.y + coords.y1);
    //   coords.x2 = fixFloatOverflow(this.x + coords.x2);
    //   coords.y2 = fixFloatOverflow(this.y + coords.y2);
    //   coords.x = fixFloatOverflow(this.x + coords.x);
    //   coords.y = fixFloatOverflow(this.y + coords.y);
    // }
    //
    // this.setCoordinates(coords.x, coords.y);
    //
    // this.mxGraph += `<curve `
    //   + `x1="${coords.x1}" y1="${coords.y1}" `
    //   + `x2="${coords.x2}" y2="${coords.y2}" `
    //   + `x3="${coords.x}" y3="${coords.y}"/>\n`
  }

  path_Z() {
    this.cutCharsFromFront(1);
    this.mxAppendClose()
  }

}
