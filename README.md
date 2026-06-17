# Ascent — IITM BS Progress Tracker

Track and share your lecture-by-lecture progress through the IITM BS Data
Science & Applications program. Pick a stage (Qualifier, Foundation,
Diploma, Degree), pick a course inside it, and set which lecture you're on.
Other people can follow you and see your route up the mountain — or not,
depending on the visibility you choose.

Stack: React (Vite) on the frontend, Node/Express + MongoDB on the
backend, JWT for sessions, bcrypt for passwords, and real email OTP
(via SendGrid's email API) as a second factor on both signup and login.

## How the pieces fit together

- **Curriculum is a preset, not user input.** `backend/data/curriculum.js`
  defines every stage → course → lecture count. Students never type a
  course name; they just move a slider through this fixed tree. **Update
  this file** to match your batch's actual handbook before going live —
  the structure here is a reasonable starting template, not the official
  list, and course names/lecture counts get revised most cohorts.
- **Login is username + password + OTP**, every time. Step 1
  (`POST /auth/login`) checks the password and emails a 6-digit code.
  Step 2 (`POST /auth/verify-login-otp`) checks that code and issues the
  JWT. Registration follows the same two-step shape, just verifying the
  email address instead.
- **Visibility is per-user**, not global. Each account is either
  `public` (anyone can see their progress) or `followers` (only accounts
  that follow them can see it — the standard "private account" model).
  This is set in Settings and enforced server-side in
  `userController.canView()`, so it can't be bypassed by calling the API
  directly.

## Project layout

```
backend/      Express API, MongoDB models, OTP/email logic
frontend/     React app (Vite), the "Ascent" trail UI
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

- **MONGO_URI** — A MongoDB Atlas connection string works well for a
  free tier: create a cluster at mongodb.com/atlas, add a database user,
  allow your IP (or `0.0.0.0/0` for quick testing), and copy the
  connection string into `.env`. A local `mongod` works too if you have
  one running.
- **JWT_SECRET** — any long random string. You can generate one with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- **SENDGRID_API_KEY / EMAIL_FROM** — real credentials for sending the
  OTP emails, via SendGrid's HTTP API rather than raw SMTP.
  **Why not just SMTP + Gmail?** Many free hosting tiers — Render's free
  web services, since September 2025 — block all outbound traffic on
  SMTP ports 25/465/587. If you deploy there with SMTP, every OTP send
  times out (`ETIMEDOUT`) even though your credentials are fine; the
  platform is dropping the connection, not your code. SendGrid's API
  runs over normal HTTPS, so it isn't affected by that block — and it
  works the same locally too.

  Setup, no domain required:
  1. Sign up at sendgrid.com.
  2. **Settings → Sender Authentication → Single Sender Verification.**
     Verify one email address you control — your own Gmail works fine.
     You'll get a confirmation email; click the link.
  3. **Settings → API Keys** → create one with "Mail Send" permission.
  4. `SENDGRID_API_KEY` = that key. `EMAIL_FROM` = the exact address you
     verified in step 2 (it has to match exactly, or sends get rejected).

  Free tier covers 100 emails/day, which is plenty for a class-sized
  cohort. If you outgrow it or want better deliverability later, the
  next step is Domain Authentication (verifying a domain you own with
  SPF/DKIM records) instead of Single Sender Verification.

Run it:

```bash
npm run dev       # nodemon, auto-restarts on changes
# or
npm start
```

The API listens on `http://localhost:5000` by default (`/api/health`
should return `{ "status": "ok" }`).

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`VITE_API_URL` should point at your backend (`http://localhost:5000/api`
for local dev). Then:

```bash
npm run dev
```

Visit `http://localhost:5173`.

## 3. Trying it out end to end

1. Register a username, email, password. Check that inbox for the OTP
   email (it'll look like the brand's dark/ember theme) and enter the
   code — you're logged in immediately after.
2. On **My climb**, open a stage and use the +/− steppers to set your
   current lecture in a course. It saves on every click.
3. In **Settings**, flip your visibility between "everyone" and
   "followers only" and confirm the effect by viewing your own profile
   from a second test account.
4. Use **Find people → Discover** to see public accounts, or **Search**
   to follow someone by exact username. Once you follow them, their
   progress shows up in **Feed**.

## API reference (quick)

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | sends OTP to email |
| POST | `/api/auth/verify-registration` | — | `{ email, otp }` → JWT |
| POST | `/api/auth/login` | — | `{ username, password }` → sends OTP |
| POST | `/api/auth/verify-login-otp` | — | `{ username, otp }` → JWT |
| POST | `/api/auth/resend-otp` | — | `{ identifier, purpose }` |
| GET | `/api/curriculum` | — | the preset stage/course tree |
| GET | `/api/progress/me` | ✓ | your own progress |
| PUT | `/api/progress/me` | ✓ | `{ courseId, currentLecture }` |
| GET | `/api/users/me` | ✓ | your own profile |
| PUT | `/api/users/me/visibility` | ✓ | `{ visibility: 'public'|'followers' }` |
| GET | `/api/users/search?q=` | ✓ | username search (min 2 chars) |
| GET | `/api/users/discover` | ✓ | public profiles, most recently active first |
| GET | `/api/users/feed` | ✓ | progress of people you follow |
| GET | `/api/users/:username` | ✓ | a profile, respecting visibility |
| POST | `/api/users/:username/follow` | ✓ | |
| POST | `/api/users/:username/unfollow` | ✓ | |

## Deploying

Nothing here is tied to any one host. A simple combo: backend on
Render/Railway (set the same env vars from `.env.example` in their
dashboard, point `MONGO_URI` at Atlas), frontend on Vercel/Netlify with
`VITE_API_URL` set to your deployed backend's URL, and remember to
update `CLIENT_URL` in the backend's env to your deployed frontend's
origin so CORS allows it.

## Notes on what's intentionally simple

- OTP rate limiting is per-IP via `express-rate-limit` (6 sends / 15 min,
  20 verify attempts / 15 min) — fine for a small cohort, not built for
  abuse at scale.
- There's no password reset flow yet (a logical next step: same OTP
  pattern, gated on email ownership).
- The curriculum file is the single source of truth; there's no admin
  UI to edit it. For a few dozen students, editing the file directly is
  simpler than building a CMS for it.
