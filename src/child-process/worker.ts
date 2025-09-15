import http from "node:http";
import { rateLimiter } from "../RateLimiter.js";

// Middleware to apply rate limiting
const rateLimitMiddleware = rateLimiter.getMiddleware();

const HOSTNAME: string = "127.0.0.1";
const BASE_PORT: number = 3000;

const pid = process.pid;
const id = parseInt(process.argv[2], 10);

const PORT = BASE_PORT + id - 1;

const user = {
  name: "John Doe",
  email: "jdoe@example.com",
  age: 30,
  address: {
    street: "123 Main St",
    city: "AnyTown",
    state: "CA",
    zip: "12345",
  },
};

const routing = {
  "/": (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.end("Hello from Node.js with TypeScript!\n");
  },
  "/api": (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "API endpoint hit!" }));
  },
  "/api/method1": (req: http.IncomingMessage, res: http.ServerResponse) => {
    console.log("Method1 called");
    return { method: req.url, status: res.statusCode };
  },
  "/user": user,
  "/user/name": () => user.name.toUpperCase(),
  "/user/email": () => user.email,
  "/user/age": user.age,
};

const types = {
  object: JSON.stringify,
  string: (data: string) => data,
  number: (data: number) => data.toString(),
  function: (
    fn: Function,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => JSON.stringify(fn(req, res)),
  undefined: () => "Not Found\n",
};

const middlewareLogger = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
) => {
  console.log(`node-http-server: ${req.method} ${req.url}`);
  next();
};

console.log(`Worker: ${id}, pid: ${pid}, port: ${PORT}`);
const server = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    middlewareLogger(req, res, () =>
      rateLimitMiddleware(req, res, () => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Process-Id", pid);

        const data = routing[req.url as keyof typeof routing];

        let result: string;
        switch (typeof data) {
          case "function":
            result = types.function(data, req, res);
            break;
          case "object":
            result = data !== null ? types.object(data) : types.undefined();
            break;
          case "string":
            result = types.string(data);
            break;
          case "number":
            result = types.number(data);
            break;
          default:
            result = types.undefined();
        }

        res.end(result);
      })
    );
  }
);

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});

server.on("clientError", (err, socket) => {
  console.error("Client error:", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
