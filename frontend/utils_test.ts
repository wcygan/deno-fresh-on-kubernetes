import { assertEquals, assertExists } from "jsr:@std/assert";
import { define, type State } from "./utils.ts";

Deno.test("define export exists and is an object", () => {
  assertExists(define);
  assertEquals(typeof define, "object");
});

Deno.test("State interface has required properties", () => {
  const testState: State = {
    shared: "test value",
    requestId: "test-request-id",
  };

  assertEquals(testState.shared, "test value");
  assertEquals(testState.requestId, "test-request-id");
});

Deno.test("define has expected Fresh helper methods", () => {
  assertExists(define.page);
  assertExists(define.handlers);
  assertExists(define.middleware);

  assertEquals(typeof define.page, "function");
  assertEquals(typeof define.handlers, "function");
  assertEquals(typeof define.middleware, "function");
});
