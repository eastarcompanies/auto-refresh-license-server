import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // required for Stripe signature verification
  },
};

const stripe = new Stripe(process.env.whsec_opDbod7eI1vLTCAlftPhGbdNmv5uBRND, {
  apiVersion: "2023-08-16",
});

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.whsec_opDbod7eI1vLTCAlftPhGbdNmv5uBRND
    );
  } catch (err) {
    console.log("Webhook signature verification failed:", err.message);
    return res.status(400).json({ ok: false, error: "bad_signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // This is where you generate/save a license
      console.log("PAYMENT OK session:", session.id);
      console.log("EMAIL:", session.customer_details?.email);

      // optional: call your license creator endpoint here
      // or directly generate a key and store it somewhere
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.log("Webhook handler error:", err.message);
    return res.status(500).json({ ok: false });
  }
}
