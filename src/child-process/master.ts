import child_process from "node:child_process";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pid = process.pid;
const count = os.cpus().length;

console.log(`Master pid: ${pid}`);
console.log(`Starting ${count} forks`);

for (let i = 0; i < count; ) {
  //TODO Check it: The error occurs because child_process.fork expects ???? a CommonJS module (usually a .js file), not a TypeScript file (.ts).
  // Node.js cannot execute .ts files directly unless you use a loader like ts-node.

  child_process.fork(path.join(__dirname, "worker.ts"), [(++i).toString()]);
}
