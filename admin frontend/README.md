# GoForMe Admin Console

Internal ops dashboard for the GoForMe errand platform — React + Vite + Tailwind v4, built directly against the `GoForMe-API` routes/controllers/models.

## What's included

| Page | Backend routes used |
|---|---|
| Login | `POST /auth/login` (blocks non-`admin` roles) |
| Overview | `GET /admin/orders`, `GET /admin/users`, `GET /runners`, `GET /admin/disputes`, `GET /admin/payouts` |
| Users | `GET /admin/users` |
| Orders | `GET /admin/orders`, `PATCH /admin/orders/:id/override` |
| Runners | `GET /runners`, `PATCH /admin/runners/:id/approve`, `PATCH /admin/runners/:id/reject` |
| Payouts | `GET /admin/payouts` (status filter + pagination) |
| Disputes | `GET /admin/disputes` (status filter + pagination), `PATCH /admin/disputes/:id/resolve`, `PATCH /admin/disputes/:id/status` |

Auth: JWT access token stored in `localStorage`, attached via an axios request interceptor. On a `401`, the response interceptor calls `POST /auth/refresh-token` once and retries; if that also fails it clears tokens and redirects to `/login`.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your deployed API
npm run dev
```

`VITE_API_BASE_URL` must include the `/api/v1` prefix, e.g. `https://goforme-api.up.railway.app/api/v1`.

## Requirements on the API side

- **CORS is now locked down** in `server.js` via an `ALLOWED_ORIGINS` env var (comma-separated). Make sure this dashboard's deployed URL is in that list, or requests will be blocked.
- **Promoting a user to admin**: there's still no signup path that creates an `admin`-role account directly (intentionally — you don't want a public endpoint that lets anyone mint themselves an admin). Register normally, verify the OTP, then run `npm run make-admin -- you@example.com` from the `GoForMe-API` folder — this runs `scripts/makeAdmin.js`, which connects directly to MongoDB and flips that one user's `role` to `"admin"`.

## Build & deploy

```bash
npm run build   # outputs to dist/
```

`dist/` is a static bundle — deploy to Vercel/Netlify same as the customer web app. Set `VITE_API_BASE_URL` as an environment variable in the hosting provider's dashboard (Vite only reads `VITE_*` vars at build time).

## Design notes

Dark dispatch-console aesthetic (`#121319` base, warm amber `#E88A3C` accent tying back to the GoForMe brand) with a live-updating ticker on the Overview page showing the most recent order status changes — a nod to the platform's real-time Socket.IO order tracking. Space Grotesk for display type, Inter for body copy, JetBrains Mono for IDs/references/currency figures.
