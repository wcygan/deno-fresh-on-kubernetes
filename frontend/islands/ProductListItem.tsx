// frontend/islands/ProductListItem.tsx
import type { CartItemDisplay } from "../lib/schemas.ts";
import { addToCart } from "../lib/cart-state.ts";
import { formatMoney } from "../lib/money.ts";
import { Button } from "../components/Button.tsx";

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
    <div class="card hover:[box-shadow:var(--shadow-card-hover)] transition-shadow">
      <div class="card-body">
        <div class="aspect-square mb-4 overflow-hidden rounded-xl bg-neutral-100">
          <img
            src={images?.[0] ?? "/logo.svg"}
            alt={name}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="space-y-3">
          <h2 class="text-xl font-semibold text-neutral-900 leading-tight">
            {name}
          </h2>
          {description && (
            <p class="text-neutral-600 text-sm line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
          <div class="flex items-center justify-between pt-2">
            <p class="text-lg font-bold text-neutral-900">
              {isAvailable && unitAmount != null && currency
                ? formatMoney(unitAmount, currency)
                : (
                  <span class="text-neutral-500 font-normal">
                    Price not available
                  </span>
                )}
            </p>
            <Button
              type="button"
              disabled={!isAvailable}
              onClick={handleAddToCart}
              variant="primary"
              size="md"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
