// frontend/routes/api/checkout.ts
import { define } from "../../utils.ts";
import {
  CheckoutCreateRequest,
  CheckoutCreateResponse,
} from "../../lib/schemas.ts";
import { getStripe } from "../../lib/stripe.ts";
import { RateLimiter } from "../../lib/rate-limiter.ts";

const limiter = new RateLimiter(1, 1500); // 1 request / 1.5s

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      ""
  );
}

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
      const ip = getClientIp(ctx.req);
      if (ip && !limiter.isAllowed(ip)) {
        const retryAfter = Math.ceil(
          (limiter.getResetTime(ip) - Date.now()) / 1000,
        );
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(Math.max(1, retryAfter)),
          },
        });
      }

      const stripe = getStripe();
      // 1. Parse and validate request payload
      const payload = await parseJson<unknown>(ctx.req);
      const parseResult = CheckoutCreateRequest.safeParse(payload);

      const dev = Deno.env.get("NODE_ENV") !== "production";
      if (!parseResult.success) {
        return Response.json(
          dev
            ? { error: "Invalid request", details: parseResult.error.flatten() }
            : { error: "Invalid request" },
          { status: 400 },
        );
      }

      const { items, customerEmail, metadata } = parseResult.data;

      // 2. Verify all price IDs exist and are active
      const uniquePriceIds = Array.from(
        new Set(items.map((item) => item.priceId)),
      );
      const priceMap = new Map<string, unknown>();

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
          ctx.state.logger?.error(
            `Failed to retrieve price ${priceId}:`,
            error,
          );
          return Response.json(
            { error: `Invalid price ID: ${priceId}` },
            { status: 400 },
          );
        }
      }

      // 3. Verify price-product alignment (optional integrity check)
      for (const item of items) {
        const price = priceMap.get(item.priceId)!;
        const product = (price as { product?: { id?: string } }).product;

        if (product?.id && item.productId !== product.id) {
          return Response.json({
            error:
              `Price ${item.priceId} does not match product ${item.productId}`,
          }, { status: 400 });
        }
      }

      // 4. Build checkout line items from verified prices
      const lineItems = items
        .map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
          adjustable_quantity: { enabled: false },
        }));

      // 5. Generate idempotency key to prevent duplicate sessions
      // Include requestId and timestamp to ensure each checkout attempt is unique
      const idempotencyKey = await sha256Hash({
        items,
        customerEmail,
        requestId: ctx.state.requestId,
        timestamp: Date.now(),
      });

      // 6. Create Stripe Checkout Session
      const origin = new URL(ctx.req.url).origin;
      const successUrl =
        `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/`;

      const sessionParams = {
        mode: "payment" as const,
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...(metadata ?? {}),
          request_id: ctx.state.requestId,
          cart_hash: await sha256Hash(items),
        },
        ...(customerEmail && { customer_email: customerEmail }),
      };

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
      ctx.state.logger?.error("Checkout API error:", error);

      return Response.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
});
