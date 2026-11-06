# SCENT ATELIER V5.0 checkout preview

Changes: adds `/checkout` route, connects shopping bag checkout button, adds responsive customer contact/shipping form and order summary. Existing V4.4 import/admin/catalog code is preserved.

**IMPORTANT:** This is a UI-only preview. No shipping data is transmitted or persisted, no payment is processed, and no order is created. Do not advertise this as a working payment checkout.

Next steps: implement server-side validated order draft with Supabase Edge Functions, restricted orders/order_items tables with RLS, tax/shipping calculation, Stripe hosted Checkout session, signed webhook fulfillment and idempotency, inventory reservations, and confirmation emails. Never trust client prices or mark orders paid based on a browser redirect.

To test: npm install && npm run dev. Navigate to /cart with an in-stock item and click Secure checkout.
