import { assertEquals, assertExists } from "jsr:@std/assert";
import ClearCartOnSuccess from "./ClearCartOnSuccess.tsx";
import { addToCart, cartItems, clearCart } from "../lib/cart-state.ts";

// Mock localStorage for testing
const mockLocalStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockLocalStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
  removeItem: (key: string) => mockLocalStorage.delete(key),
  clear: () => mockLocalStorage.clear(),
};

Deno.test("ClearCartOnSuccess component exports correctly", () => {
  assertExists(ClearCartOnSuccess);
  assertEquals(typeof ClearCartOnSuccess, "function");
});

Deno.test("ClearCartOnSuccess component can be imported", () => {
  // Ensure cart is empty
  clearCart();

  // Test that component exists and is a function
  assertEquals(typeof ClearCartOnSuccess, "function");
});

Deno.test("Cart state integration works with ClearCartOnSuccess", () => {
  // Add item to cart first
  addToCart({
    priceId: "price_test",
    productId: "prod_test",
    name: "Test Product",
    unitAmount: 1999,
    currency: "usd",
    quantity: 1,
  });

  // Verify cart has items
  assertEquals(cartItems.value.length, 1);

  // Test that component exists and cart has items
  assertEquals(typeof ClearCartOnSuccess, "function");
  assertEquals(cartItems.value[0].name, "Test Product");
});

Deno.test("Cart clearing functionality works", () => {
  // Start with a clean cart
  clearCart();
  assertEquals(cartItems.value.length, 0);

  // Add item to cart
  addToCart({
    priceId: "price_test2",
    productId: "prod_test2",
    name: "Test Product 2",
    unitAmount: 2999,
    currency: "usd",
    quantity: 2,
  });

  // Verify cart has items
  assertEquals(cartItems.value.length, 1);
  assertEquals(cartItems.value[0].quantity, 2);

  // Clear cart
  clearCart();

  // Verify cart is now empty
  assertEquals(cartItems.value.length, 0);
});
