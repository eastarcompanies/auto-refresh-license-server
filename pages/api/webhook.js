import Stripe from "stripe";
import { kv } from "@vercel/kv";
import { getRawBody } from "../../lib/buffer";
import { makeLicenseKey } from "../../lib/license";

export const config = {
  api: { bodyParser: false }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function markSubscriptionInactive(subscriptionId) {
  if (!subscriptionId) return;
  const licenseKey = await kv.get(`sub:${subscriptionId}`);
  if (!licenseKey) return;
  await kv.set(`license:${licenseKey}`, JSON.stringify({ status: "inactive", subscriptionId }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).send("Missing stripe-signature");

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send("Webhook error");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const existing = await kv.get(`session:${session.id}`);
      if (existing) return res.status(200).json({ ok: true });

      const licenseKey = makeLicenseKey("ARP");

      const subscriptionId = session.subscription || null;
      const customerId = session.customer || null;

      await kv.set(`session:${session.id}`, licenseKey);
      await kv.set(
        `license:${licenseKey}`,
        JSON.stringify({
          status: "active",
          createdAt: Date.now(),
          sessionId: session.id,
          customerId,
          subscriptionId
        })
      );

      if (subscriptionId) {
        await kv.set(`sub:${subscriptionId}`, licenseKey);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await markSubscriptionInactive(sub.id);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
