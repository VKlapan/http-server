import type { Point } from "../memory.ts";
import { memory } from "../memory.ts";

function movePoint(point: Point, dx: number, dy: number) {
  point.x += dx;
  point.y += dy;
}

export default async function move(
  name: string,
  dx: number,
  dy: number
): Promise<string> {
  const shape = memory.get(name);
  if (!shape) return "Shape is not found";

  for (const key in shape) {
    const point = shape[key];
    if (point) movePoint(point, dx, dy);
  }
  return "Shape moved";
}
