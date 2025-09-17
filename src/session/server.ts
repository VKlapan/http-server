import http from "node:http";
import { Client } from "./client.ts";
import { Session } from "./session.ts";

type RouteHandler =
  | (() => Promise<string | Record<string, any>>)
  | ((client: Client) => Promise<string | Record<string, any>>);

const routing: Record<string, RouteHandler> = {
  "/": async () => "<h1>welcome to homepage</h1><hr>",
  "/start": async (client: Client) => {
    if (!client) throw new Error("Client is required for /start");
    Session.start(client);
    return `Session token is: ${client.token}`;
  },
  "/destroy": async (client: Client) => {
    const result = `Session destroyed: ${client.token}`;
    Session.delete(client);
    return result;
  },
  "/api/method1": async (client: Client) => {
    if (client.session) {
      client.session.set("method1", "called");
      return { data: "example result" };
    } else {
      return { data: "access is denied" };
    }
  },
  "/api/method2": async (client: Client) => ({
    url: client.req.url,
    headers: client.req.headers,
  }),
  "/api/method3": async (client: Client) => {
    console.log("SESSION: ", client.session);
    if (client.session) {
      return [...client.session.entries()]
        .map(([key, value]) => `<b>${key}</b>: ${value}<br>`)
        .join();
    }
    return "No session found";
  },
};

function isRoutingKey(url: string): url is keyof typeof routing {
  return Object.prototype.hasOwnProperty.call(routing, url);
}

const types = {
  object: JSON.stringify,
  string: (s: string) => s,
  number: (n: number) => n.toString(),
  undefined: () => "not found",
};

http
  .createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const client = await Client.getInstance(req, res);
    const { method, url, headers } = req;
    console.log(`${method} ${url} ${headers.cookie}`);
    const handler = url && isRoutingKey(url) ? routing[url] : undefined;
    res.on("finish", () => {
      if (client.session) client.session.save();
    });
    if (!handler) {
      res.statusCode = 404;
      res.end("Not found 404");
      return;
    }
    handler(client).then(
      (data) => {
        const type = typeof data;
        const serializer = types[type as keyof typeof types];
        const result = serializer(data);
        client.sendCookie();
        res.end(result);
      },
      (err) => {
        res.statusCode = 500;
        res.end("Internal Server Error 500");
        console.log(err);
      }
    );
  })
  .listen(8000);
