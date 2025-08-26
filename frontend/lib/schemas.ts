// frontend/lib/schemas.ts
import { z } from "zod";

// Stripe ID validators
export const PriceId = z.string().regex(
  /^price_[A-Za-z0-9]+$/,
  "Invalid price ID",
);
export const ProductId = z.string().regex(
  /^prod_[A-Za-z0-9]+$/,
  "Invalid product ID",
);

// Cart item schema
export const CartItemSchema = z.object({
  priceId: PriceId,
  productId: ProductId,
  quantity: z.coerce.number().int().min(1).max(20),
});

// Cart schema
export const CartSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(50),
});

// Checkout request schema
export const CheckoutCreateRequest = CartSchema.extend({
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
}).strict();

export type CheckoutCreateRequest = z.infer<typeof CheckoutCreateRequest>;

// Checkout response schema
export const CheckoutCreateResponse = z.object({
  sessionId: z.string(),
  url: z.string().url(),
}).strict();

// Success page query params
export const CheckoutSuccessQuery = z.object({
  session_id: z.string().min(1),
});

// Enhanced cart item with display data
export const CartItemDisplaySchema = CartItemSchema.extend({
  name: z.string(),
  currency: z.string(),
  unitAmount: z.number().int(),
  image: z.string().url().optional(),
});

export type CartItemDisplay = z.infer<typeof CartItemDisplaySchema>;

// Cart with display data
export const CartDisplaySchema = z.object({
  items: z.array(CartItemDisplaySchema),
});

export type CartDisplay = z.infer<typeof CartDisplaySchema>;
