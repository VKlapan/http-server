import { parentPort } from "node:worker_threads";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ApiMethod = (...args: unknown[]) => Promise<unknown> | unknown;

const modules = new Map<string, ApiMethod>();
const hashes = new Map<string, number>();

const apiPath = path.join(__dirname, "api");

// Simple hash function for file content
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Load or reload a module
async function loadModule(file: string) {
  const modulePath = path.join(apiPath, file);
  try {
    const content = await fs.readFile(modulePath, "utf8");
    const currentHash = hashCode(content);

    if (hashes.get(file) === currentHash) return; // unchanged

    const mod = await import(
      pathToFileURL(modulePath).href + `?v=${Date.now()}`
    );
    const exported: ApiMethod = mod.default ?? mod;

    modules.set(file, exported);
    hashes.set(file, currentHash);

    parentPort?.postMessage({
      module: file,
      status: "loaded",
    });
  } catch (err: any) {
    modules.delete(file);
    hashes.delete(file);
    parentPort?.postMessage({ module: file, error: err.message });
  }
}

// Load all modules initially
async function loadAllModules() {
  const files = await fs.readdir(apiPath);
  for (const file of files) await loadModule(file);
}

// Watch API folder for changes
function watchModules() {
  fsSync.watch(apiPath, async (_, file) => {
    if (!file) return;

    const fullPath = path.join(apiPath, file);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) await loadModule(file);
    } catch {
      // file removed
      modules.delete(file);
      hashes.delete(file);
      parentPort?.postMessage({ module: file, status: "removed" });
    }
  });
}

// Listen for call requests from the server
parentPort?.on("message", async (msg: any) => {
  if (msg.action === "call") {
    const fn = modules.get(msg.module);
    try {
      if (!fn) throw new Error("Module not loaded");
      const result = await fn(...msg.args);
      parentPort?.postMessage({ id: msg.id, module: msg.module, result });
    } catch (err: any) {
      parentPort?.postMessage({
        id: msg.id,
        module: msg.module,
        error: err.message,
      });
    }
  }
});

// Initialize worker
(async () => {
  await loadAllModules();
  watchModules();
})();
