# Codes.io — Digital Restaurant Menu SaaS

Create a digital restaurant menu in minutes, generate a permanent QR code, and let
customers view your menu instantly — no app, no login required.

This repository contains two completely separate applications:

```
codes-io/
├── frontend/   React + Vite + TypeScript + Tailwind + shadcn/ui
├── backend/    Node.js + Express + TypeScript + PostgreSQL + Prisma
└── README.md   (this file)
```

The frontend talks to the backend only through REST APIs. No database
credentials or secrets are ever exposed to the frontend.

---

## 1. Architecture

- **Frontend** (`frontend/`) — React 18, Vite, TypeScript, Tailwind CSS,
  React Router, TanStack Query. Talks to the backend via `VITE_API_URL`.
- **Backend** (`backend/`) — Express + TypeScript REST API, PostgreSQL via
  Prisma, Zod validation, JWT auth in httpOnly cookies, Cloudinary for
  images.

Every write request that touches a restaurant, category, or menu item is
re-authorized on the server by looking up the resource's owner from the
database — restaurant IDs sent by the client are **never** trusted directly.

---

## 2. Requirements

- Node.js **18+** (Node 20 recommended)
- A free [Neon](https://neon.tech) PostgreSQL database (cloud-hosted — no local Postgres install needed)
- A free [Cloudinary](https://cloudinary.com) account (for image uploads — optional for local testing of everything except image upload)

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

### Database setup (Neon — no local install needed)

1. Sign up free at https://neon.tech and create a project.
2. Create a database named `codesio` (or use the default one Neon gives you).
3. Copy the **pooled connection string** from the Neon dashboard.

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/codesio?sslmode=require
AUTH_SECRET=replace-with-a-long-random-string
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Run the Prisma migration and generate the client (this creates the tables
directly on your Neon database, nothing local):

```bash
npx prisma migrate dev
```

If you ever change `prisma/schema.prisma`, re-run `npx prisma migrate dev`.

### Seed demo data

```bash
npx prisma db seed
```

This creates:
- Demo login: **demo@codes.io / Demo1234!**
- One demo restaurant ("Demo Diner") with 3 categories and 6 menu items on the Free plan

### Run the backend

```bash
npm run dev
```

The API is now live at `http://localhost:4000/api`. Check `GET /api/health`.

---

## 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_PUBLIC_APP_URL=http://localhost:5173
```

Run it:

```bash
npm run dev
```

Visit `http://localhost:5173`. Log in with the demo account or register a
new one.

---

## 5. Cloudinary setup

1. Create a free account at https://cloudinary.com
2. From the dashboard, copy your **Cloud name**, **API key**, and **API secret**
3. Paste them into `backend/.env`

If Cloudinary is not configured, the backend will return a clear
`503 Cloudinary is not configured...` error on upload attempts instead of
pretending the upload succeeded. Everything else in the app works without it.

---

## 6. Free / Pro plan system

Plan limits are enforced **only** on the backend (`backend/src/services/plans/planLimits.ts`
and `backend/src/middleware/planAccess.ts`), never trusting frontend checks alone:

| | Free | Pro |
|---|---|---|
| Restaurants | 1 | Unlimited |
| Categories per restaurant | 3 | Unlimited |
| Menu items per restaurant | 20 | Unlimited |
| Logo upload | ❌ | ✅ |
| Background wallpaper / banner image | ❌ | ✅ |
| Custom accent color | ❌ | ✅ |
| Custom menu font (Inter / Playfair / Poppins) | ❌ | ✅ |
| Menu layout templates (classic / grid / minimal) | ❌ | ✅ |
| Custom QR color + embedded logo | ❌ | ✅ |
| Remove "Powered by Codes.io" | ❌ | ✅ |
| Menu analytics | ❌ | ✅ |
| Featured items | ❌ | ✅ |
| Bestseller tags | ❌ | ✅ |

Free (always included, on every plan):
- Veg/non-veg, spicy, and allergen tags on menu items
- Item variants (e.g. Half/Full) and add-ons (e.g. extra cheese) with price deltas
- Drag-free reordering of categories and menu items via up/down controls
- Opening hours with a live "Open now" / "Closed" badge on the public menu
- WhatsApp and Instagram links on the public menu

When a Free user hits a limit or tries a Pro feature, the backend responds
with `403` and an `error: "PLAN_LIMIT_REACHED"` or `error: "PRO_FEATURE_LOCKED"`
payload. The frontend catches this and shows the upgrade modal — but a
malicious client calling the API directly is still blocked server-side. If a
Pro subscription lapses, the public menu automatically falls back to default
branding (no banner, default font/layout) rather than continuing to serve
Pro visuals.

**Note on drag-and-drop:** reordering categories and menu items uses simple
up/down move buttons rather than a drag-and-drop library, to avoid adding an
unnecessary dependency. The underlying `sortOrder` field and reorder API
endpoints (`PUT /api/categories/restaurant/:id/reorder`,
`PUT /api/menu-items/category/:id/reorder`) are drag-and-drop-ready if you
want to wire up a library like `@dnd-kit/core` later — just call the same
endpoint with the new order.

---

## 7. Billing architecture

The database (`Subscription` model) is fully billing-ready: plan, status
(`ACTIVE` / `TRIALING` / `CANCELED` / `PAST_DUE` / `INACTIVE`), provider,
customer ID, subscription ID, billing period, and cancellation state are
all modeled.

**No payment provider has been connected.** Per project instructions, Codes.io
was not permitted to activate or subscribe to a real paid payment service
without approval. Instead, `backend/src/controllers/billingController.ts`
implements a clearly separated **mock billing mode**:

- `POST /api/billing/checkout` instantly flips the user to `PRO` /
  `ACTIVE` in the database — no money moves, and the response says so.
- `POST /api/billing/cancel` reverts to `FREE`.
- `POST /api/billing/webhook` is a stub that returns `501 NO_PROVIDER_CONFIGURED`
  until a real provider's signing secret is added.

### Payment provider setup (for a real launch)

1. **Recommended provider:** [Stripe](https://stripe.com) (Checkout + Billing).
2. **Why:** best-documented API, native subscription/webhook support, strong
   India payment method coverage (cards, UPI via Stripe's India-approved
   partners where applicable), and a generous free sandbox.
3. **Transaction fees:** Stripe's standard India pricing is roughly 2% + applicable
   taxes per successful domestic card charge (confirm current rates on
   stripe.com/pricing before launch — these change).
4. **Free/testing availability:** Full test mode with test API keys and test
   cards, free indefinitely for development.
5. **Required credentials:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
   a `STRIPE_WEBHOOK_SECRET` for verifying webhook signatures, and a Price ID
   for the Pro plan.
6. **Required webhooks:** `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`.

To go live: replace `mockCheckout`/`mockCancel`/`webhook` in
`billingController.ts` with real Stripe Checkout Session creation and
signature-verified webhook handling. The `Subscription` schema and all
`planAccess` middleware require no changes.

---

## 8. Production deployment

- **Frontend:** deploy `frontend/` to Vercel/Netlify/Cloudflare Pages. Set
  `VITE_API_URL` and `VITE_PUBLIC_APP_URL` to your production backend/frontend
  domains.
- **Backend:** deploy `backend/` to Railway/Render/Fly.io. Set all env vars
  from `.env.example`, run `npx prisma migrate deploy` on release, and set
  `NODE_ENV=production` (enables secure cookies).
- Use a managed Postgres instance (Supabase, Neon, Railway Postgres, RDS).
- Point your QR-generating domain (`PUBLIC_APP_URL`) at your real production
  frontend URL before printing any QR codes for real restaurants.

---

## 9. Security considerations

- Passwords hashed with bcrypt (cost factor 10).
- JWT stored in an httpOnly, sameSite=lax cookie — not accessible to JS,
  reducing XSS token-theft risk.
- Every restaurant/category/menu-item mutation re-verifies ownership from
  the database using the authenticated user's ID, never a client-supplied
  restaurant ID alone.
- Zod validates all request bodies before they reach business logic.
- Image uploads are restricted by MIME type (JPEG/PNG/WEBP) and size (4MB).
- Secrets (`DATABASE_URL`, `AUTH_SECRET`, Cloudinary secret, billing keys)
  live only in `backend/.env` and are never sent to the frontend.
- Plan/feature gating is enforced server-side; frontend checks are UX only.
- CORS is locked to `FRONTEND_ORIGIN`; `helmet()` sets standard security headers.

---

## 10. End-to-end test checklist

```
Register → Login → Create restaurant → Add category → Add menu item
→ Upload food image → Edit item → Open public menu → Generate QR
→ Open QR → Verify public menu → Change menu price → Open SAME QR URL
→ Verify new price
```

```
Free user → reach menu item limit (20) → attempt another item → upgrade prompt
Free user → click a Pro feature (logo, branding, featured, analytics) → upgrade prompt
Mock-upgrade to Pro → access Pro feature
Cancel subscription → Pro access restricted again
```

Also verify a malicious user cannot bypass limits by calling the backend
API directly with someone else's `restaurantId` — every route checks
ownership before returning data or applying changes.

---

## 11. Scope note

Per the project brief, this build intentionally excludes online ordering,
delivery, reviews, loyalty programs, customer accounts, reservations, POS
integration, AI features, and email/SMS marketing.
