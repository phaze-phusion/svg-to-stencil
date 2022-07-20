export class PathRegexClass {
  private static readonly pathFirst = '((-?\\.\\d+)|(-?\\d+\\.\\d+)|(-?\\d+))';
  private static readonly pathRest = '(([- ]?\\.\\d+)|([- ]\\d+\\.\\d+)|([- ]\\d+))';
  private static _lmLine: RegExp;
  private static _hvLine: RegExp;
  private static _cubic: RegExp;
  private static _cubicSmoothFirst: RegExp;
  private static _cubicSmoothRest: RegExp;
  private static _quadratic: RegExp;
  private static _quadraticSmoothFirst: RegExp;
  private static _quadraticSmoothRest: RegExp;
  private static _arc: RegExp;

  static {
    PathRegexClass._lmLine = new RegExp(
      '^[lmLM]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest
    );

    PathRegexClass._hvLine = new RegExp(
      '^[hvHV]'
      + PathRegexClass.pathFirst
    );

    PathRegexClass._cubic = new RegExp(
      '^[cC]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest.repeat(5)
    );

    PathRegexClass._cubicSmoothFirst = new RegExp(
      '[sS]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest.repeat(3)
    );

    PathRegexClass._cubicSmoothRest = new RegExp(
      '^'
      + PathRegexClass.pathRest.repeat(4)
    );

    PathRegexClass._quadratic = new RegExp(
      '^[qQ]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest.repeat(2)
    );

    PathRegexClass._quadraticSmoothFirst = new RegExp(
      '[tT]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest.repeat(3)
    );

    PathRegexClass._quadraticSmoothRest = new RegExp(
      '^'
      + PathRegexClass.pathRest.repeat(4)
    );

    PathRegexClass._arc = new RegExp(
      '^[aA]'
      + PathRegexClass.pathFirst
      + PathRegexClass.pathRest.repeat(2)
      + ' (([01])|(W)|(W))'.repeat(2) // (W) is used to fill up the matches to the same length as the other regex (used for arcs)
      + PathRegexClass.pathRest.repeat(2)
    );
  }

  // From the regex a value can come from N separate match indexes
  public static get matchesPerRegexValue() {
    return 4;
  }

  public static get lmLine(): RegExp {
    return PathRegexClass._lmLine;
  }

  public static get hvLine(): RegExp {
    return PathRegexClass._hvLine;
  }

  public static get cubic(): RegExp {
    return PathRegexClass._cubic;
  }

  public static get cubicSmoothFirst(): RegExp {
    return PathRegexClass._cubicSmoothFirst;
  }

  public static get cubicSmoothRest(): RegExp {
    return PathRegexClass._cubicSmoothRest;
  }

  public static get quad(): RegExp {
    return PathRegexClass._quadratic;
  }

  public static get quadSmoothFirst(): RegExp {
    return PathRegexClass._quadraticSmoothFirst;
  }

  public static get quadSmoothRest(): RegExp {
    return PathRegexClass._quadraticSmoothRest;
  }

  public static get arc(): RegExp {
    return PathRegexClass._arc;
  }
}
