import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Use your STRIPE_SECRET_KEY from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Get the signature from the header
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing stripe-signature header" 
      });
    }

    // Read the raw body
    const buf = await buffer(req);
    const rawBody = buf.toString('utf8');

    // Get webhook secret from environment
    // IMPORTANT: Get this from Stripe Dashboard → Webhooks → Click your endpoint → Reveal Signing Secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
      return res.status(500).json({ 
        ok: false, 
        error: "Server configuration error" 
      });
    }

    let event;
    
    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      console.error("Signature:", signature);
      console.error("Webhook secret length:", webhookSecret?.length);
      console.error("Raw body preview:", rawBody.substring(0, 200));
      
      return res.status(400).json({ 
        ok: false, 
        error: "bad_signature",
        details: err.message 
      });
    }

    // Handle the event
    console.log(`✅ Webhook received: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        console.log("💰 Payment successful!");
        console.log("Session ID:", session.id);
        console.log("Customer email:", session.customer_details?.email);
        console.log("Amount total:", session.amount_total);
        console.log("Customer ID:", session.customer);
        
        // TODO: Generate license key here
        // Example: call your license generation service
        
        break;
        
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ 
      ok: true,
      received: true 
    });
    
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error",
      message: error.message 
    });
  }
}
