import { assert, assertEquals } from "jsr:@std/assert";
import { RateLimiter } from "./rate-limiter.ts";

Deno.test("RateLimiter - allows requests within limit", () => {
  const limiter = new RateLimiter(3, 1000); // 3 requests per second

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user1"));

  assertEquals(limiter.getRemainingRequests("user1"), 0);
});

Deno.test("RateLimiter - blocks requests over limit", () => {
  const limiter = new RateLimiter(2, 1000); // 2 requests per second

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user1"));
  assert(!limiter.isAllowed("user1")); // Should be blocked

  assertEquals(limiter.getRemainingRequests("user1"), 0);
});

Deno.test("RateLimiter - separate limits for different keys", () => {
  const limiter = new RateLimiter(2, 1000);

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user1"));
  assert(!limiter.isAllowed("user1")); // user1 blocked

  assert(limiter.isAllowed("user2")); // user2 still allowed
  assert(limiter.isAllowed("user2"));
  assert(!limiter.isAllowed("user2")); // user2 now blocked
});

Deno.test("RateLimiter - requests reset after window", async () => {
  const limiter = new RateLimiter(2, 100); // 2 requests per 100ms

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user1"));
  assert(!limiter.isAllowed("user1"));

  // Wait for window to reset
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert(limiter.isAllowed("user1")); // Should work again
  assertEquals(limiter.getRemainingRequests("user1"), 1);
});

Deno.test("RateLimiter - cleanup removes empty buckets", async () => {
  const limiter = new RateLimiter(1, 100); // 1 request per 100ms

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user2"));
  assertEquals(limiter.getBucketCount(), 2);

  // Wait for entries to expire
  await new Promise((resolve) => setTimeout(resolve, 150));

  limiter.cleanup();
  assertEquals(limiter.getBucketCount(), 0);
});

Deno.test("RateLimiter - cleanup preserves valid entries", async () => {
  const limiter = new RateLimiter(2, 200); // 2 requests per 200ms

  // Add old entry
  assert(limiter.isAllowed("user1"));

  // Wait 100ms
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Add new entry
  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user2"));

  // Wait another 150ms (total 250ms - old entry expired, new ones valid)
  await new Promise((resolve) => setTimeout(resolve, 150));

  limiter.cleanup();
  assertEquals(limiter.getBucketCount(), 2); // user1 and user2 buckets preserved

  // user1 should still have one valid entry
  assertEquals(limiter.getRemainingRequests("user1"), 1);
});

Deno.test("RateLimiter - getRemainingRequests works correctly", () => {
  const limiter = new RateLimiter(3, 1000);

  assertEquals(limiter.getRemainingRequests("user1"), 3);

  assert(limiter.isAllowed("user1"));
  assertEquals(limiter.getRemainingRequests("user1"), 2);

  assert(limiter.isAllowed("user1"));
  assertEquals(limiter.getRemainingRequests("user1"), 1);

  assert(limiter.isAllowed("user1"));
  assertEquals(limiter.getRemainingRequests("user1"), 0);
});

Deno.test("RateLimiter - getResetTime returns correct time", () => {
  const limiter = new RateLimiter(2, 1000);

  const before = Date.now();
  assert(limiter.isAllowed("user1"));
  const after = Date.now();

  const resetTime = limiter.getResetTime("user1");
  assert(resetTime >= before + 1000);
  assert(resetTime <= after + 1000);
});

Deno.test("RateLimiter - clearKey removes specific key", () => {
  const limiter = new RateLimiter(1, 1000);

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user2"));
  assert(!limiter.isAllowed("user1")); // blocked

  limiter.clearKey("user1");
  assert(limiter.isAllowed("user1")); // now allowed again
  assert(!limiter.isAllowed("user2")); // still blocked
});

Deno.test("RateLimiter - clear removes all data", () => {
  const limiter = new RateLimiter(1, 1000);

  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user2"));
  assertEquals(limiter.getBucketCount(), 2);

  limiter.clear();
  assertEquals(limiter.getBucketCount(), 0);

  // Both users should be allowed again
  assert(limiter.isAllowed("user1"));
  assert(limiter.isAllowed("user2"));
});
