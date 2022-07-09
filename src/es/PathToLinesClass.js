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

  path_Z() {
    this.cutCharsFromFront(1);
    this.mxAppendClose()
  }

}
