export interface Point {
  x: number;
  y: number;
}

export const memory: Map<string, Record<string, Point>> = new Map();
