// frontend/routes/api/checkout.ts
import { define } from "../../utils.ts";
import Stripe from "stripe";
import {
  CheckoutCreateRequest,
  CheckoutCreateResponse,
} from "../../lib/schemas.ts";

// Get Stripe instance from environment
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Parse JSON body from request with error handling
 */
async function parseJson<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    return {} as T;
  }
}

/**
 * Generate SHA-256 hash for idempotency key
 */
async function sha256Hash(input: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(input));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      // 1. Parse and validate request payload
      const payload = await parseJson<unknown>(ctx.req);
      const parseResult = CheckoutCreateRequest.safeParse(payload);

      if (!parseResult.success) {
        return Response.json(
          { error: "Invalid request", details: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      const { items, customerEmail, metadata } = parseResult.data;

      // 2. Verify all price IDs exist and are active
      const uniquePriceIds = Array.from(
        new Set(items.map((item) => item.priceId)),
      );
      const priceMap = new Map<string, Stripe.Response<Stripe.Price>>();

      for (const priceId of uniquePriceIds) {
        try {
          const price = await stripe.prices.retrieve(priceId, {
            expand: ["product"],
          });

          if (!price.active) {
            return Response.json(
              { error: `Price ${priceId} is not active` },
              { status: 400 },
            );
          }

          priceMap.set(priceId, price);
        } catch (error) {
          console.error(`Failed to retrieve price ${priceId}:`, error);
          return Response.json(
            { error: `Invalid price ID: ${priceId}` },
            { status: 400 },
          );
        }
      }

      // 3. Verify price-product alignment (optional integrity check)
      for (const item of items) {
        const price = priceMap.get(item.priceId)!;
        const product = price.product as Stripe.Product;

        if (product?.id && item.productId !== product.id) {
          return Response.json({
            error:
              `Price ${item.priceId} does not match product ${item.productId}`,
          }, { status: 400 });
        }
      }

      // 4. Build checkout line items from verified prices
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items
        .map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
          adjustable_quantity: { enabled: false },
        }));

      // 5. Generate idempotency key to prevent duplicate sessions
      const idempotencyKey = await sha256Hash({ items, customerEmail });

      // 6. Create Stripe Checkout Session
      const origin = new URL(ctx.req.url).origin;
      const successUrl =
        `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/`;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...(metadata ?? {}),
          cart_hash: await sha256Hash(items),
        },
      };

      // Add customer email if provided
      if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      const session = await stripe.checkout.sessions.create(
        sessionParams,
        { idempotencyKey },
      );

      // 7. Return session details
      const response = CheckoutCreateResponse.parse({
        sessionId: session.id,
        url: session.url!,
      });

      return Response.json(response, { status: 200 });
    } catch (error) {
      console.error("Checkout API error:", error);

      return Response.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
});
