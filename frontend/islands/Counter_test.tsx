import { assertEquals, assertExists } from "jsr:@std/assert";
import { signal } from "@preact/signals";
import Counter from "./Counter.tsx";

Deno.test("Counter component exports correctly", () => {
  assertExists(Counter);
  assertEquals(typeof Counter, "function");
});

Deno.test("Counter accepts signal prop", () => {
  const count = signal(5);
  const component = Counter({ count });

  assertExists(component);
  assertEquals(typeof component, "object");
});

Deno.test("Counter renders without errors", () => {
  const count = signal(0);
  const component = Counter({ count });

  assertExists(component);
  assertExists(component.props);
  assertEquals(typeof component.props, "object");
});
