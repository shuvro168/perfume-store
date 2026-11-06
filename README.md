# SCENT ATELIER — multibrand perfume storefront (V3)

React + Vite storefront with cart and optional Supabase-powered product administration. Netlify-ready. **No real checkout or payment processing in this version.** Sample brand, product photos and contact details are placeholders; replace before commercial launch.

## File structure

```
perfume-store/
├── public/placeholder.svg
├── src/
│   ├── main.jsx         # pages, cart, admin dashboard
│   ├── style.css        # responsive design
│   ├── data.js          # demo products
│   └── supabase.js      # optional database connection
├── supabase.sql         # database tables + RLS + image policies
├── netlify.toml         # build + SPA fallback
├── .env.example
├── package.json
└── index.html
```

## Local development

Install Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Without Supabase credentials the storefront shows sample products; `/admin` shows setup instructions. Cart is saved in the browser's localStorage. The demo does **not** persist orders, validate prices server-side, reserve inventory, or accept payments.

## Enable real product management

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase.sql` once on a fresh project. If policies already exist, review them before re-running.
3. In **Authentication → Users**, manually create your admin user. Disable public sign-ups in Supabase Auth settings if you do not need them.
4. Copy the user's UUID, then run this statement in SQL Editor (replace the UUID):
   ```sql
   insert into public.admins (user_id) values ('YOUR_USER_UUID');
   ```
5. In Supabase project settings copy the **Project URL** and **publishable/anon key**. **Never use the service_role/secret key in the frontend.**
6. Copy `.env.example` to `.env.local` and set:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```
7. Restart the dev server. Visit `/admin`, sign in, create a product, upload an image, and mark it **Published**. Product updates are visible on the storefront after reload.

Security: Supabase Row Level Security limits product writes to users whose IDs appear in `admins`. Admin access is enforced by database policy, not just the UI. The public may only read published products. The public image bucket serves uploaded product images; avoid sensitive files. Use unique passwords and MFA where available. Never commit `.env.local`.

## Deploy with GitHub + Netlify

1. Create a new GitHub repository, then push the contents of this folder.
2. In Netlify choose **Add new project → Import an existing project → GitHub**.
3. Select your repository. Build command: `npm run build`; publish directory: `dist` (also defined in `netlify.toml`).
4. If using Supabase, in Netlify **Site configuration → Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
5. Open your Netlify URL and test `/`, `/shop`, `/product/...`, `/cart`, and `/admin`. `netlify.toml` provides SPA route fallback.
6. Connect your own domain in Netlify after testing.

**Note:** Values prefixed with `VITE_` are visible to browser users. The anon/publishable key is designed for this; the service-role key is not.

## Before accepting actual orders

- Implement a server-side checkout (Netlify Functions or a trusted commerce backend) that re-reads prices, inventory and shipping eligibility from the database. Do not trust browser cart prices.
- Add Stripe/PayPal checkout, verified webhooks, order records, inventory handling, refund and failure workflows.
- Confirm your payment provider's merchant eligibility and supported countries.
- Confirm fragrance shipping rules (especially alcohol-based perfumes), import duties, taxes, privacy and return policies for each supported market.
- Replace sample images, demo banner, example email, and sample brand text with assets you have rights to use.
- Consider stock reservation, image deletion, audit logs and rate limiting before scaling.

## Customization

Change branding and page text in `src/main.jsx`, styles in `src/style.css`, demo products in `src/data.js`, and HTML metadata in `index.html`. Product category options are in the admin form in `src/main.jsx`.


## Multibrand catalogue update

The local preview contains 40 candidate product-photo entries (some may duplicate the same fragrance) priced at $49 each. See `CATALOG_REVIEW.csv` and `CATALOG_NOTES.md`. All preview items have zero stock and checkout is disabled. Images are placeholders pending rights-cleared product photography. The `category` database field is currently used as the brand name for fast deployment.


## V3 deployment checklist

- **No payment integration:** the cart is a preview and cannot accept orders.
- All candidate entries are **$49 USD**, with **zero inventory** until confirmed.
- Packaging size is unverified in the candidate catalog; edit `volume` from the admin dashboard after confirming the actual SKU. Do not publish an unverified size as factual.
- Product photography uses a generic placeholder; replace with accurately matched, licensed/authorized images before sale.
- The initial preview entries are local demo data, **not automatically inserted into Supabase**. When Supabase is enabled, add verified products via `/admin` (or separately prepare a reviewed import).
- The site has not been tested on a live Netlify deployment. If the Netlify build fails, share the build log for troubleshooting.
V5.0 checkout branch deployment test
