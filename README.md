# VividPulse

Neo-noir visual social network. A seeded photo feed, 24-hour stories, DMs, and a cozy neighbors board — built with Next.js 15.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://vividpulse-social.vercel.app)
[![CI](https://github.com/devtechedge/vivid-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/devtechedge/vivid-pulse/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Live Demo

**https://vividpulse-social.vercel.app**

Do **not** use https://vividpulse.vercel.app — that hostname is a different AI-automation product.

> **Status:** The public site is a **demo**. Auth is a signed `vp_session` cookie (not JWT / NextAuth). Posts, stories, and DMs live in **process memory** and reset on cold start. Seeded login: `alex_vivid` / `password123` (or the one-click ports on the login screen).

This is the **only** public repo for the project.

---

## Screenshots

<p align="center">
  <img src="docs/social-preview.png" alt="Vivid Pulse" width="800">
</p>

| Login | Feed |
|-------|------|
| ![Sign in with seeded demo ports](docs/screenshots/01-login.png) | ![Stories tray and photo feed](docs/screenshots/02-feed.png) |

| Neighbors | Discover |
|-----------|----------|
| ![Cozy neighbors hub](docs/screenshots/03-neighbors.png) | ![Discover grid](docs/screenshots/04-discover.jpg) |

![Private chats](docs/screenshots/05-messages.png)

---

## Features

- Seeded creator network with one-click demo login
- Photo feed with carousels, likes, bookmarks, and threaded comments
- 24-hour stories tray and viewer
- Discover search over captions and locations
- Direct messages with polling
- Cozy Neighbors hub — vibes, bulletin notes, strolls, treats
- Session cookie is httpOnly + `SameSite=lax` (`secure` in production)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind 4, Lucide, Motion |
| Data | In-memory store (`lib/db.ts`). SQL shape in `docs/schema.sql` |
| Auth | SHA-256 password hash + signed session cookie |
| Media | Mock `/api/upload` (data URLs). Feed images from picsum.photos |
| Hosting | Vercel |
| CI | GitHub Actions — Vitest, `tsc`, Playwright |

---

## Quick Start

```bash
git clone https://github.com/devtechedge/vivid-pulse.git
cd vivid-pulse
npm install
npm run dev
```

Open **http://localhost:3000** and sign in as `alex_vivid` / `password123`. No environment variables required.

```bash
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

---

## Security

Portfolio demo: public password, committed fallback session secret, in-memory store. Details: **[SECURITY.md](SECURITY.md)**.

---

## License

MIT. See [LICENSE](LICENSE).
