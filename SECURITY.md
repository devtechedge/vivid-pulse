# Security Assessment — VividPulse

**Date:** 2026-08-24  
**Scope:** Auth, XSS, injection, cookies, secrets, dependency risk, persistence  
**Context:** Public deploy is a **portfolio demo**. Feed, stories, DMs, and neighbors live in **process memory** (`globalThis`). They reset on cold start. There is no production Postgres on Vercel.

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | **Accepted residual** | SHA-256 + static salt. Not bcrypt / Argon2. Demo password `password123` is public |
| Session | **Accepted residual** | SHA-256 MAC over `userId:expiry`, not JWT. Fallback secret is committed |
| Authorization | **Low on demo** | Server actions check `vp_session`. DMs are scoped to the current user |
| XSS | **Low** | React text nodes. Uploads stored as data URLs, rendered as `img src` |
| Injection (SQL) | **N/A on public path** | No live SQL. Schema lives in `docs/schema.sql` only |
| Secrets in repo | **Demo secret only** | `FALLBACK_SESSION_SECRET` / password salt are documented below |
| Dependency CVEs | **Low** | Unused Gemini / Blob / Postgres / firebase-tools / hookform removed |
| Build config | **Hardened** | `ignoreBuildErrors` is **false** |

**Overall (public demo):** Medium residual risk by design — signed cookies, but a public password and an in-memory store. Do not treat this as a production social network.

---

## 1. Authentication & session

**Findings**
- Passwords are SHA-256(`password` + `vividpulse_salt_2026`). This is **not** a slow KDF.
- Sessions are `userId:expiry:sha256(userId:expiry + secret)` in an httpOnly `vp_session` cookie.
- Signature compare is a length-checked XOR loop (isomorphic; `db.ts` is imported from client components).
- Cookie flags: `httpOnly`, `sameSite=lax`, `secure` only in production. The previous `sameSite=none; secure` pair was an AI Studio iframe leftover and broke localhost.
- Seeded accounts (accepted residual risk for the public demo):

  | Username | Password |
  |----------|----------|
  | `alex_vivid` | `password123` |
  | `elena_pixels` | `password123` |
  | `cyber_pulse` / `neon_lens` / `kinetic_art` | `password123` |

**Not claimed:** NextAuth, JWT, OAuth, bcrypt.

**If this is taken to production:** replace hashing with Argon2/bcrypt, move `SESSION_SECRET` to env only (no fallback), persist users in Postgres (`docs/schema.sql`), and rotate the demo password.

---

## 2. XSS

**Findings**
- Captions, bios, comments, and DMs render as React text.
- `/api/upload` returns a `data:` URL for images under 5 MB. Those URLs are used as `img src` / background, not as HTML.
- No Markdown renderer, no `dangerouslySetInnerHTML` in app code.

**Residual:** a crafted `data:` URL or remote `picsum.photos` image can still be an tracking pixel. Demo-only.

---

## 3. Authorization on mutations

Server actions call `getCurrentUser()` before create / like / comment / DM / neighbor writes. The chat polling route (`/api/chat/polling`) also goes through `getDirectMessages`, which is session-scoped.

There is **no** CSRF token. `sameSite=lax` is the control. Fine for a first-party demo; not enough for a real social product.

---

## 4. Injection (SQL / command)

Public path never opens Postgres. `@vercel/postgres` was unused template code and has been removed. The SQL in `docs/schema.sql` is documentation of the local production path.

No child processes. No shelling out.

---

## 5. Persistence

`lib/db.ts` keeps state on `globalThis.__vividpulse_db`. On Vercel that means:

- Seed data comes back after every cold start
- Two concurrent serverless instances do not share writes
- Do not store real user content here

---

## 6. Dependency / supply chain

Removed in this pass (never imported by app code):

- `@google/genai`
- `@hookform/resolvers`
- `@vercel/blob`
- `@vercel/postgres`
- `firebase-tools`
- `@tailwindcss/typography`

Runtime is Next 15, React 19, Lucide, Motion, Tailwind utilities.

Do **not** `npm audit fix --force` onto Next 16 to clear Next 15 advisories. Dependabot ignores majors.

---

## 7. Secrets & config hygiene

- `.gitignore` excludes `.env*` (keeps `.env.example`).
- `.env.example` documents optional `POSTGRES_URL` and `SESSION_SECRET`. Neither is required for the demo.
- `GEMINI_API_KEY` was an AI Studio leftover and has been removed.

---

## 8. Residual risk & acceptance

**Accepted for portfolio demo**
- Public password `password123`
- Committed fallback session secret
- SHA-256 password hashing
- In-memory store / no durable backend
- Picsum placeholder images

**Not accepted**
- Claiming NextAuth / JWT / production Postgres
- Re-enabling `ignoreBuildErrors`
- Shipping a real user base on this session scheme

---

## 9. How to re-test

```bash
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

To report a vulnerability, open a GitHub security advisory or an issue. Rotate `SESSION_SECRET` if a production secret is ever introduced.
