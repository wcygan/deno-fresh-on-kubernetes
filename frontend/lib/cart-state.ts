// frontend/lib/cart-state.ts
// Global cart state using Preact signals (client-safe)

import { computed, signal } from "@preact/signals";
import { CartDisplaySchema, type CartItemDisplay } from "./schemas.ts";

// Global cart state using Preact signals
export const cartItems = signal<CartItemDisplay[]>([]);

// Computed total amount in cents
export const cartTotal = computed(() =>
  cartItems.value.reduce(
    (sum, item) => sum + (item.unitAmount * item.quantity),
    0,
  )
);

// Computed item count
export const itemCount = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
);

/**
 * Load cart from localStorage
 */
export function loadCart() {
  // Only run in browser
  if (typeof localStorage === "undefined") return;

  try {
    const stored = localStorage.getItem("cart");
    if (!stored) {
      cartItems.value = [];
      return;
    }

    const parsed = JSON.parse(stored);
    const validated = CartDisplaySchema.safeParse(parsed);

    if (validated.success) {
      cartItems.value = validated.data.items;
    } else {
      console.warn("Invalid cart data in localStorage, resetting cart");
      cartItems.value = [];
      saveCart();
    }
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    cartItems.value = [];
  }
}

/**
 * Save cart to localStorage
 */
export function saveCart() {
  // Only run in browser
  if (typeof localStorage === "undefined") return;

  try {
    const cartData = { items: cartItems.value };
    localStorage.setItem("cart", JSON.stringify(cartData));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
}

/**
 * Add item to cart or update quantity if it exists
 */
export function addToCart(item: CartItemDisplay) {
  const existingIndex = cartItems.value.findIndex(
    (cartItem) => cartItem.priceId === item.priceId,
  );

  if (existingIndex >= 0) {
    // Update existing item quantity (max 20)
    const updated = [...cartItems.value];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: Math.min(20, updated[existingIndex].quantity + item.quantity),
    };
    cartItems.value = updated;
  } else {
    // Add new item
    cartItems.value = [...cartItems.value, { ...item }];
  }

  saveCart();
}

/**
 * Update item quantity
 */
export function updateQuantity(priceId: string, newQuantity: number) {
  if (newQuantity <= 0) {
    removeItem(priceId);
    return;
  }

  const updated = cartItems.value.map((item) =>
    item.priceId === priceId
      ? { ...item, quantity: Math.min(20, Math.max(1, newQuantity)) }
      : item
  );

  cartItems.value = updated;
  saveCart();
}

/**
 * Remove item from cart
 */
export function removeItem(priceId: string) {
  cartItems.value = cartItems.value.filter((item) => item.priceId !== priceId);
  saveCart();
}

/**
 * Clear entire cart
 */
export function clearCart() {
  cartItems.value = [];
  saveCart();
}
