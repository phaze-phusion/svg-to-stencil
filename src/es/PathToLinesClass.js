export class PathToLinesClass {
  x = 0;
  y = 0;
  svgPath = '';
  mxGraph = '';
  precision = 1e2;

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

  fixOverflow(value) {
    if ((value + '').length > 15) {
      value = Math.round(value * this.precision) / this.precision;
    }
    return value;
  }

  fixLeadingZeroMatches(matches) {
    for (let beer = 1; beer < matches.length; beer++) {
      // Check for NaN
      if (isNaN(+matches[beer])) {
        // next coordinate is a decimal without the preceding zero
        const decimalSplit = matches[beer].split('.');
        if (decimalSplit.length === 3) {
          matches[beer] = `${decimalSplit[0]}.${decimalSplit[1]}`;
          matches[beer + 1] = `.${decimalSplit[2]}${matches[beer + 1]}`;
        }
      }
    }
    return matches;
  }

  setCoordinates(x = null, y = null) {
    if (x !== null) {
      this.x = this.fixOverflow(x);
    }
    if (y !== null) {
      this.y = this.fixOverflow(y);
    }
  }

  get1Coordinate() {
    const matches = this.svgPath.match(/[hv](-?[0-9.]+)/i);
    const cutStartIndex = matches[0].length;
    // console.log('match 1', matches);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    this.cutCharsFromFront(cutStartIndex);
    // console.log('match 1 path', this.svgPath);
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
    const matches = this.svgPath.match(/[aA]([0-9]+) ([0-9]+) (-?[0-9.]+) ([01]) ([01]) ?(-?[0-9.]+) ?(-?[0-9.]+)/);
    // console.log('match A', matches);
    const cutStartIndex = matches[0].length;
    this.cutCharsFromFront(cutStartIndex);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    // console.log('match A path', this.svgPath);
    const coords = {
      x: +matches[6],
      y: +matches[7],
    }

    if (isRelative) {
      coords.x += this.x;
      coords.y += this.y;
    }
    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<arc `
      + `rx="${matches[1]}" ry="${matches[2]}" `
      + `x-axis-rotation="${matches[3]}" `
      + `large-arc-flag="${matches[4]}" `
      + `sweep-flag="${matches[5]}" `
      + `x="${this.x}" y="${this.y}"/>\n`
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
      coords.x1 = this.fixOverflow(this.x + coords.x1);
      coords.y1 = this.fixOverflow(this.y + coords.y1);
      coords.x2 = this.fixOverflow(this.x + coords.x2);
      coords.y2 = this.fixOverflow(this.y + coords.y2);
      coords.x = this.fixOverflow(this.x + coords.x);
      coords.y = this.fixOverflow(this.y + coords.y);
    }

    this.setCoordinates(coords.x, coords.y);

    this.mxGraph += `<curve `
      + `x1="${coords.x1}" y1="${coords.y1}" `
      + `x2="${coords.x2}" y2="${coords.y2}" `
      + `x3="${coords.x}" y3="${coords.y}"/>\n`
  }


  path_Z() {
    this.cutCharsFromFront(1);
    this.mxAppendClose()
  }

}
