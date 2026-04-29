# AI Pulse — Manual Testing Guide

## Prerequisites

Both servers must be running before testing.

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Expected output in Terminal 1:
```
[server] running at http://localhost:3001
[scheduler] started — running every 30 minutes
[scheduler] scrape started ...
[scheduler] scrape done — XX topics processed
```

Open your browser at **http://localhost:5173**

---

## Section 1 — Server Health

### 1.1 Health endpoint

Open a terminal and run:

```bash
curl http://localhost:3001/health
```

**Expected:** `{"status":"ok","timestamp":"..."}`

---

### 1.2 Topics API

```bash
curl "http://localhost:3001/api/topics?limit=5"
```

**Expected:**
- `total` > 0
- `topics` array with objects containing `id`, `title`, `hotScore`, `source`, `tags`

---

### 1.3 Stats API

```bash
curl http://localhost:3001/api/stats
```

**Expected:**
- `totalTopics` > 0
- `topicsBySource` shows counts per source (hackernews, reddit_ml, reddit_ai, twitter)
- `avgHotScore` between 1–100

---

## Section 2 — Dashboard (Main Page)

Open **http://localhost:5173**

### 2.1 Background orbs

| What to check | Expected result |
|---|---|
| Page background color | Deep charcoal `#0a0a0f` (near-black with slight blue tint) |
| Three gradient blobs visible | Cyan (top-left), violet (right), red (bottom-center) |
| Orbs slowly animate | They drift in smooth loops — visible after ~5 seconds |

---

### 2.2 Header bar

| Element | Expected |
|---|---|
| "⚡ AI Pulse" title | Visible top-left, "Pulse" is cyan |
| Live indicator | Pulsing dot — **LIVE** (cyan) when connected, **OFFLINE** (gray) if server is down |
| While scraping | Dot becomes purple, label reads **SCANNING**, spinning refresh icon appears |
| Settings gear icon | Top-right, click navigates to `/settings` |

---

### 2.3 Stats bar

Below the header you should see a metrics ribbon.

| Metric | Expected |
|---|---|
| **Topics** | Shows total count (e.g. `43`) in cyan |
| **Avg Score** | e.g. `48/100` in violet |
| **Active (1h)** | Count of topics updated in the last hour, in amber |
| **Top Topic** | Title of the highest-scored topic, truncated |

---

### 2.4 Topic cards

Each card shows:

| Element | Expected |
|---|---|
| Score gauge (left) | Circular arc colored by tier: gray (<40), cyan (40–59), violet (60–79), red+glow (80+) |
| Score number | Font is monospace (JetBrains Mono), centered in the gauge |
| Title | `Space Grotesk` font, truncates to 2 lines |
| Summary | Dimmed text below title, up to 2 lines |
| Source badge | Colored pill — orange=HN, red=ML/AI, blue=X, dark-red=PH |
| Tags | `#tag` pills in monospace |
| Sparkline | Tiny SVG line chart showing score history (right side) |
| External link | Top-right of card, opens URL in new tab |

**Card hover test:**
- Hover over a card → it lifts upward by ~4px smoothly
- Hover title → turns cyan

---

### 2.5 Score gauge visual verification

Find cards with these score ranges and confirm the gauge color:

| Score range | Expected color |
|---|---|
| 1–39 | Gray |
| 40–59 | Cyan `#00f5d4` |
| 60–79 | Violet `#8b5cf6` |
| 80–100 | Red `#ef4444` with glow effect |

---

### 2.6 Source filter pills

Above the topic grid:

| Action | Expected |
|---|---|
| Click **HN** pill | Only Hacker News topics show |
| Click **ML** pill | Only r/MachineLearning topics show |
| Click **AI** pill | Only r/artificial topics show |
| Click **X** pill | Only Twitter topics show |
| Click active pill again | Deselects — all topics shown |
| Click **ALL** | Resets to all topics |

Each pill shows a count in parentheses, e.g. `HN (15)`.

---

### 2.7 Min score slider

| Action | Expected |
|---|---|
| Drag slider to 50 | Cards with hotScore < 50 disappear |
| Drag slider to 80 | Only high-priority topics remain |
| Drag back to 0 | All topics return; label shows `—` |

---

### 2.8 Card animations on load

Refresh the page (Cmd+R / Ctrl+R):

- Cards should **cascade in** with a stagger — each card fades+slides in ~40ms after the previous one
- The stats bar should fade in from slightly below
- Source filter pills should slide in from above

---

## Section 3 — Topic Detail Page

Click any card on the dashboard.

URL should change to `/topic/<id>`.

### 3.1 Detail layout

| Element | Expected |
|---|---|
| Back arrow | Top-left, click returns to dashboard |
| Large score gauge (72px) | Same color rules as cards |
| Full title | Not truncated |
| Source badge + date | Below title |
| External link icon | Opens original URL |
| AI Summary section | 2-3 sentence summary (if OpenRouter succeeded) or fallback title |
| Tags section | All tags shown as pills |
| Score Trend section | Only visible if topic has been scraped 2+ times |

---

### 3.2 Trend chart

If the topic has been scraped multiple times:

| Check | Expected |
|---|---|
| SVG polyline visible | Line drawn from oldest to newest data point |
| Rising trend | Line color is **cyan** |
| Falling trend | Line color is **red** |
| Flat | Line color is **gray** |
| Date labels | Below chart: first scraped date → last scraped date |

To create trend data: wait 30 minutes for the next auto-scrape, or restart the server (scrape runs 3 seconds after startup).

---

### 3.3 Not found

Navigate to **http://localhost:5173/topic/nonexistent-id**

**Expected:** "Topic not found" message with a Back link.

---

## Section 4 — Settings Page

Click the gear icon in the top-right of the dashboard.

### 4.1 Page loads

| Element | Expected |
|---|---|
| Cron expression field | Shows current value (e.g. `*/30 * * * *`) |
| Alert threshold slider | Shows current value (e.g. `80`) |
| Email toggle | Off by default |
| Save button | Purple, labeled "Save Settings" |

---

### 4.2 Change cron expression

1. Clear the cron field and type `*/5 * * * *` (every 5 minutes)
2. Click **Save Settings**
3. Button turns **green** and shows **✓ Saved!** for 2 seconds

Verify persisted:
```bash
curl http://localhost:3001/api/settings
```
**Expected:** `"cronExpression": "*/5 * * * *"`

---

### 4.3 Change alert threshold

1. Drag the threshold slider to **90**
2. Click **Save Settings**

Verify:
```bash
curl http://localhost:3001/api/settings
```
**Expected:** `"alertThreshold": 90`

---

### 4.4 Email toggle

1. Click the toggle — it animates to **ON** (purple)
2. Email field appears
3. Type `test@example.com`
4. Click **Save Settings**

Verify:
```bash
curl http://localhost:3001/api/settings
```
**Expected:** `"emailEnabled": true`, `"notifyEmail": "test@example.com"`

---

### 4.5 Settings persist across reload

1. Save any setting
2. Navigate away (click Back)
3. Return to Settings
4. **Expected:** All fields show the previously saved values

---

## Section 5 — Real-time Updates (Socket.io)

### 5.1 Confirm WebSocket connection

1. Open browser DevTools → **Network** tab → filter by **WS**
2. Reload the page
3. **Expected:** A WebSocket connection to `ws://localhost:5173/socket.io/?...` shows as `101 Switching Protocols`

---

### 5.2 Watch live scrape events

Open browser DevTools → **Console** tab. Then in a new terminal:

```bash
curl -X POST http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"cronExpression":"*/1 * * * *"}'
```

Wait up to 1 minute. On the dashboard you should see:

| Event | Expected |
|---|---|
| Live indicator | Briefly turns purple and shows **SCANNING** |
| Spinning icon | Appears in the header |
| New/updated cards | Slide in at the top of the grid |
| Stats bar | Updates with new counts |

Reset the cron back to 30 minutes:
```bash
curl -X POST http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"cronExpression":"*/30 * * * *"}'
```

---

## Section 6 — Offline / Error States

### 6.1 Server down — frontend gracefully degrades

1. Stop the backend server (Ctrl+C in Terminal 1)
2. Wait 5 seconds
3. **Expected:** Live indicator turns gray and shows **OFFLINE**
4. Previously loaded topics remain visible (no blank screen)
5. Restart the server — indicator returns to **LIVE** automatically

---

### 6.2 API proxy working

```bash
curl http://localhost:5173/api/health
```

**Expected:** Same response as `http://localhost:3001/health` — confirms Vite proxy is configured.

---

## Section 7 — Responsive Layout

Resize the browser window to mobile width (~375px):

| Element | Expected |
|---|---|
| Header | Title + live indicator on one line |
| Stats bar | Wraps to multiple rows gracefully |
| Source filter | Pills wrap to a second line |
| Topic grid | Switches from 2 columns to 1 column |
| Cards | Full-width, readable text size |
| Last-updated time | Hidden on small screens (only shows on `sm:` and above) |

---

## Section 8 — Font Verification

| Location | Expected font |
|---|---|
| "AI Pulse" heading | Space Grotesk (sans-serif, slightly geometric) |
| Score numbers inside gauges | JetBrains Mono (monospace) |
| Source badges (`HN`, `ML`, `X`) | JetBrains Mono |
| Tag pills (`#llm`, `#ai`) | JetBrains Mono |
| "LIVE", "SCANNING" labels | JetBrains Mono |

If fonts appear as system fallback (Arial/Helvetica), check your network connection — fonts load from Google Fonts.

---

## Quick Smoke Test Checklist

Run through this in under 5 minutes to confirm nothing is broken after a change:

- [ ] `curl http://localhost:3001/health` → `{"status":"ok",...}`
- [ ] `curl http://localhost:3001/api/topics?limit=1` → topic with `hotScore` and `source`
- [ ] http://localhost:5173 loads, dark background visible
- [ ] At least one topic card renders with a score gauge
- [ ] LIVE indicator is cyan (not gray)
- [ ] Click a card → navigates to `/topic/:id`
- [ ] Click Back → returns to dashboard
- [ ] Click Settings gear → `/settings` loads
- [ ] Save a setting → button turns green
- [ ] `cd server && npm test` → `18 passed`
