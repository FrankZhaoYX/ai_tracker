# AI Hot Topic Tracker

A real-time dashboard that monitors AI/ML trending topics across multiple sources, scores them with an LLM, and surfaces the most important signals through a high-tech dark UI.

![Neural Pulse Dashboard](https://img.shields.io/badge/UI-Neural%20Pulse-00f5d4?style=flat-square) ![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Express%205%20%2B%20Prisma-8b5cf6?style=flat-square) ![License](https://img.shields.io/badge/license-ISC-gray?style=flat-square)

---

## What It Does

Every 30 minutes the server scrapes 6 sources, runs each item through an LLM to generate a summary and a **Hot Score** (1–100), then pushes updates to every connected browser in real time via Socket.io. Topics above a configurable threshold trigger an email alert.

```
Sources → Scraper → OpenRouter LLM → SQLite → Socket.io → React Dashboard
```

---

## Data Sources

| Source | Type | Quality Gate |
|---|---|---|
| Hacker News | Firebase API | Score ≥ 50, AI keyword match |
| r/MachineLearning | Reddit JSON | Score ≥ 10, not stickied |
| r/LocalLLaMA | Reddit JSON | Score ≥ 5, not stickied |
| arXiv | XML API | Categories: cs.AI, cs.LG, cs.CL, cs.CV |
| HuggingFace Daily Papers | JSON API | Sorted by upvotes |
| Twitter/X | twitterapi.io | Verified account, ≥10k followers, ≥1k likes, ≥500 retweets, ≥5k views |

Twitter is optional — the app runs fully without a Twitter API key.

---

## Tech Stack

### Backend (`server/`)
- **Runtime:** Node.js + TypeScript (ESM / NodeNext)
- **Framework:** Express 5
- **Database:** SQLite via Prisma 6
- **Real-time:** Socket.io 4
- **Scheduling:** node-cron (default: every 30 minutes)
- **Scraping:** Axios + Cheerio
- **AI:** OpenRouter (`meta-llama/llama-3.3-70b-instruct:free` — free tier)
- **Email:** Nodemailer (optional SMTP)
- **Tests:** Vitest 4

### Frontend (`client/`)
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS 4 + custom `@theme` tokens
- **Animations:** Framer Motion 12
- **UI Components:** Aceternity UI (BackgroundBeams, CardSpotlight, Meteors, Spotlight, GridPattern)
- **Icons:** Lucide React
- **Real-time:** Socket.io-client 4
- **Routing:** React Router DOM 7

---

## Project Structure

```
ai_tracker/
├── .env                        # Root-level environment variables
├── client/                     # React frontend
│   └── src/
│       ├── components/
│       │   ├── aceternity/     # BackgroundBeams, CardSpotlight, Meteors, Spotlight, GridPattern
│       │   ├── HotTopicCard.tsx
│       │   ├── ScoreGauge.tsx
│       │   ├── StatsBar.tsx
│       │   ├── LiveIndicator.tsx
│       │   ├── TrendSparkline.tsx
│       │   └── SourceFilter.tsx
│       ├── hooks/
│       │   ├── useSocket.ts    # Socket.io connection + event handling
│       │   └── useTopics.ts    # Fetch + real-time topic merging
│       ├── pages/
│       │   ├── Dashboard.tsx   # Main feed
│       │   ├── TopicDetail.tsx # Single topic + trend history
│       │   └── Settings.tsx    # Cron schedule, threshold, email
│       └── lib/api.ts          # Axios API client
└── server/                     # Express backend
    ├── prisma/schema.prisma
    ├── src/
    │   ├── config/env.ts
    │   ├── db/prisma.ts
    │   ├── routes/             # topics, stats, settings
    │   ├── services/
    │   │   ├── scraper.ts      # HN, Reddit, arXiv, HuggingFace
    │   │   ├── twitter.ts      # Twitter (optional)
    │   │   ├── openrouter.ts   # LLM analysis
    │   │   ├── email.ts        # Alert emails
    │   │   └── scheduler.ts    # Cron orchestrator
    │   └── socket/handlers.ts
    └── tests/                  # 18 Vitest tests
```

---

## Database Schema

```
Source → Topic (unique URL) → TrendData (score history)
                            → Alert (email log)
Settings (singleton row)
```

- **Topic.hotScore** — LLM-assigned score 1–100 (`< 40` minor, `40–59` noteworthy, `60–79` significant, `80+` critical)
- **Topic.rawScore** — raw community engagement number from the source
- **TrendData** — one row per scrape cycle per topic, used for sparkline charts

---

## Getting Started

### Prerequisites

- Node.js 20+
- An [OpenRouter](https://openrouter.ai) API key (free tier is sufficient)
- Optional: a [twitterapi.io](https://twitterapi.io) key for Twitter results
- Optional: SMTP credentials for email alerts

### 1. Clone and install

```bash
git clone <repo-url>
cd ai_tracker

# Install both workspaces
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `.env` at the **project root** (not inside `server/` or `client/`):

```env
# Required
OPENROUTER_API_KEY=sk-or-...
DATABASE_URL=file:./dev.db

# Optional — Twitter scraping
TWITTER_API_KEY=

# Optional — email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=you@gmail.com

# Server config
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Initialize the database

```bash
cd server
DATABASE_URL="file:./dev.db" npx prisma db push
```

### 4. Run in development

Open two terminals:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The first scrape runs 3 seconds after server start.

---

## API Reference

### REST

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server health check |
| GET | `/api/topics` | Paginated topics (`?limit&offset&source&minScore`) |
| GET | `/api/topics/:id` | Single topic with full trend history |
| GET | `/api/stats` | Aggregate stats + per-source breakdown |
| GET | `/api/settings` | Current settings |
| POST | `/api/settings` | Update settings, restart scheduler |

### Socket.io Events

| Direction | Event | Payload |
|---|---|---|
| server → client | `initial:data` | Top 20 topics on connect |
| server → client | `topic:new` | Newly discovered topic |
| server → client | `topic:updated` | Re-scored or AI-enriched topic |
| server → client | `stats:update` | Fresh aggregates after cron run |
| server → client | `scrape:started` | `{ timestamp }` |
| server → client | `scrape:completed` | `{ count, timestamp }` |
| client → server | `request:initial` | Request data snapshot |

---

## Scrape & Analyze Pipeline

The scheduler runs in two phases to ensure the feed is always populated even when the LLM is slow:

**Phase 1 — Instant upsert (all items)**
All scraped items are immediately written to the database with a fallback score derived from the raw community score. The UI updates in real time.

**Phase 2 — AI enrichment (max 8 new items, sequential)**
New items (no summary yet) are sent to OpenRouter one at a time with a 7-second gap between calls — safely under the free tier rate limit of ~10 req/min. The LLM returns a `summary`, `tags[]`, and a calibrated `hotScore`. Topics are re-emitted via Socket.io as they are enriched.

---

## Hot Score Scale

| Score | Level | Meaning |
|---|---|---|
| 80 – 100 | CRITICAL | Historic / major breakthrough |
| 60 – 79 | SIGNIFICANT | Important development |
| 40 – 59 | NOTEWORTHY | Worth reading |
| 1 – 39 | MINOR | Background signal |

---

## Settings

Accessible at `/settings` in the UI or via `POST /api/settings`:

| Field | Default | Description |
|---|---|---|
| `cronExpression` | `*/30 * * * *` | How often to scrape (standard cron) |
| `alertThreshold` | `80` | Minimum hotScore to trigger email |
| `emailEnabled` | `false` | Enable/disable email alerts |
| `notifyEmail` | `""` | Recipient email address |

---

## Running Tests

```bash
cd server && npm test
```

18 tests across three suites:
- `openrouter.test.ts` — JSON parsing, markdown stripping, fallback on network error, score clamping
- `scraper.test.ts` — HN scraper, Reddit scraper, AI keyword filter, per-source failure isolation
- `routes.test.ts` — GET /topics pagination, GET /stats aggregation, POST /settings

---

## Production Build

```bash
# Build server
cd server && npm run build   # outputs to server/dist/

# Build client
cd client && npm run build   # outputs to client/dist/
```

Run the built server:

```bash
cd server && npm start
```

Serve `client/dist/` from any static host (Vercel, Netlify, nginx). Point `VITE_API_URL` at your deployed server if not on the same host.

---

## Twitter Quality Filters

Twitter results are held to a strict standard to avoid noise:

- Account must be verified (blue check or legacy verified)
- Account must have > 10,000 followers
- Tweet must have > 1,000 likes
- Tweet must have > 500 retweets
- Tweet must have > 5,000 views

The API query also pre-filters with `min_faves:1000 min_retweets:500` to reduce unnecessary data transfer.
