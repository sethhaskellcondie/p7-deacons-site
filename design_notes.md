# Design Notes — The Quorum (Payson 7th Ward Deacons Site)

A lightweight, single-page website for the Payson 7th Ward Deacons Quorum. It
shows weekly Sunday assignments, upcoming events, the yearly youth theme, and a
photo album. This document explains how the site is built, where its data comes
from, and how to make changes.

## Architecture at a glance

```
┌─────────────────┐     edits      ┌──────────────────┐
│ Quorum leaders  │ ─────────────► │   Google Sheet    │  (private; one tab
└─────────────────┘                │  "P7 Quorum Data" │   per data type)
                                   └────────┬─────────┘
                                            │ read via SpreadsheetApp
                                   ┌────────▼─────────┐
                                   │ Google Apps Script│  doGet() → JSON
                                   │     web app       │  (public URL)
                                   └────────┬─────────┘
                                            │ fetch() on page load
                                   ┌────────▼─────────┐
                                   │  Static site      │  Vite + TypeScript,
                                   │  (this repo)      │  no backend
                                   └──────────────────┘
```

There is **no server in this repo**. The site is a static bundle (HTML/CSS/JS)
produced by Vite. All dynamic data comes from a Google Sheet, exposed as a
read-only JSON endpoint by a Google Apps Script web app. Content updates are
made by editing the spreadsheet — no code change, no redeploy of the site.

> **Status note:** the Apps Script integration is the target design. Until it
> is wired up, the site renders the hardcoded arrays in `src/data.ts`. Those
> arrays are kept even after integration — they double as the instant-render
> fallback (see "Loading strategy" below).

## Repo layout

| Path | Purpose |
|------|---------|
| `index.html` | Page shell; loads Google Fonts (Sora, DM Sans) and mounts `#app` |
| `src/main.ts` | All rendering. Pure functions that return HTML strings (`renderHero`, `renderAssignments`, `renderCalendar`, `renderTheme`, `renderAlbum`, `renderFooter`), joined into `#app` |
| `src/data.ts` | TypeScript interfaces (`Assignment`, `QuorumEvent`, `GalleryItem`) and the fallback data arrays |
| `src/style.css` | All styling |
| `localFiles/` | Untracked local scratch notes (see `.gitignore`) |

Commands: `npm run dev` (local dev server), `npm run build` (type-check +
production bundle to `dist/`), `npm run preview` (serve the built bundle).

## The data layer

### Why this design

The site involves youth; we do not want a world-readable spreadsheet with
names in it. The Apps Script approach keeps the sheet **private** — the script
runs as the sheet owner and exposes only the JSON it chooses to return. It is
free, needs no Google Cloud project or API keys, and leaders edit a normal
spreadsheet. Trade-offs we accepted: ~1–2 s cold-start on the first request
(hidden by the fallback-render strategy) and URL-obscurity rather than real
authentication (anyone holding the endpoint URL can read the JSON, so nothing
sensitive beyond first names should ever be returned).

Alternatives considered and rejected: published-to-web sheet CSV / `gviz`
endpoint (requires a public sheet; undocumented format), Sheets API v4 with an
API key (still requires a public sheet, plus GCP setup), Google Calendar
(covers events only; would mean maintaining two sources), build-time fetch via
CI (best privacy but updates require rebuilds and CI plumbing we don't have).

### The Google Sheet (the "database")

One spreadsheet, owned by the webmaster's Google account, shared with quorum
leaders as editors. Each tab is a table; **row 1 is the header row and its
values are the JSON field names** — they must match the interfaces in
`src/data.ts` exactly (case-sensitive). Keep row 1 frozen and don't rename
headers.

Tab **Assignments** → `Assignment[]`:

| icon | role | when | who |
|------|------|------|-----|
| 🪑 | Set Up Chairs | Sunday · 7:50 AM | All Deacons |

Tab **Events** → `QuorumEvent[]`:

| month | day | time | title | blurb |
|-------|-----|------|-------|-------|
| AUG | 06 | 7:00 PM | Capture the Flag Night | Meet at the church field… |

Tab **Gallery** → `GalleryItem[]`:

| slot | ph |
|------|-----|
| med_g1 | Activity photo |

Privacy rule for editors: the `who` column may carry first names only. Never
put phone numbers, addresses, or full names in any column the script returns.

### The Apps Script (the "API")

Lives in the spreadsheet under **Extensions → Apps Script** (it is bound to
the sheet, so it is not in this repo — keep a copy of the source in the sheet's
script editor and mirror any changes here in the doc if the shape changes).

```javascript
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = {
    assignments: tabToObjects(ss.getSheetByName('Assignments')),
    events: tabToObjects(ss.getSheetByName('Events')),
    gallery: tabToObjects(ss.getSheetByName('Gallery')),
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Header row becomes the object keys: [{icon: '🪑', role: '...', ...}, ...]
function tabToObjects(sheet) {
  const [headers, ...rows] = sheet.getDataRange().getValues();
  return rows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) =>
      Object.fromEntries(headers.map((h, i) => [h, String(row[i])])),
    );
}
```

Deployed via **Deploy → New deployment → Web app** with:

- **Execute as:** Me (the sheet owner) — this is what lets the sheet stay private
- **Who has access:** Anyone

That yields a stable URL of the form
`https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`, which the site
fetches. A plain GET to this URL is a "simple request" in CORS terms, so no
preflight issues.

### The frontend (the "client")

`src/main.ts` renders synchronously from the fallback arrays, then fetches the
endpoint and re-renders with live data when it arrives.

Loading strategy (in order):

1. Render immediately from `src/data.ts` fallback arrays — the page is never
   blank and cold starts are invisible.
2. `fetch(SCRIPT_URL)` in the background; on success, validate the shape
   (arrays present, expected keys on the first element) and re-render the
   assignments/calendar/album sections with the live data.
3. Optionally cache the last good payload in `localStorage` and prefer it over
   the hardcoded arrays on the next visit.
4. On any failure (network, quota, malformed data), keep the fallback render
   and log to the console — never show a broken page over stale-but-sane data.

The endpoint URL is a constant in the frontend code. It is public by nature
(it ships in the compiled JS), which is acceptable because the script only
returns data we consider publishable.

## How to make updates

**Change site content (events, assignments, gallery captions):** edit the
Google Sheet. Changes are live on the next page load — no build, no deploy.
This is the only step leaders ever need.

**Change the look or layout:** edit `src/main.ts` / `src/style.css`, verify
with `npm run dev`, then `npm run build` and deploy `dist/` however the site
is hosted.

**Add a new field to an existing data type** (e.g. a `location` on events):

1. Add the column to the sheet tab; header = field name.
2. Add the field to the matching interface in `src/data.ts` and to the
   fallback arrays.
3. Use it in the corresponding `render*` function.
4. No script change needed — `tabToObjects` picks up columns dynamically.

**Add a whole new data type:** add a tab in the sheet, add one line to the
`payload` object in `doGet()`, create a new deployment version (see below),
then add the interface, fallback array, and render function in the frontend.

**Change the Apps Script code:** edit in the sheet's script editor, then
**Deploy → Manage deployments → edit (pencil) → Version: New version**.
⚠️ Saving the script alone does **not** update the live URL — you must create
a new version. (Data edits in the sheet need no redeploy; this is only for
code changes.) Editing the existing deployment keeps the URL stable; a brand
new deployment would mint a new URL and require a frontend change.

## Constraints and gotchas

- **Read-only by design.** The site never writes. If a sign-up form is ever
  needed, Apps Script supports `doPost`, but use `text/plain` content type to
  avoid CORS preflight (Apps Script cannot answer `OPTIONS` requests).
- **Cold starts:** first request after idle takes ~1–2 s. The fallback-first
  render strategy exists specifically to mask this.
- **Header row is the schema.** Renaming a header silently breaks that field
  (`undefined` in the JSON). The frontend's shape validation plus the frozen
  header row are the guardrails.
- **Everything the script returns is public.** Treat the endpoint like a
  public page when deciding what columns to include.
- **Quotas:** free accounts get ~20k web-app requests/day — orders of
  magnitude beyond this site's traffic. Not a practical concern.
- **All values arrive as strings.** `tabToObjects` stringifies cells; format
  date-like columns as plain text in the sheet (or pre-format in the script)
  so Sheets' automatic date coercion doesn't produce `Wed Aug 06 2026...`.
