// frontend/lib/stripe.ts
import "jsr:@std/dotenv/load";
import Stripe from "stripe";
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

  return products;
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
