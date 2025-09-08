import http from "node:http";

type Options = {
  maxRequests: number;
  timeWindow: number;
};
class RateLimiter {
  constructor(
    private options: Options,
    private rateLimitStore = new Map<
      string,
      { requestCount: number; firstRequestTime: number }
    >()
  ) {}
  // Method to create the middleware function
  getMiddleware() {
    const { maxRequests, timeWindow } = this.options;

    return (
      req: http.IncomingMessage,
      res: http.ServerResponse,
      next: () => void
    ) => {
      const clientIp = req.socket.remoteAddress || "unknown"; // Retrieve client's IP address

      const currentTime = Date.now();
      let clientData = this.rateLimitStore.get(clientIp);

      if (!clientData) {
        // Initialize data for new client
        clientData = {
          requestCount: 0,
          firstRequestTime: currentTime,
        };
        this.rateLimitStore.set(clientIp, clientData);
      }

      const elapsedTime = currentTime - clientData.firstRequestTime;

      if (elapsedTime >= timeWindow) {
        // Reset count and timestamp if window has passed
        clientData.requestCount = 1;
        clientData.firstRequestTime = currentTime;
      } else {
        // Within window, check if limit exceeded
        if (clientData.requestCount >= maxRequests) {
          // Rate limit exceeded
          res.setHeader("X-RateLimit-Limit", maxRequests);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader(
            "X-RateLimit-Reset",
            Math.floor(
              (clientData.firstRequestTime + timeWindow - currentTime) / 1000
            )
          );
          res.statusCode = 429;
          return res.end(
            "You have exceeded the rate limit. Please try again later."
          );
        } else {
          // Increment request count
          clientData.requestCount += 1;
        }
      }

      // Set headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - clientData.requestCount)
      );
      res.setHeader(
        "X-RateLimit-Reset",
        Math.floor(
          (clientData.firstRequestTime + timeWindow - currentTime) / 1000
        )
      );

      console.dir(this.rateLimitStore, { depth: null });
      next();
    };
  }

  // Method to clear the store (reset all limits)
  clear() {
    this.rateLimitStore.clear();
  }
}

// Usage example:
const options = {
  maxRequests: 5,
  timeWindow: 100000, // 1 second window
};

export const rateLimiter = new RateLimiter(options);
