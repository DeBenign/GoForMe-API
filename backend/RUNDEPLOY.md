# Running GoForMe locally and deploying it live

This covers every step from a clean checkout to a working local setup, then
to a live deployment on Railway (backend) + Vercel (the three frontends).
Written against the current repo state — all four `package.json`s were
just fixed/verified as part of this pass (see the bug list at the bottom).

---

## 0. What you need before starting

| Tool | Why | Get it |
|---|---|---|
| Node.js 20+ | Runs backend + builds frontends | nodejs.org |
| A MongoDB database | Primary datastore | MongoDB Atlas free tier, or local `mongod` |
| A Redis instance | Background job queue (BullMQ) — SMS re-engagement, etc. | Local `redis-server`, or Railway's Redis template, or Upstash free tier |
| Paystack account (test mode is fine) | Wallet funding + payouts | paystack.com — grab the **test** secret key from Settings → API Keys |
| Cloudinary account (free tier) | Runner ID/selfie photo uploads | cloudinary.com — Dashboard shows cloud name/key/secret |
| Twilio account (optional for local dev) | SMS OTP | twilio.com — only needed if you're testing OTP for real; otherwise leave blank and OTP will fail gracefully in dev (see note below) |
| An SMTP sender (optional for local dev) | Transactional email | Gmail App Password, Mailtrap, or any SMTP provider |

You do **not** need Twilio/Cloudinary/SMTP filled in just to get the app running and click through most flows — only specific features (OTP verification, runner ID upload, email notifications) will error until those are set.

---

## 1. Run it locally

### 1.1 Clone and install

```bash
git clone https://github.com/DeBenign/GoForMe-API.git
cd GoForMe-API

# backend
cd backend && npm install && cd ..

# three frontends
cd admin_frontend && npm install && cd ..
cd customer_frontend && npm install && cd ..
cd runner_frontend && npm install && cd ..
```

### 1.2 Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

- **`MONGO_URI`** — either `mongodb://localhost:27017/goforme` for a local Mongo, or your Atlas connection string (`mongodb+srv://...`).
- **`JWT_SECRET`** — any long random string. Generate one with `openssl rand -hex 32`.
- **`PAYSTACK_SECRET`** — your Paystack **test** secret key (`sk_test_...`).
- **`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`** — from your Cloudinary dashboard home page.
- **`TWILIO_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE` / `TWILIO_FROM_NUMBER`** — from your Twilio console, if testing OTP for real.
- **`EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS`** — your SMTP sender.
- **`REDIS_HOST` / `REDIS_PORT`** — `127.0.0.1` / `6379` for a local Redis.
- **`ALLOWED_ORIGINS`** — leave as the default for local dev (`http://localhost:5173,http://localhost:5174,http://localhost:5175`); you'll change this for production.
- **`COMMISSION_RATE`** — leave at `0.15` (15%) unless you want a different platform cut.

### 1.3 Start Redis and Mongo (if running locally rather than via cloud services)

```bash
# separate terminals, or run as background services
redis-server
mongod --dbpath /some/local/path
```

### 1.4 Bootstrap the first admin account

You need at least one admin before you can use the admin dashboard (self-registration always creates customers; promotion to admin/runner is admin-only or approval-gated):

```bash
cd backend
npm run make-admin -- "Your Name" you@example.com 08012345678 "StrongPassword123"
```

This creates the user directly in Mongo with `role: admin`. Re-running it with the same email just promotes that existing account — safe to repeat.

### 1.5 Start the backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: <host>
Server running on port 5000
```
Visit `http://localhost:5000/` — you should get `{"status":"GoForMe API Running"}`.

If you need the background notification worker (SMS re-engagement, queued emails) running too, open a second terminal:
```bash
cd backend
npm run worker
```
This is optional for basic local testing — most flows work without it. It'll just log Redis connection errors if Redis isn't reachable and otherwise sit idle.

### 1.6 Configure and start the three frontends

Each needs its own `.env`:

```bash
cd admin_frontend    && cp .env.example .env && cd ..
cd customer_frontend && cp .env.example .env && cd ..
cd runner_frontend   && cp .env.example .env && cd ..
```

The default in each (`VITE_API_BASE_URL=http://localhost:5000/api/v1`) is already correct for local dev — no edits needed unless your backend runs on a different port.

Start all three (separate terminals):
```bash
cd admin_frontend    && npm run dev   # → http://localhost:5173
cd customer_frontend && npm run dev   # → http://localhost:5174
cd runner_frontend   && npm run dev   # → http://localhost:5175
```

### 1.7 Smoke-test the flow

1. Open the **admin app** (5173), log in with the account you bootstrapped in 1.4.
2. Open the **customer app** (5174), register a new account, verify OTP (if Twilio isn't set up, check the backend console log — OTPs are typically logged in dev even if the SMS send fails).
3. Fund the customer's wallet (via the Wallet page → Paystack test card flow, or manually top up the Wallet document in Mongo for quick testing).
4. Apply as a runner from the **runner app** (5175) with a second account, then approve it from the admin app.
5. Post an errand as the customer — it should auto-match to the approved, available runner.
6. Open both the customer and runner apps side by side and use the in-order chat — messages should appear on both instantly.

If everything above works, your local environment is solid.

---

## 2. Deploy it live (Railway + Vercel)

### 2.1 Backend → Railway

1. Push this repo to your own GitHub (if you haven't already) so Railway can pull from it.
2. In Railway: **New Project → Deploy from GitHub repo**, pick this repo, and set the **root directory** to `backend/` (Railway supports monorepos this way).
3. Add a **Redis** service to the same project: **New → Database → Add Redis**. Railway wires up `REDIS_URL`-style vars automatically, but this codebase reads `REDIS_HOST`/`REDIS_PORT` separately — copy the host/port from Railway's Redis service variables tab into your backend service's variables.
4. In the backend service's **Variables** tab, set everything from `.env.example`:
   - `MONGO_URI` — either add a Railway MongoDB plugin, or (recommended) use MongoDB Atlas and paste its connection string here. If using Atlas, add `0.0.0.0/0` to Atlas's Network Access list (Railway's outbound IP isn't static) — for a real production system, tighten this later with Atlas's PrivateLink/VPC peering instead of leaving it open.
   - `JWT_SECRET`, `PAYSTACK_SECRET`, `CLOUDINARY_*`, `TWILIO_*`, `EMAIL_*` — your real/live credentials.
   - `COMMISSION_RATE` — your live rate.
   - `PORT` — Railway sets this automatically; you can leave your own unset or matching.
   - `ALLOWED_ORIGINS` — leave this for now; you'll come back and set it once you know your Vercel URLs (step 2.2).
5. Deploy. Railway will run `npm install` then `npm start` (`node server.js`) automatically from the root directory you set.
6. Once deployed, Railway gives you a public domain like `https://goforme-api-production.up.railway.app`. Test it: visiting that URL should return the same `{"status":"GoForMe API Running"}` JSON.
7. (Optional but recommended) Add a second Railway service pointed at the same repo/root directory, but override its **start command** to `npm run worker` — this runs the background notification worker as its own always-on process, sharing the same env vars and Redis instance.

### 2.2 Frontends → Vercel (three separate projects)

Repeat this for each of `admin_frontend`, `customer_frontend`, `runner_frontend`:

1. Vercel → **Add New Project** → import this GitHub repo.
2. Set **Root Directory** to the specific frontend folder (e.g. `admin_frontend`).
3. Framework preset should auto-detect as **Vite**. Build command `npm run build`, output directory `dist` (Vercel usually fills these in automatically for Vite).
4. Add one environment variable: `VITE_API_BASE_URL` = your Railway backend URL + `/api/v1`, e.g. `https://goforme-api-production.up.railway.app/api/v1`.
5. Deploy. Repeat for the other two folders as separate Vercel projects (each gets its own URL, e.g. `goforme-admin.vercel.app`, `goforme-customer.vercel.app`, `goforme-runner.vercel.app`).

### 2.3 Close the loop — update CORS on the backend

Now that you have three real Vercel URLs, go back to the Railway backend service's variables and set:

```
ALLOWED_ORIGINS=https://goforme-admin.vercel.app,https://goforme-customer.vercel.app,https://goforme-runner.vercel.app
```

Redeploy the backend (Railway redeploys automatically on variable changes, or trigger manually). This list is used for **both** the REST API's CORS check and the Socket.IO server's CORS check — both read the same variable, so you only set it once.

### 2.4 Bootstrap the live admin account

Same command as local, just run it against your live database — either by running the script locally with `MONGO_URI` temporarily pointed at your Atlas connection string, or via Railway's one-off shell (`railway run npm run make-admin -- "..." ...` from the `backend/` directory).

### 2.5 Live smoke test

Same checklist as section 1.7, but against your real Vercel URLs. Pay particular attention to:
- Chat (Socket.IO) actually connecting — open browser dev tools → Network → WS and confirm a websocket connection to your Railway domain succeeds rather than erroring out (a CORS or `ALLOWED_ORIGINS` mismatch shows up here first).
- Wallet funding via Paystack — test-mode Paystack cards work the same in production config as they do locally, so you can validate this without real money.

---

## 3. Common errors and what they mean

| Symptom | Likely cause | Fix |
|---|---|---|
| Frontend shows a CORS error in the console | `ALLOWED_ORIGINS` on the backend doesn't include that frontend's exact origin (scheme + host, no trailing slash) | Update `ALLOWED_ORIGINS` on Railway, redeploy |
| Chat doesn't connect / no messages appear | Same as above, but for the Socket.IO CORS check | Same fix — both REST and socket CORS share the one variable |
| `MongooseServerSelectionError` on boot | Atlas Network Access doesn't allow Railway's IP, or `MONGO_URI` is wrong | Add `0.0.0.0/0` to Atlas Network Access (or your specific egress IPs), double check the connection string's password is URL-encoded if it has special characters |
| `npm run make-admin` fails with "Cannot find module" | You're on an old clone from before this pass — the script existed as `createFirstAdmin.js` but `package.json` pointed at a non-existent `makeAdmin.js` | Already fixed in this repo; make sure you're using the updated `package.json` |
| Worker crashes / logs Redis connection errors repeatedly | No Redis reachable, or `REDIS_HOST`/`REDIS_PORT` unset | Point at a real Redis (local, Railway plugin, or Upstash); the worker isn't required for the core app to function, only for queued notifications |
| OTP never arrives | Twilio not configured | Check the backend console — OTPs are logged there in dev; for live SMS you need real Twilio credentials |
| Runner app can't log in at all, no error shown | Browser has a stale token from a different GoForMe app sharing the same domain's `localStorage` in local dev | Each app uses distinct `localStorage` keys (`gfm_access_token` vs `gfm_runner_access_token`, etc.) so this shouldn't happen across the three apps — but clearing site data resolves any leftover confusion |

---

## 4. Bugs fixed as part of getting this guide right

While writing and verifying these steps, a few things that would have broken a fresh local setup were found and fixed:

- `backend/package.json`'s `make-admin` script pointed at `scripts/makeAdmin.js`, which didn't exist — the real file is `scripts/createFirstAdmin.js`. Fixed.
- `bullmq` and `ioredis` were `require`d by `jobs/worker.js` but never listed in `backend/package.json` dependencies — `npm install` wouldn't have installed them, so the worker would crash on start. Added both as dependencies, and added a `npm run worker` script (there wasn't one).
- `config/socket.js`'s default CORS origin list (used when `ALLOWED_ORIGINS` isn't set) was missing port `5175` — the runner app's local dev port — even though the REST API's default list already included it. In local dev with no `.env` override, this meant the runner app's chat would silently fail to connect while the REST API worked fine. Fixed to match.
- `runner_frontend/.env.example` didn't exist (admin and customer both had one). Added.
- `backend/.env.example` itself didn't exist in the checked-out repo — recreated with every variable actually referenced in the codebase.