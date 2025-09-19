import type { Point } from "../memory.ts";
import { memory } from "../memory.ts";

export default async function render(name: string): Promise<string> {
  const shape = memory.get(name);
  if (!shape) return "Shape is not found";

  const points: Point[] = Object.values(shape);
  const svg: string[] = [];

  svg.push('<svg viewBox="-20 -20 40 40" xmlns="http://www.w3.org/2000/svg">');
  svg.push('<polygon points="');
  svg.push(points.map(({ x, y }) => `${x},${y}`).join(" "));
  svg.push('" /></svg>');

  return svg.join("");
}
