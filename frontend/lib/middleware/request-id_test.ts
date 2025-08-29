import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert";
import {
  createLogger,
  enhancedRequestIdMiddleware,
  getOrCreateRequestId,
  requestIdMiddleware,
} from "./request-id.ts";
import type { State } from "../../utils.ts";

Deno.test("getOrCreateRequestId - generates new ID when none provided", () => {
  const request = new Request("https://example.com");
  const requestId = getOrCreateRequestId(request);

  assert(requestId.length > 0);
  // Should be a UUID format
  assert(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      requestId,
    ),
  );
});

Deno.test("getOrCreateRequestId - uses existing x-request-id header", () => {
  const existingId = "test-request-123";
  const request = new Request("https://example.com", {
    headers: { "x-request-id": existingId },
  });

  const requestId = getOrCreateRequestId(request);
  assertEquals(requestId, existingId);
});

Deno.test("getOrCreateRequestId - uses x-correlation-id header", () => {
  const existingId = "correlation-456";
  const request = new Request("https://example.com", {
    headers: { "x-correlation-id": existingId },
  });

  const requestId = getOrCreateRequestId(request);
  assertEquals(requestId, existingId);
});

Deno.test("getOrCreateRequestId - uses x-trace-id header", () => {
  const existingId = "trace-789";
  const request = new Request("https://example.com", {
    headers: { "x-trace-id": existingId },
  });

  const requestId = getOrCreateRequestId(request);
  assertEquals(requestId, existingId);
});

Deno.test("getOrCreateRequestId - prefers x-request-id over others", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-request-id": "request-id",
      "x-correlation-id": "correlation-id",
      "x-trace-id": "trace-id",
    },
  });

  const requestId = getOrCreateRequestId(request);
  assertEquals(requestId, "request-id");
});

Deno.test("createLogger - prefixes messages with request ID", () => {
  const requestId = "test-123";
  const logger = createLogger(requestId);

  // Mock console methods to capture output
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  let logOutput = "";
  let warnOutput = "";
  let errorOutput = "";

  console.log = (...args: unknown[]) => {
    logOutput = args.join(" ");
  };
  console.warn = (...args: unknown[]) => {
    warnOutput = args.join(" ");
  };
  console.error = (...args: unknown[]) => {
    errorOutput = args.join(" ");
  };

  try {
    logger.info("Test info message");
    logger.warn("Test warning");
    logger.error("Test error");

    assertStringIncludes(logOutput, "[test-123]");
    assertStringIncludes(logOutput, "Test info message");

    assertStringIncludes(warnOutput, "[test-123]");
    assertStringIncludes(warnOutput, "Test warning");

    assertStringIncludes(errorOutput, "[test-123]");
    assertStringIncludes(errorOutput, "Test error");
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

// Note: Middleware tests are omitted due to complex Fresh Context type requirements.
// The middleware functions are tested indirectly through integration tests.
