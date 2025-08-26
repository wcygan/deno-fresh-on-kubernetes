// frontend/lib/stripe.ts
import "jsr:@std/dotenv/load";
import Stripe from "stripe";
import NodeCache from "node-cache";
import { z } from "zod";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

// Initialize Stripe SDK with Deno-compatible configuration
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  // Use native fetch for Deno compatibility
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize cache with 60-second TTL
const cache = new NodeCache({
  stdTTL: 60, // 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance, we control the data
});

/** Zod schemas for validation **/
const PriceSchema = z.object({
  id: z.string(),
  unit_amount: z.number().int().nullable(),
  currency: z.string(),
});

const ProductRawSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  // With expand we usually get an object; still allow string/null to be robust
  default_price: z.union([PriceSchema, z.string()]).nullable().optional(),
});

// Normalize default_price: string/null → undefined; keep object as-is
const ProductSchema = ProductRawSchema.transform((p) => ({
  id: p.id,
  name: p.name,
  description: p.description ?? null,
  images: p.images ?? [],
  default_price: typeof p.default_price === "string" || p.default_price == null
    ? undefined
    : p.default_price,
}));

export type Price = z.infer<typeof PriceSchema>;
export type Product = z.infer<typeof ProductSchema>;

/** Public API **/
export async function listProducts(limit = 24): Promise<Product[]> {
  const cacheKey = `products_${limit}`;

  // Try to get from cache first
  const cachedProducts = cache.get<Product[]>(cacheKey);
  if (cachedProducts) {
    return cachedProducts;
  }

  // Cache miss - fetch from Stripe
  const response = await stripe.products.list({
    active: true,
    limit,
    expand: ["data.default_price"],
  });

  // Validate and normalize the response with Zod
  const products = response.data.map((product) => {
    const validated = ProductRawSchema.parse(product);
    return ProductSchema.parse(validated);
  });

  // Store in cache for next time
  cache.set(cacheKey, products);

  return products;
}

/** Cache management functions **/
export function clearProductsCache(): void {
  cache.flushAll();
}

export function getCacheStats() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
  };
}

export function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
