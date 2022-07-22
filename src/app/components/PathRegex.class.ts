export class PathRegexClass {
  private static readonly _pathFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
  private static readonly _pathRest = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
  private static readonly _whitespaceFirst = '^(\\s+)?';
  private static readonly _noMoreNumbers = '^( ?[a-z])';
  private static _leadingWhitespace: RegExp;
  private static _nextIsALetter: RegExp;
  private static _lmLine: RegExp;
  private static _hvLine: RegExp;
  private static _cubic: RegExp;
  private static _cubicSmoothFirst: RegExp;
  private static _cubicSmoothRest: RegExp;
  private static _quad: RegExp;
  private static _quadSmoothFirst: RegExp;
  private static _quadSmoothRest: RegExp;
  private static _arc: RegExp;

  static {
    PathRegexClass._leadingWhitespace = new RegExp(PathRegexClass._whitespaceFirst);

    PathRegexClass._nextIsALetter = new RegExp(PathRegexClass._noMoreNumbers, 'i');

    PathRegexClass._lmLine = new RegExp(
      '^[lmLM]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest
    );

    PathRegexClass._hvLine = new RegExp(
      '^[hvHV]'
      + PathRegexClass._pathFirst
    );

    PathRegexClass._cubic = new RegExp(
      '^[cC]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest.repeat(5)
    );

    PathRegexClass._cubicSmoothFirst = new RegExp(
      '^[sS]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest.repeat(3)
    );

    PathRegexClass._cubicSmoothRest = new RegExp(
      '^'
      + PathRegexClass._pathRest.repeat(4)
    );

    PathRegexClass._quad = new RegExp(
      '^[qQ]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest.repeat(3)
    );

    PathRegexClass._quadSmoothFirst = new RegExp(
      '^[tT]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest
    );

    PathRegexClass._quadSmoothRest = new RegExp(
      '^'
      + PathRegexClass._pathRest.repeat(2)
    );

    PathRegexClass._arc = new RegExp(
      '^[aA]'
      + PathRegexClass._pathFirst
      + PathRegexClass._pathRest.repeat(2)
      + ' (([01])|(W)|(W))'.repeat(2) // (W) is used to fill up the matches to the same length as the other regex (used for arcs)
      + PathRegexClass._pathRest.repeat(2)
    );
  }

  // From the regex a value can come from N separate match indexes
  public static get p_matchesPerRegexValue() {
    return 4;
  }

  public static get p_leadingWhitespace() {
    return PathRegexClass._leadingWhitespace;
  }

  public static get p_nextIsALetter() {
    return PathRegexClass._nextIsALetter;
  }

  public static get p_lmLine(): RegExp {
    return PathRegexClass._lmLine;
  }

  public static get p_hvLine(): RegExp {
    return PathRegexClass._hvLine;
  }

  public static get p_cubic(): RegExp {
    return PathRegexClass._cubic;
  }

  public static get p_cubicSmoothFirst(): RegExp {
    return PathRegexClass._cubicSmoothFirst;
  }

  public static get p_cubicSmoothRest(): RegExp {
    return PathRegexClass._cubicSmoothRest;
  }

  public static get p_quad(): RegExp {
    return PathRegexClass._quad;
  }

  public static get p_quadSmoothFirst(): RegExp {
    return PathRegexClass._quadSmoothFirst;
  }

  public static get p_quadSmoothRest(): RegExp {
    return PathRegexClass._quadSmoothRest;
  }

  public static get p_arc(): RegExp {
    return PathRegexClass._arc;
  }
}
