import { assertEquals } from "jsr:@std/assert";
import { handler } from "./[name].tsx";

Deno.test("API route capitalizes name parameter", async () => {
  const mockContext = {
    params: { name: "john" },
    req: new Request("http://localhost/api/john"),
    state: { shared: "test" },
  };

  const response = await handler.GET?.(mockContext as any);
  const text = await response?.text();

  assertEquals(text, "Hello, John!");
});

Deno.test("API route handles empty name", async () => {
  const mockContext = {
    params: { name: "" },
    req: new Request("http://localhost/api/"),
    state: { shared: "test" },
  };

  const response = await handler.GET?.(mockContext as any);
  const text = await response?.text();

  assertEquals(text, "Hello, !");
});

Deno.test("API route preserves already capitalized names", async () => {
  const mockContext = {
    params: { name: "ALICE" },
    req: new Request("http://localhost/api/ALICE"),
    state: { shared: "test" },
  };

  const response = await handler.GET?.(mockContext as any);
  const text = await response?.text();

  assertEquals(text, "Hello, ALICE!");
});
