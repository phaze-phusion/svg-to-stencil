// copied from svgon types.d.ts
export interface INode {
  name: string,
  type: string,
  value: string,
  attributes: Record<string, string>,
  children: INode[]
}
