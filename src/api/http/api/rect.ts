import type { Point } from "../memory.ts";
import { memory } from "../memory.ts";

export default async function rect(
  name: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Promise<string> {
  const rect: Record<string, Point> = {
    a: { x: x1, y: y1 },
    b: { x: x2, y: y1 },
    c: { x: x2, y: y2 },
    d: { x: x1, y: y2 },
  };
  memory.set(name, rect);
  return "ok";
}
