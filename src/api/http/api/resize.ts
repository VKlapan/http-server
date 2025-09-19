import type { Point } from "../memory.ts";
import { memory } from "../memory.ts";

function resizePoint(point: Point, factor: number) {
  point.x *= factor;
  point.y *= factor;
}

export default async function resize(
  name: string,
  factor: number
): Promise<string> {
  const shape = memory.get(name);
  if (!shape) return "Shape is not found";

  for (const key in shape) {
    const point = shape[key];
    if (point) resizePoint(point, factor);
  }
  return "Shape resized";
}
