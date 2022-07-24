import {options} from '../models/options.enum';

export class MxSectionClass {
  private _sections: MxPart[];

  constructor() {
    this._sections = [];
  }

  public appendPart(type: string, props: MxPartProperty) {
    this._sections.push(
      new MxPart(
        type,
        props
      )
    );
  }

  public get mxPath(): string {
    return MxSectionClass._writePath(this._sections);
  }

  public get mxShape(): string {
    return MxSectionClass._writeSection(this._sections);
  }

  private static _writeSection(sections: MxPart[], before = '', after = ''): string {
    let tmpPath = before;

    for (let siamese = 0; siamese < sections.length; siamese++) {
      const section: MxPart = sections[siamese];
      tmpPath += options.indent + '<' + section.tag + MxSectionClass._writeAttributes(section) + ' />\n';
    }

    tmpPath += after + '\n<fillstroke/>';

    return tmpPath;
  }

  private static _writePath(sections: MxPart[]): string {
    return MxSectionClass._writeSection(sections, '<path>\n', '</path>');
  }

  private static _writeAttributes(section: MxPart): string {
    let tmpAttr = '';
    const keys = Object.keys(section.props);
    for (let tabby = 0; tabby < keys.length; tabby++) {
      const key = keys[tabby];
      const value = section.props[key];
      tmpAttr += ` ${key}="${value}"`;
    }

    return tmpAttr;
  }
}

interface MxPartProperty {
  [key: string]: number;
}

export class MxPart {
  constructor(
    public readonly tag: string,
    public readonly props: MxPartProperty
  ) {
  }
}
