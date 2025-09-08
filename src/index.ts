import "dotenv/config";

console.log("Hello world!");
console.log("FROM ENV: ", process.env.OPENAI_API_KEY);

import http from "node:http";

import { rateLimiter } from "./RateLimiter.js";

// Middleware to apply rate limiting
const rateLimitMiddleware = rateLimiter.getMiddleware();

const hostname: string = "127.0.0.1";
const port: number = 3000;

const middlewareLogger = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
) => {
  console.log(`node-http-server: ${req.method} ${req.url}`);
  next();
};

const server = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    middlewareLogger(req, res, () =>
      rateLimitMiddleware(req, res, () => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");

        if (req.url === "/") {
          res.end("Hello from Node.js with TypeScript!\n");
        } else if (req.url === "/api") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "API endpoint hit!" }));
        } else {
          res.statusCode = 404;
          res.end("Not Found\n");
        }
      })
    );
  }
);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
