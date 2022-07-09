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
        case 'M': this.path_M(); break;
        case 'L': this.path_L(); break;
        case 'H': this.path_H(); break;
        case 'V': this.path_V(); break;
        case 'm': this.path_m(); break;
        case 'l': this.path_l(); break;
        case 'h': this.path_h(); break;
        case 'v': this.path_v(); break;
        case 'Z':
        case 'z': this.path_z(); break;
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

  setCoordinates(x = null, y = null) {
    if (x !== null) {
      // if (isNaN(x)) {
      //   console.log('NaN X', x)
      // }
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
    const matches = this.svgPath.match(/[ml](-?[0-9.]+) ?(-?[0-9.]+)/i);
    if (isNaN(+matches[1])) {
      // second coordinate is a decimal without the preceding zero
      const decimalSplit = matches[1].split('.');
      if (decimalSplit.length === 3) {
        matches[1] = `${decimalSplit[0]}.${decimalSplit[1]}`;
        matches[2] = `${decimalSplit[2]}.${matches[2]}`;
      }
    }

    const cutStartIndex = matches[0].length;
    console.log('match 2', matches);
    // console.log('str to cut', this.svgPath.substring(0, cutStartIndex));
    this.cutCharsFromFront(cutStartIndex);
    // console.log('match 2 path', this.svgPath);
    return {
      x: +matches[1],
      y: +matches[2],
    };
  }

  path_M() {
    const coords = this.get2Coordinates();
    this.setCoordinates(coords.x, coords.y);
    this.mxAppendMove();
  }

  path_L() {
    const coords = this.get2Coordinates();
    this.setCoordinates(coords.x, coords.y);
    this.mxAppendLine();
  }

  path_H() {
    const x = this.get1Coordinate();
    this.setCoordinates(x, null);
    this.mxAppendLine();
  }

  path_V() {
    const y = this.get1Coordinate();
    this.setCoordinates(null, y);
    this.mxAppendLine();
  }

  path_m() {
    const coords = this.get2Coordinates();
    this.setCoordinates(this.x + coords.x, this.y + coords.y);
    this.mxAppendMove();
  }

  path_l() {
    const coords = this.get2Coordinates();
    this.setCoordinates(this.x + coords.x, this.y + coords.y);
    this.mxAppendLine();
  }

  path_h() {
    const x = this.get1Coordinate();
    this.setCoordinates(this.x + x, null);
    this.mxAppendLine();
  }

  path_v() {
    const y = this.get1Coordinate();
    this.setCoordinates(null, this.y + y);
    this.mxAppendLine();
  }

  path_z() {
    this.cutCharsFromFront(1);
    this.mxAppendClose()
  }

}
