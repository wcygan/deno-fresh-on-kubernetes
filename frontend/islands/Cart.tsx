// frontend/islands/Cart.tsx
import { useEffect, useState } from "preact/hooks";
import {
  cartItems,
  cartTotal,
  clearCart,
  itemCount,
  loadCart,
  removeItem,
  updateQuantity,
} from "../lib/cart-state.ts";
import { formatMoney } from "../lib/money.ts";
import { Button } from "../components/Button.tsx";

/**
 * Main Cart component
 */
export default function Cart() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load cart on component mount
  useEffect(loadCart, []);

  /**
   * Handle checkout process
   */
  async function handleCheckout() {
    if (cartItems.value.length === 0) {
      return;
    }

    setIsCheckingOut(true);

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
        setIsCheckingOut(false);
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
      setIsCheckingOut(false);
    }
  }

  return (
    <div class="card p-4 sticky top-4">
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-900">
          Cart{" "}
          {itemCount.value > 0 && (
            <span class="text-sm font-normal text-neutral-500">
              ({itemCount.value} {itemCount.value === 1 ? "item" : "items"})
            </span>
          )}
        </h2>

        {cartItems.value.length > 0 && (
          <Button
            type="button"
            onClick={clearCart}
            variant="ghost"
            size="sm"
            class="text-neutral-600"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Cart Items */}
      {cartItems.value.length === 0
        ? (
          <div class="text-center py-8">
            <div class="text-neutral-400 mb-2">🛒</div>
            <p class="text-neutral-500 text-sm">Your cart is empty</p>
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
                    <h3 class="font-medium text-neutral-900 text-sm truncate">
                      {item.name}
                    </h3>

                    <div class="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div class="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.priceId, item.quantity - 1)}
                          class="btn btn-ghost btn-sm rounded-full w-8 h-8"
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
                          class="btn btn-ghost btn-sm rounded-full w-8 h-8"
                          disabled={item.quantity >= 20}
                        >
                          +
                        </button>
                      </div>

                      {/* Price and Remove */}
                      <div class="text-right">
                        <div class="font-semibold text-sm text-neutral-900">
                          {formatMoney(
                            item.unitAmount * item.quantity,
                            item.currency,
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeItem(item.priceId)}
                          variant="danger"
                          size="sm"
                          class="mt-1 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div class="border-t border-border pt-4 space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-neutral-900">Total</span>
                <span class="font-bold text-lg text-neutral-900">
                  {/* Use first item's currency for total display */}
                  {formatMoney(
                    cartTotal.value,
                    cartItems.value[0]?.currency ?? "usd",
                  )}
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.value.length === 0}
                variant="primary"
                size="lg"
                class="w-full"
                loading={isCheckingOut}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
    </div>
  );
}
