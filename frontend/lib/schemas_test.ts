// frontend/lib/schemas_test.ts
import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import {
  CartDisplaySchema,
  CartItemSchema,
  CartSchema,
  CheckoutCreateRequest,
  CheckoutSuccessQuery,
  PriceId,
  ProductId,
} from "./schemas.ts";

Deno.test("PriceId schema validation", async (t) => {
  await t.step("accepts valid price IDs", () => {
    assertEquals(PriceId.parse("price_1234567890"), "price_1234567890");
    assertEquals(
      PriceId.parse(
        "price_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      ),
      "price_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    );
  });

  await t.step("rejects invalid price IDs", () => {
    assertThrows(() => PriceId.parse("invalid"));
    assertThrows(() => PriceId.parse("prod_123"));
    assertThrows(() => PriceId.parse("price_"));
    assertThrows(() => PriceId.parse("price_123!@#"));
  });
});

Deno.test("ProductId schema validation", async (t) => {
  await t.step("accepts valid product IDs", () => {
    assertEquals(ProductId.parse("prod_1234567890"), "prod_1234567890");
    assertEquals(
      ProductId.parse(
        "prod_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      ),
      "prod_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    );
  });

  await t.step("rejects invalid product IDs", () => {
    assertThrows(() => ProductId.parse("invalid"));
    assertThrows(() => ProductId.parse("price_123"));
    assertThrows(() => ProductId.parse("prod_"));
    assertThrows(() => ProductId.parse("prod_123!@#"));
  });
});

Deno.test("CartItemSchema validation", async (t) => {
  await t.step("accepts valid cart item", () => {
    const validItem = {
      priceId: "price_123abc",
      productId: "prod_456def",
      quantity: 2,
    };

    const parsed = CartItemSchema.parse(validItem);
    assertEquals(parsed.priceId, "price_123abc");
    assertEquals(parsed.productId, "prod_456def");
    assertEquals(parsed.quantity, 2);
  });

  await t.step("coerces string quantities to numbers", () => {
    const item = {
      priceId: "price_123abc",
      productId: "prod_456def",
      quantity: "5",
    };

    const parsed = CartItemSchema.parse(item);
    assertEquals(parsed.quantity, 5);
  });

  await t.step("rejects invalid quantities", () => {
    // Zero quantity
    assertThrows(() =>
      CartItemSchema.parse({
        priceId: "price_123abc",
        productId: "prod_456def",
        quantity: 0,
      })
    );

    // Negative quantity
    assertThrows(() =>
      CartItemSchema.parse({
        priceId: "price_123abc",
        productId: "prod_456def",
        quantity: -1,
      })
    );

    // Quantity too high
    assertThrows(() =>
      CartItemSchema.parse({
        priceId: "price_123abc",
        productId: "prod_456def",
        quantity: 21,
      })
    );
  });

  await t.step("rejects invalid price/product IDs", () => {
    // Invalid price ID
    assertThrows(() =>
      CartItemSchema.parse({
        priceId: "invalid",
        productId: "prod_456def",
        quantity: 1,
      })
    );

    // Invalid product ID
    assertThrows(() =>
      CartItemSchema.parse({
        priceId: "price_123abc",
        productId: "invalid",
        quantity: 1,
      })
    );
  });
});

Deno.test("CartSchema validation", async (t) => {
  await t.step("accepts valid cart", () => {
    const validCart = {
      items: [
        { priceId: "price_123", productId: "prod_456", quantity: 1 },
        { priceId: "price_789", productId: "prod_012", quantity: 3 },
      ],
    };

    const parsed = CartSchema.parse(validCart);
    assertEquals(parsed.items.length, 2);
    assertEquals(parsed.items[0].quantity, 1);
    assertEquals(parsed.items[1].quantity, 3);
  });

  await t.step("rejects empty cart", () => {
    assertThrows(() => CartSchema.parse({ items: [] }));
  });

  await t.step("rejects cart with too many items", () => {
    const tooManyItems = Array.from({ length: 51 }, (_, i) => ({
      priceId: `price_${i}`,
      productId: `prod_${i}`,
      quantity: 1,
    }));

    assertThrows(() => CartSchema.parse({ items: tooManyItems }));
  });
});

Deno.test("CheckoutCreateRequest validation", async (t) => {
  await t.step("accepts valid checkout request", () => {
    const validRequest = {
      items: [
        { priceId: "price_123", productId: "prod_456", quantity: 2 },
      ],
      customerEmail: "test@example.com",
      metadata: { orderId: "12345" },
    };

    const parsed = CheckoutCreateRequest.parse(validRequest);
    assertEquals(parsed.items.length, 1);
    assertEquals(parsed.customerEmail, "test@example.com");
    assertEquals(parsed.metadata?.orderId, "12345");
  });

  await t.step("accepts request without optional fields", () => {
    const minimalRequest = {
      items: [
        { priceId: "price_123", productId: "prod_456", quantity: 1 },
      ],
    };

    const parsed = CheckoutCreateRequest.parse(minimalRequest);
    assertEquals(parsed.items.length, 1);
    assertEquals(parsed.customerEmail, undefined);
    assertEquals(parsed.metadata, undefined);
  });

  await t.step("rejects invalid email", () => {
    assertThrows(() =>
      CheckoutCreateRequest.parse({
        items: [{ priceId: "price_123", productId: "prod_456", quantity: 1 }],
        customerEmail: "invalid-email",
      })
    );
  });

  await t.step("rejects extra properties", () => {
    assertThrows(() =>
      CheckoutCreateRequest.parse({
        items: [{ priceId: "price_123", productId: "prod_456", quantity: 1 }],
        extraField: "not allowed",
      })
    );
  });
});

Deno.test("CheckoutSuccessQuery validation", async (t) => {
  await t.step("accepts valid session ID", () => {
    const query = { session_id: "cs_test_1234567890" };
    const parsed = CheckoutSuccessQuery.parse(query);
    assertEquals(parsed.session_id, "cs_test_1234567890");
  });

  await t.step("rejects empty session ID", () => {
    assertThrows(() => CheckoutSuccessQuery.parse({ session_id: "" }));
  });

  await t.step("rejects missing session ID", () => {
    assertThrows(() => CheckoutSuccessQuery.parse({}));
  });
});

Deno.test("CartDisplaySchema validation", async (t) => {
  await t.step("accepts valid display cart", () => {
    const displayCart = {
      items: [
        {
          priceId: "price_123",
          productId: "prod_456",
          quantity: 2,
          name: "Test Product",
          currency: "usd",
          unitAmount: 1999,
          image: "https://example.com/image.jpg",
        },
      ],
    };

    const parsed = CartDisplaySchema.parse(displayCart);
    assertEquals(parsed.items.length, 1);
    assertEquals(parsed.items[0].name, "Test Product");
    assertEquals(parsed.items[0].unitAmount, 1999);
    assertExists(parsed.items[0].image);
  });

  await t.step("accepts display cart without optional image", () => {
    const displayCart = {
      items: [
        {
          priceId: "price_123",
          productId: "prod_456",
          quantity: 1,
          name: "Test Product",
          currency: "usd",
          unitAmount: 999,
        },
      ],
    };

    const parsed = CartDisplaySchema.parse(displayCart);
    assertEquals(parsed.items[0].image, undefined);
  });

  await t.step("rejects display cart with invalid image URL", () => {
    assertThrows(() =>
      CartDisplaySchema.parse({
        items: [
          {
            priceId: "price_123",
            productId: "prod_456",
            quantity: 1,
            name: "Test Product",
            currency: "usd",
            unitAmount: 999,
            image: "not-a-url",
          },
        ],
      })
    );
  });
});
