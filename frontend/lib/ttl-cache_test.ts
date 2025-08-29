import { assertEquals } from "jsr:@std/assert";
import { TTLCache } from "./ttl-cache.ts";

Deno.test("TTLCache - basic get/set operations", () => {
  const cache = new TTLCache<string>(5000); // 5 second TTL

  cache.set("key1", "value1");
  assertEquals(cache.get("key1"), "value1");

  cache.set("key2", "value2");
  assertEquals(cache.get("key2"), "value2");
  assertEquals(cache.size(), 2);
});

Deno.test("TTLCache - entries expire after TTL", async () => {
  const cache = new TTLCache<string>(100); // 100ms TTL

  cache.set("key", "value");
  assertEquals(cache.get("key"), "value");

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 150));

  assertEquals(cache.get("key"), undefined);
  assertEquals(cache.size(), 0); // size() cleans up expired entries
});

Deno.test("TTLCache - multiple entries with different ages", async () => {
  const cache = new TTLCache<number>(200); // 200ms TTL

  cache.set("key1", 1);
  await new Promise((resolve) => setTimeout(resolve, 50));

  cache.set("key2", 2);
  await new Promise((resolve) => setTimeout(resolve, 50));

  cache.set("key3", 3);

  // key1 should be close to expiring, key3 is newest
  assertEquals(cache.get("key1"), 1);
  assertEquals(cache.get("key2"), 2);
  assertEquals(cache.get("key3"), 3);
  assertEquals(cache.size(), 3);

  // Wait for key1 to expire
  await new Promise((resolve) => setTimeout(resolve, 120));

  assertEquals(cache.get("key1"), undefined);
  assertEquals(cache.get("key2"), 2);
  assertEquals(cache.get("key3"), 3);
});

Deno.test("TTLCache - clear removes all entries", () => {
  const cache = new TTLCache<string>(5000);

  cache.set("key1", "value1");
  cache.set("key2", "value2");
  assertEquals(cache.size(), 2);

  cache.clear();
  assertEquals(cache.size(), 0);
  assertEquals(cache.get("key1"), undefined);
  assertEquals(cache.get("key2"), undefined);
});

Deno.test("TTLCache - overwriting existing keys", () => {
  const cache = new TTLCache<string>(5000);

  cache.set("key", "value1");
  assertEquals(cache.get("key"), "value1");

  cache.set("key", "value2");
  assertEquals(cache.get("key"), "value2");
  assertEquals(cache.size(), 1);
});

Deno.test("TTLCache - get returns undefined for non-existent keys", () => {
  const cache = new TTLCache<string>(5000);

  assertEquals(cache.get("nonexistent"), undefined);
  assertEquals(cache.size(), 0);
});

Deno.test("TTLCache - size() properly cleans expired entries", async () => {
  const cache = new TTLCache<string>(100); // 100ms TTL

  cache.set("key1", "value1");
  cache.set("key2", "value2");
  assertEquals(cache.size(), 2);

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 150));

  // size() should clean up and return 0
  assertEquals(cache.size(), 0);
});

Deno.test("TTLCache - works with different data types", () => {
  const stringCache = new TTLCache<string>(5000);
  const numberCache = new TTLCache<number>(5000);
  const objectCache = new TTLCache<{ id: number; name: string }>(5000);

  stringCache.set("str", "hello");
  numberCache.set("num", 42);
  objectCache.set("obj", { id: 1, name: "test" });

  assertEquals(stringCache.get("str"), "hello");
  assertEquals(numberCache.get("num"), 42);
  assertEquals(objectCache.get("obj"), { id: 1, name: "test" });
});
