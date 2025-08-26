// frontend/routes/checkout/success.tsx
import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import Stripe from "stripe";
import { CheckoutSuccessQuery } from "../../lib/schemas.ts";
import { formatMoney } from "../../lib/stripe.ts";

// Get Stripe instance
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

interface LineItemDisplay {
  id: string;
  quantity: number;
  name: string;
  unitAmount: number;
  currency: string;
}

export default define.page(async (ctx) => {
  try {
    // 1. Validate query parameters
    const url = new URL(ctx.req.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const parseResult = CheckoutSuccessQuery.safeParse(queryParams);

    if (!parseResult.success) {
      return new Response(
        "Missing or invalid session_id parameter",
        { status: 400 },
      );
    }

    const { session_id } = parseResult.data;

    // 2. Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        "payment_intent",
        "line_items.data.price.product",
      ],
    });

    // 3. Extract payment information
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    const status = session.status ?? (paymentIntent?.status ?? "unknown");
    const totalAmount = session.amount_total ?? paymentIntent?.amount ?? 0;
    const currency = session.currency ?? paymentIntent?.currency ?? "usd";

    // 4. Process line items for display
    const lineItems: LineItemDisplay[] = (session.line_items?.data ?? []).map(
      (lineItem) => {
        const price = lineItem.price!;
        const product = price.product as Stripe.Product;

        return {
          id: lineItem.id,
          quantity: lineItem.quantity ?? 0,
          name: product?.name ?? price.nickname ?? "Unknown Item",
          unitAmount: price.unit_amount ?? 0,
          currency: price.currency ?? currency,
        };
      },
    );

    // 5. Calculate total for verification (for potential future use)
    const _calculatedTotal = lineItems.reduce(
      (sum, item) => sum + (item.unitAmount * item.quantity),
      0,
    );

    return (
      <div class="min-h-screen bg-gray-50 px-4 py-8">
        <Head>
          <title>Order Confirmation - Thank You!</title>
        </Head>

        <div class="mx-auto max-w-3xl">
          {/* Header */}
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                class="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Thank You! 🎉</h1>
            <p class="text-gray-600">
              Your order has been successfully processed.
            </p>
          </div>

          {/* Order Summary Card */}
          <div class="bg-white rounded-2xl border shadow-sm p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Order Summary</h2>

            <div class="space-y-3 mb-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Session ID</span>
                <code class="text-sm bg-gray-100 px-2 py-1 rounded">
                  {session.id}
                </code>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-700">Payment Status</span>
                <span
                  class={`font-semibold capitalize ${
                    status === "succeeded" || status === "complete"
                      ? "text-green-600"
                      : status === "processing" || status === "requires_action"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {status.replace("_", " ")}
                </span>
              </div>

              <div class="flex items-center justify-between border-t pt-3">
                <span class="text-lg font-semibold text-gray-900">Total</span>
                <span class="text-lg font-bold text-gray-900">
                  {formatMoney(totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Items List */}
          {lineItems.length > 0 && (
            <div class="bg-white rounded-2xl border shadow-sm p-6 mb-6">
              <h2 class="text-xl font-semibold mb-4">Items Ordered</h2>

              <ul class="space-y-4">
                {lineItems.map((item) => (
                  <li
                    key={item.id}
                    class="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div class="flex-1">
                      <h3 class="font-medium text-gray-900">{item.name}</h3>
                      <p class="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold text-gray-900">
                        {formatMoney(
                          item.unitAmount * item.quantity,
                          item.currency,
                        )}
                      </p>
                      {item.quantity > 1 && (
                        <p class="text-sm text-gray-500">
                          {formatMoney(item.unitAmount, item.currency)} each
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div class="text-center space-y-4">
            <a
              href="/"
              class="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </a>

            <p class="text-sm text-gray-600">
              You should receive a confirmation email shortly. If you have any
              questions, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading order confirmation:", error);

    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Head>
          <title>Order Confirmation Error</title>
        </Head>

        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Order
          </h1>
          <p class="text-gray-600 mb-6">
            We couldn't retrieve your order details. Please check your
            confirmation email or contact support.
          </p>
          <a
            href="/"
            class="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium"
          >
            Back to Store
          </a>
        </div>
      </div>
    );
  }
});
