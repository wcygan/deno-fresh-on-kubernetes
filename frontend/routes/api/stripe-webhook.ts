// frontend/routes/api/stripe-webhook.ts
import { define } from "../../utils.ts";
import Stripe from "stripe";

// Environment variables
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required for webhook security");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Read raw request body for webhook signature verification
 */
async function readRawBody(req: Request): Promise<string> {
  return await req.text();
}

/**
 * Handle checkout session completion
 */
function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log(`Checkout session completed: ${session.id}`);

  // TODO: Add your business logic here:
  // - Create order record in database
  // - Send confirmation email
  // - Update inventory
  // - Trigger fulfillment process
  // - Update customer records

  // Example of data available:
  const orderData = {
    sessionId: session.id,
    customerId: session.customer as string | null,
    customerEmail: session.customer_email,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    metadata: session.metadata,
    created: new Date(session.created * 1000),
  };

  console.log("Order data:", orderData);

  // Make this function idempotent - use session.id as unique key
  // to prevent duplicate order creation if webhook is retried
}

/**
 * Handle payment intent success
 */
function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(`Payment intent succeeded: ${paymentIntent.id}`);

  // TODO: Add your business logic here:
  // - Mark payment as captured in your system
  // - Update order status
  // - Trigger post-payment workflows

  const paymentData = {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata,
    created: new Date(paymentIntent.created * 1000),
  };

  console.log("Payment data:", paymentData);
}

/**
 * Handle payment intent failure
 */
function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent failed: ${paymentIntent.id}`);

  // TODO: Add your business logic here:
  // - Log payment failure
  // - Send failure notification
  // - Update order status
  // - Trigger retry logic if appropriate

  const failureData = {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    lastPaymentError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata,
  };

  console.error("Payment failure data:", failureData);
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      // 1. Get webhook signature from headers
      const signature = ctx.req.headers.get("stripe-signature");
      if (!signature) {
        console.error("Missing Stripe signature header");
        return new Response("Missing signature", { status: 400 });
      }

      // 2. Read raw request body
      const rawBody = await readRawBody(ctx.req);

      // 3. Verify webhook signature
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        const errorMessage = `Webhook signature verification failed: ${
          (err as Error).message
        }`;
        console.error(errorMessage);
        return new Response(errorMessage, { status: 400 });
      }

      // 4. Log received event
      console.log(`Received webhook: ${event.type} - ${event.id}`);

      // 5. Handle different event types
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            handleCheckoutSessionCompleted(session);
            break;
          }

          case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            handlePaymentIntentSucceeded(paymentIntent);
            break;
          }

          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            handlePaymentIntentFailed(paymentIntent);
            break;
          }

          case "customer.created":
          case "customer.updated": {
            const customer = event.data.object as Stripe.Customer;
            console.log(`Customer ${event.type}: ${customer.id}`);
            // TODO: Sync customer data if needed
            break;
          }

          default: {
            console.log(`Unhandled webhook event type: ${event.type}`);
            // Return success even for unhandled events to prevent retries
            break;
          }
        }

        // 6. Return success response
        return new Response("Webhook handled successfully", { status: 200 });
      } catch (handlerError) {
        console.error(`Error handling webhook ${event.type}:`, handlerError);

        // Return 500 to trigger Stripe's retry mechanism
        return new Response("Webhook handler error", { status: 500 });
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response("Webhook processing failed", { status: 500 });
    }
  },
});
