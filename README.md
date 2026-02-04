Auto Refresh Pro - Automatic License Server (Vercel)

What this does
- Generates a license key automatically after Stripe payment
- Stores the license in Vercel KV
- Lets your Chrome extension verify the license

Routes
- POST /api/webhook
- GET  /api/license?session_id=CHECKOUT_SESSION_ID
- POST /api/verify-license

Setup on Vercel
1) Create a new Vercel project from this folder
2) In Vercel: Storage -> Create -> KV
3) In Vercel: Settings -> Environment Variables
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - NEXT_PUBLIC_APP_NAME (optional)
4) Deploy

Stripe webhook
1) Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
2) Endpoint URL:
   https://YOUR-VERCEL-DOMAIN/api/webhook
3) Events:
   - checkout.session.completed
   - customer.subscription.deleted (optional)
4) Copy the Signing secret into STRIPE_WEBHOOK_SECRET

Stripe payment link success URL
Set your payment link success URL to:
https://YOUR-VERCEL-DOMAIN/success?session_id={CHECKOUT_SESSION_ID}

Then after the user pays:
- Stripe redirects to /success
- /success fetches the license by session_id
- user copies license into the extension

Extension endpoints
- Verify: https://YOUR-VERCEL-DOMAIN/api/verify-license
