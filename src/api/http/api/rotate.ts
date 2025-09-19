import type { Point } from "../memory.ts";
import { memory } from "../memory.ts";

function rotatePoint(point: Point, angle: number) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const { x, y } = point;
  point.x = x * cos - y * sin;
  point.y = x * sin + y * cos;
}

export default async function rotate(
  name: string,
  angle: number
): Promise<string> {
  const shape = memory.get(name);
  if (!shape) return "Shape is not found";

  for (const key in shape) {
    const point = shape[key];
    if (point) rotatePoint(point, angle);
  }
  return "Shape rotated";
}
