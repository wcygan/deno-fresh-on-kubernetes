import { assertEquals, assertExists } from "jsr:@std/assert";
import { handler } from "./checkout.ts";
import { setStripeForTests } from "../../lib/stripe.ts";
import type { CheckoutCreateRequest } from "../../lib/schemas.ts";

// Create mock context with required state
function createMockContext(req: Request): any {
  return {
    req,
    state: {
      requestId: "test-request-id",
      logger: {
        error: () => {},
        info: () => {},
        warn: () => {},
        debug: () => {},
      },
    },
  };
}

// Reset Stripe mock before each test
function setupFakeStripe() {
  const fake = {
    prices: {
      retrieve: async (priceId: string, _o?: any) => {
        if (priceId === "price_invalid") {
          throw new Error("No such price");
        }
        if (priceId === "price_inactive") {
          return {
            id: priceId,
            active: false,
            product: { id: "prod_test" },
          };
        }
        return {
          id: priceId,
          active: true,
          unit_amount: 1999,
          currency: "usd",
          product: { id: "prod_123" },
        };
      },
    },
    checkout: {
      sessions: {
        create: async (_params: any, _options?: any) => ({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/c/pay/test_123",
        }),
      },
    },
    products: { list: async () => ({ data: [] }) },
  };
  setStripeForTests(fake as any);
  return fake;
}

Deno.test("checkout rejects invalid payload", async () => {
  setStripeForTests(null as any); // not used in this path
  const ctx = createMockContext(
    new Request("http://x/api/checkout", {
      method: "POST",
      headers: { "x-forwarded-for": "192.168.1.1" },
      body: "{}",
    }),
  );
  const res = await handler.POST!(ctx);
  assertEquals(res.status, 400);
});

Deno.test("checkout validates price->product alignment", async () => {
  setupFakeStripe();

  const body = {
    items: [{ priceId: "price_1", productId: "prod_wrong", quantity: 1 }],
  };
  const ctx = createMockContext(
    new Request("http://x/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.2",
      },
      body: JSON.stringify(body),
    }),
  );
  const res = await handler.POST!(ctx);
  assertEquals(res.status, 400);
});

Deno.test("checkout happy path creates session", async () => {
  setupFakeStripe();

  const body = {
    items: [{ priceId: "price_1", productId: "prod_123", quantity: 2 }],
  };
  const ctx = createMockContext(
    new Request("http://x/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.3",
      },
      body: JSON.stringify(body),
    }),
  );
  const res = await handler.POST!(ctx);
  assertEquals(res.status, 200);
  const json = await res.json();
  assertEquals(typeof json.sessionId, "string");
  assertEquals(typeof json.url, "string");
});

Deno.test("checkout rate limiting works", async () => {
  setupFakeStripe();

  const body = {
    items: [{ priceId: "price_1", productId: "prod_123", quantity: 1 }],
  };
  const makeRequest = () => {
    const ctx = createMockContext(
      new Request("http://x/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.100", // same IP for rate limiting
        },
        body: JSON.stringify(body),
      }),
    );
    return handler.POST!(ctx);
  };

  // First request should succeed
  const res1 = await makeRequest();
  assertEquals(res1.status, 200);

  // Second request immediately should be rate limited
  const res2 = await makeRequest();
  assertEquals(res2.status, 429);
});

Deno.test("checkout comprehensive validation", async (t) => {
  await t.step("rejects inactive price", async () => {
    setupFakeStripe();

    const invalidRequest = {
      items: [
        {
          priceId: "price_inactive",
          productId: "prod_test",
          quantity: 1,
        },
      ],
    };

    const ctx = createMockContext(
      new Request("http://localhost:8000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.4",
        },
        body: JSON.stringify(invalidRequest),
      }),
    );

    const response = await handler.POST!(ctx);
    assertEquals(response.status, 400);

    const data = await response.json();
    assertEquals(data.error, "Price price_inactive is not active");
  });

  await t.step("rejects malformed JSON", async () => {
    setupFakeStripe();

    const ctx = createMockContext(
      new Request("http://localhost:8000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.5",
        },
        body: "invalid json",
      }),
    );

    const response = await handler.POST!(ctx);
    assertEquals(response.status, 400);

    const data = await response.json();
    assertExists(data.error);
    assertEquals(data.error, "Invalid request");
  });

  await t.step("rejects empty items array", async () => {
    setupFakeStripe();

    const invalidRequest = {
      items: [],
    };

    const ctx = createMockContext(
      new Request("http://localhost:8000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.6",
        },
        body: JSON.stringify(invalidRequest),
      }),
    );

    const response = await handler.POST!(ctx);
    assertEquals(response.status, 400);

    const data = await response.json();
    assertEquals(data.error, "Invalid request");
  });

  await t.step("accepts valid customer email", async () => {
    setupFakeStripe();

    const validRequest: CheckoutCreateRequest = {
      items: [
        {
          priceId: "price_1", // use existing mock price ID
          productId: "prod_123",
          quantity: 1,
        },
      ],
      customerEmail: "customer@example.com",
    };

    const ctx = createMockContext(
      new Request("http://localhost:8000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.7",
        },
        body: JSON.stringify(validRequest),
      }),
    );

    const response = await handler.POST!(ctx);
    assertEquals(response.status, 200);
  });
});
