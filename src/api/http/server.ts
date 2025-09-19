import http, { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start worker
const apiWorker = new Worker(path.join(__dirname, "apiWorker.ts"), {
  execArgv: ["--loader", "tsx"],
});

// Pending requests
const pending = new Map<number, { resolve: Function; reject: Function }>();
let callId = 0;

// Handle messages from worker
apiWorker.on("message", (msg: any) => {
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)!;
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error));
    else resolve(msg.result);
  } else if (msg.status === "loaded") {
    console.log(`Module "${msg.module}" loaded`);
  } else if (msg.status === "removed") {
    console.log(`Module "${msg.module}" removed`);
  } else if (msg.error) {
    console.error(`Worker error for module "${msg.module}":`, msg.error);
  }
});

// Send call to worker
function callApi(module: string, args: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = ++callId;
    pending.set(id, { resolve, reject });
    apiWorker.postMessage({
      action: "call",
      id,
      module: `${module}.ts`,
      args,
    });
  });
}

// Receive JSON args
async function receiveArgs(req: IncomingMessage): Promise<unknown[]> {
  const buffers: Buffer[] = [];
  for await (const chunk of req) buffers.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(buffers).toString());
  } catch {
    return [];
  }
}

// HTTP error
function httpError(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status;
  res.end(JSON.stringify({ error: message }));
}

// HTTP server
http
  .createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url === "/" ? "/index.html" : req.url ?? "/";
    const [first, second] = url.substring(1).split("/");

    if (!first || typeof first !== "string") {
      httpError(res, 400, "Invalid URL");
      return;
    }

    if (first === "api") {
      if (!second || typeof second !== "string") {
        httpError(res, 400, "API method not specified");
        return;
      }

      try {
        const args = await receiveArgs(req);
        const result = await callApi(second, args);
        res.end(JSON.stringify(result));
      } catch (err: any) {
        console.error(err);
        httpError(res, 500, err.message || "Server error");
      }
    } else {
      // Serve static files
      const filePath = path.join(__dirname, "static", first);
      try {
        const data = await fs.readFile(filePath);
        res.end(data);
      } catch {
        httpError(res, 404, "File not found");
      }
    }
  })
  .listen(8000, () => {
    console.log("Server running on http://localhost:8000");
  });
