# GoForMe Runner (web)

Third sibling app alongside `admin frontend` and `customer frontend` — same
Vite/React/Tailwind stack, same `api.js`/`socket.js`/`AuthContext` shape, same
warm-dark theme system (each app has its own base tint; this one is
amber-brown, "on the road at dusk"). Reuses the customer app's `ticket-edge`
CSS signature for the assigned-errand card.

## Setup

```
cd "runner frontend"
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your running backend
npm run dev             # runs on :5175
```

## How the flow actually works (confirmed by reading the real backend)

There is **no browse-and-accept job feed**. `matching.service.js` auto-assigns
the nearest available approved runner the instant a customer creates an
order — so the dashboard shows *the one errand you've been assigned*, not a
list to choose from. The screens map onto that reality:

- **Login** → any account can log in here except admins (mirrors the
  customer app blocking runner/admin accounts, just inverted).
- **Apply** (`/apply`) → shown if you're logged in but have no `Runner`
  profile yet. Submits `POST /runners`. Role stays `"customer"` until an
  admin approves — see the role-flow fix from earlier.
- **Pending** (`/pending`) → shown while `Runner.status` is `pending` or
  `rejected`.
- **Dashboard** (`/`) → shown once `Runner.status === "approved"`.
  Availability toggle (`PATCH /runners/toggle-availability`), the live
  assigned errand (arrives via the `newOrder` socket event to your personal
  room, also fetched via `GET /orders/runner/mine`), Start
  (`PATCH /orders/:id/start`) and Complete (`PATCH /orders/:id/complete`).
- **Payouts** (`/payouts`) → bank verification/save
  (`POST /payouts/verify-account`, `/save-bank`), withdrawal request
  (`POST /payouts/request`, ₦500 minimum), history (`GET /payouts/history`).
- **Profile** (`/profile`) → read-only info + sign out.

## Known gaps this surfaces (not fixed here — flagging for a decision)

- **No decline option.** Once auto-matched, a runner has no way to say
  "can't take this one right now" short of going offline entirely
  mid-errand-search. Worth a `PATCH /orders/:id/decline` that re-runs
  matching against the next-nearest runner, if this becomes a real problem.
- **ID photo / selfie upload** — the apply form collects `id_type` and
  `id_number` only. `Runner.documents` has room for `id_image`/`selfie` but
  there's no image upload endpoint in the API yet (e.g. a signed Cloudinary
  upload route). Marked as a `TODO` in `ApplyAsRunner.jsx`.
- **Growth-feature routes aren't mounted.** `routes/ratingRoutes.js`,
  `promoRoutes.js`, and `referralRoutes.js` all exist in `backend/routes/`
  but `server.js` never `app.use()`s them — so `GET /ratings/user/:id` (used
  nowhere in this app, but relevant if the customer/admin apps ever surface
  ratings) currently 404s. Worth wiring in `server.js`.