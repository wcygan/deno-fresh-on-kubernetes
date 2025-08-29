import { define } from "../../utils.ts";

export const requestIdMiddleware = define.middleware(async (ctx) => {
  // Generate a unique request ID
  const requestId = crypto.randomUUID();

  // Add to context state for use in handlers
  ctx.state.requestId = requestId;

  // Get the response
  const response = await ctx.next();

  // Add request ID to response headers for debugging/tracing
  response.headers.set("x-request-id", requestId);

  // Add to response headers for CORS if needed
  if (response.headers.has("access-control-expose-headers")) {
    const existing = response.headers.get("access-control-expose-headers") ||
      "";
    response.headers.set(
      "access-control-expose-headers",
      existing ? `${existing}, x-request-id` : "x-request-id",
    );
  }

  return response;
});

/**
 * Extract request ID from request headers or generate new one
 * Useful for distributed tracing where request ID might be passed from upstream
 */
export function getOrCreateRequestId(request: Request): string {
  // Check for existing request ID from upstream services
  const existingId = request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-trace-id");

  if (existingId) {
    return existingId;
  }

  return crypto.randomUUID();
}

/**
 * Enhanced request ID middleware that preserves upstream request IDs
 */
export const enhancedRequestIdMiddleware = define.middleware(async (ctx) => {
  const requestId = getOrCreateRequestId(ctx.req);
  ctx.state.requestId = requestId;

  const response = await ctx.next();
  response.headers.set("x-request-id", requestId);

  return response;
});

/**
 * Logger helper that includes request ID
 */
export function createLogger(requestId: string) {
  return {
    info: (message: string, ...args: unknown[]) => {
      console.log(`[${requestId}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${requestId}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${requestId}] ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      console.debug(`[${requestId}] ${message}`, ...args);
    },
  };
}
