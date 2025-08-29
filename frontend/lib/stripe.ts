import "jsr:@std/dotenv/load";
import Stripe from "stripe";
import { z } from "zod";
import { TTLCache } from "./ttl-cache.ts";
import { formatMoney } from "./money.ts";

// ----- Zod schemas (exported so tests don't re-define) -----
export const PriceSchema = z.object({
  id: z.string(),
  unit_amount: z.number().int().nullable(),
  currency: z.string(),
});

export const ProductRawSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  default_price: z.union([PriceSchema, z.string()]).nullable().optional(),
});

// normalize default_price: string/null → undefined; object unchanged
export const ProductSchema = ProductRawSchema.transform((p) => ({
  id: p.id,
  name: p.name,
  description: p.description ?? null,
  images: p.images ?? [],
  default_price: typeof p.default_price === "string" || p.default_price == null
    ? undefined
    : p.default_price,
}));

export type Product = z.infer<typeof ProductSchema>;
export type Price = z.infer<typeof PriceSchema>;

// ----- Stripe client DI -----
export interface StripeLike {
  products: {
    list: (
      args: Stripe.ProductListParams,
    ) => Promise<Stripe.ApiList<Stripe.Product>>;
  };
  prices: {
    retrieve: (
      id: string,
      args?: Stripe.PriceRetrieveParams,
    ) => Promise<Stripe.Response<Stripe.Price>>;
  };
  checkout: {
    sessions: {
      create: (
        p: Stripe.Checkout.SessionCreateParams,
        o?: Stripe.RequestOptions,
      ) => Promise<Stripe.Response<Stripe.Checkout.Session>>;
      retrieve: (
        id: string,
        args?: Stripe.Checkout.SessionRetrieveParams,
      ) => Promise<Stripe.Response<Stripe.Checkout.Session>>;
    };
  };
  webhooks: {
    constructEvent: (
      payload: string | Uint8Array,
      signature: string,
      secret: string,
    ) => Stripe.Event;
  };
}

let _injected: StripeLike | null = null;
export function setStripeForTests(fake: StripeLike | null) {
  _injected = fake;
}

export function getStripe(): StripeLike {
  if (_injected) return _injected;
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  const client = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  return client as unknown as StripeLike;
}

// ----- products list with tiny TTL cache -----
const cache = new TTLCache<Product[]>(60_000); // 60s

export async function listProducts(limit = 24): Promise<Product[]> {
  const k = `products_${limit}`;
  const hit = cache.get(k);
  if (hit) return hit;

  const stripe = getStripe();
  const res = await stripe.products.list({
    active: true,
    limit,
    expand: ["data.default_price"],
  });
  const products = res.data.map((p) =>
    ProductSchema.parse(ProductRawSchema.parse(p))
  );
  cache.set(k, products);
  return products;
}

export function clearProductsCache() {
  cache.clear();
}

export function getCacheStats() {
  return { keys: cache.size() };
}

export { formatMoney };
