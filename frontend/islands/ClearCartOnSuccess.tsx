// frontend/islands/ClearCartOnSuccess.tsx
import { useEffect, useState } from "preact/hooks";
import { clearCart, itemCount } from "../lib/cart-state.ts";

/**
 * Island that automatically clears the cart on successful checkout
 * and provides optional visual feedback
 */
export default function ClearCartOnSuccess() {
  const [wasCleared, setWasCleared] = useState(false);
  const [hadItems, setHadItems] = useState(false);

  useEffect(() => {
    // Check if cart had items before clearing
    const itemCountBefore = itemCount.value;
    if (itemCountBefore > 0) {
      setHadItems(true);
      clearCart();
      setWasCleared(true);

      // Hide the notification after 3 seconds
      setTimeout(() => {
        setWasCleared(false);
      }, 3000);
    }
  }, []);

  // Don't render anything if cart was already empty
  if (!hadItems) {
    return null;
  }

  // Show subtle notification that cart was cleared
  return (
    <div
      class={`transition-opacity duration-500 ${
        wasCleared ? "opacity-100" : "opacity-0"
      }`}
    >
      {wasCleared && (
        <div class="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-xl shadow-md text-sm">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span>Cart cleared for new shopping</span>
          </div>
        </div>
      )}
    </div>
  );
}
