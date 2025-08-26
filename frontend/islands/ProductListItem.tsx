// frontend/islands/ProductListItem.tsx
import type { CartItemDisplay } from "../lib/schemas.ts";
import { addToCart } from "../lib/cart-state.ts";
import { formatMoney } from "../lib/client-utils.ts";

interface ProductListItemProps {
  // Pass only serializable data to the island
  productId: string;
  name: string;
  description: string | null;
  images: string[];
  priceId?: string;
  unitAmount?: number;
  currency?: string;
}

export default function ProductListItem({
  productId,
  name,
  description,
  images,
  priceId,
  unitAmount,
  currency,
}: ProductListItemProps) {
  const isAvailable = priceId && unitAmount != null;

  function handleAddToCart() {
    if (!isAvailable || !priceId || !currency || unitAmount == null) {
      return;
    }

    const cartItem: CartItemDisplay = {
      priceId,
      productId,
      quantity: 1,
      name,
      currency,
      unitAmount,
      image: images?.[0],
    };

    addToCart(cartItem);
  }

  return (
    <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="aspect-square mb-4 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={images?.[0] ?? "/logo.svg"}
          alt={name}
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div class="space-y-3">
        <h2 class="text-xl font-semibold text-gray-900 leading-tight">
          {name}
        </h2>
        {description && (
          <p class="text-gray-600 text-sm line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
        <div class="flex items-center justify-between pt-2">
          <p class="text-lg font-bold text-gray-900">
            {isAvailable && unitAmount != null && currency
              ? formatMoney(unitAmount, currency)
              : (
                <span class="text-gray-500 font-normal">
                  Price not available
                </span>
              )}
          </p>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            class="px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
