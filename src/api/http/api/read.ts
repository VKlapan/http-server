import { memory } from "../memory.ts";

module.exports = async (name: string) => {
  const shape = memory.get(name);
  if (!shape) return "Shape is not found";
  return shape;
};
