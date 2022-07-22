export interface PathAttributes extends Record<string, string> {
  d: string;
}

export interface CircleAttributes extends Record<string, string> {
  cx: string;
  cy: string;
  r: string;
}

export interface SVGAttributes extends Record<string, string> {
  width: string;
  height: string;
}
