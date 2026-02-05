// pages/api/webhook.js
import Stripe from "stripe";
import { redis } from "../../lib/redis";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function generateLicenseKey() {
  return `AR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({
        ok: false,
        error: "Missing stripe-signature header",
      });
    }

    const buf = await buffer(req);
    const rawBody = buf.toString("utf8");

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return res.status(500).json({
        ok: false,
        error: "Server configuration error",
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({
        ok: false,
        error: "bad_signature",
        details: err.message,
      });
    }

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const sessionId = session.id;
        const email = session.customer_details?.email || "unknown@email";
        const customerId = session.customer || null;
        const amountTotal = session.amount_total ?? null;
        const currency = session.currency ?? null;

        const licenseKey = generateLicenseKey();

        await redis.set(
          `license:${sessionId}`,
          {
            sessionId,
            email,
            customerId,
            amountTotal,
            currency,
            licenseKey,
            createdAt: Date.now(),
          },
          { ex: 60 * 60 * 24 * 30 } // 30 days
        );

        console.log("License stored for session:", sessionId, licenseKey);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(
          `payment_intent.succeeded amount=${paymentIntent.amount} currency=${paymentIntent.currency}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      message: error?.message || "Unknown error",
    });
  }
}
