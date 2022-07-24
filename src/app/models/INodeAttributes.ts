export interface PathAttributes extends Record<string, string> {
  d: string;
}

export interface CircleAttributes extends Record<string, string> {
  cx: string;
  cy: string;
  r: string;
}

export interface EllipseAttributes extends Record<string, string> {
  cx: string;
  cy: string;
  rx: string;
  ry: string;
}

export interface RectangleAttributes extends Record<string, string> {
  width: string;
  height: string;
  x: string;
  y: string;
}

export interface RoundedRectangleAttributes extends Record<string, string> {
  width: string;
  height: string;
  x: string;
  y: string;
  rx: string;
  ry: string;
}

export interface SVGAttributes extends Record<string, string> {
  width: string;
  height: string;
}
