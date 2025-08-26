// frontend/islands/Cart.tsx
import { useEffect } from "preact/hooks";
import {
  cartItems,
  cartTotal,
  clearCart,
  itemCount,
  loadCart,
  removeItem,
  updateQuantity,
} from "../lib/cart-state.ts";
import { formatMoney } from "../lib/client-utils.ts";

/**
 * Main Cart component
 */
export default function Cart() {
  // Load cart on component mount
  useEffect(loadCart, []);

  /**
   * Handle checkout process
   */
  async function handleCheckout() {
    if (cartItems.value.length === 0) {
      return;
    }

    try {
      // Build checkout payload
      const checkoutData = {
        items: cartItems.value.map((item) => ({
          priceId: item.priceId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      // Call checkout API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Checkout failed:", errorData);

        // TODO: Show user-friendly error message
        alert("Checkout failed. Please try again.");
        return;
      }

      const result = await response.json();

      // Redirect to Stripe Checkout
      if (result.url) {
        globalThis.location.href = result.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div class="bg-white rounded-2xl border shadow-sm p-4 sticky top-4">
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">
          Cart{" "}
          {itemCount.value > 0 && (
            <span class="text-sm font-normal text-gray-500">
              ({itemCount.value} {itemCount.value === 1 ? "item" : "items"})
            </span>
          )}
        </h2>

        {cartItems.value.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            class="text-sm text-gray-500 hover:text-red-600 transition-colors"
            title="Clear cart"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      {cartItems.value.length === 0
        ? (
          <div class="text-center py-8">
            <div class="text-gray-400 mb-2">🛒</div>
            <p class="text-gray-500 text-sm">Your cart is empty</p>
          </div>
        )
        : (
          <>
            {/* Items List */}
            <div class="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {cartItems.value.map((item) => (
                <div
                  key={item.priceId}
                  class="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl"
                >
                  {/* Product Image */}
                  {item.image && (
                    <div class="w-12 h-12 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 text-sm truncate">
                      {item.name}
                    </h3>

                    <div class="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div class="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.priceId, item.quantity - 1)}
                          class="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>

                        <span class="text-sm font-medium w-4 text-center">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.priceId, item.quantity + 1)}
                          class="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                          disabled={item.quantity >= 20}
                        >
                          +
                        </button>
                      </div>

                      {/* Price and Remove */}
                      <div class="text-right">
                        <div class="font-semibold text-sm text-gray-900">
                          {formatMoney(
                            item.unitAmount * item.quantity,
                            item.currency,
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.priceId)}
                          class="text-xs text-red-500 hover:text-red-700 transition-colors mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div class="border-t pt-4 space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-gray-900">Total</span>
                <span class="font-bold text-lg text-gray-900">
                  {/* Use first item's currency for total display */}
                  {formatMoney(
                    cartTotal.value,
                    cartItems.value[0]?.currency ?? "usd",
                  )}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.value.length === 0}
                class="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Checkout
              </button>
            </div>
          </>
        )}
    </div>
  );
}
