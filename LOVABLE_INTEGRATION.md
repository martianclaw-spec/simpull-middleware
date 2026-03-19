# SimPull Middleware — Lovable Integration Guide

This file is written specifically for Simbook developers using Lovable.
Copy the prompt block below and paste it directly into your Lovable AI agent
so it understands exactly what SimPull Middleware is and how to call it.

---

## What to Tell the Lovable AI Agent

Paste this entire block into Lovable when building the SimPull integration:

---

```
We are integrating with SimPull Middleware — a locally running REST API service
installed on the venue's sim PC. It normalizes Assetto Corsa car and track content
into clean JSON with stable IDs and preview image URLs.

BASE URL: http://localhost:3005
(This should be a configurable setting in the app — venues may run it on a
different port or machine. Store it as SIMPULL_BASE_URL.)

CORS is enabled on all endpoints. You can call this API directly from the browser.

---

ENDPOINTS:

GET {SIMPULL_BASE_URL}/api/cars
Returns an array of car objects:
[
  {
    "id": "ks_ferrari_488_gt3",
    "name": "Ferrari 488 GT3",
    "brand": "Ferrari",
    "preview": "http://localhost:3005/api/car-preview/ks_ferrari_488_gt3"
  }
]

GET {SIMPULL_BASE_URL}/api/tracks
Returns an array of track objects (one entry per layout):
[
  {
    "id": "spa",
    "name": "Spa-Francorchamps",
    "track": "spa",
    "layout": null,
    "preview": "http://localhost:3005/api/track-preview/spa"
  },
  {
    "id": "monza_short",
    "name": "Monza Short",
    "track": "monza",
    "layout": "short",
    "preview": "http://localhost:3005/api/track-preview/monza/short"
  }
]

GET {SIMPULL_BASE_URL}/api/car-preview/:carId
Returns the car preview image directly as image/jpeg.
NEVER returns 404 — falls back to a transparent placeholder if no image found.
Use this URL directly in <img src="..."> tags.

GET {SIMPULL_BASE_URL}/api/track-preview/:track
GET {SIMPULL_BASE_URL}/api/track-preview/:track/:layout
Returns the track or layout preview image directly as image/jpeg.
NEVER returns 404 — falls back gracefully.
Use this URL directly in <img src="..."> tags.

GET {SIMPULL_BASE_URL}/api/status
Returns service health and scan counts:
{
  "status": "ok",
  "acPath": "C:/Program Files (x86)/Steam/steamapps/common/assettocorsa",
  "carsLoaded": 176,
  "tracksLoaded": 35,
  "lastScan": "2026-03-18T06:05:00.000Z"
}
Use this endpoint to check if SimPull Middleware is running before making other calls.

POST {SIMPULL_BASE_URL}/api/rescan
Triggers a fresh scan of the AC directory. Call this if a venue adds new cars/tracks.
Returns updated status counts.

---

IMPORTANT BEHAVIORS:

1. Preview image URLs are direct image endpoints — use them in <img src> directly.
   Do not try to fetch them as JSON.

2. The "id" field is the stable identifier. Use it for bookings, selections, and
   any data you store on your end. It matches the Assetto Corsa folder name exactly.

3. Tracks with layouts will appear as separate entries, each with a unique "id"
   combining track + layout (e.g. "monza_short"). The "track" field is the base
   track folder, "layout" is the layout subfolder (or null for single-layout tracks).

4. SIMPULL_BASE_URL should be configurable per venue. Different venues may run
   the middleware on different ports or expose it on their local network.

5. Always call /api/status first. If it fails, show a friendly "SimPull not connected"
   state rather than a broken UI.

6. The middleware runs on the venue's local PC — it is not a cloud service.
   It will only be reachable when the venue's sim PC is on and the middleware
   is running.
```

---

## Recommended Lovable App Behavior

When building the Simbook + SimPull integration in Lovable, instruct the agent to:

- **Store `SIMPULL_BASE_URL`** as a configurable setting per venue (default: `http://localhost:3005`)
- **Poll `/api/status`** on page load to check if middleware is reachable
- **Show a connection indicator** — green if middleware responds, grey/red if not
- **Use preview URLs directly in `<img>` tags** — no base64, no re-fetching
- **Use the `id` field** as the stable reference for any car/track stored in Simbook's database
- **Call `/api/rescan`** after a venue reports adding new content

---

## Quick Test

Once SimPull Middleware is installed and running at a venue, open a browser on
that machine and visit:

```
http://localhost:3005/api/status
```

If you see JSON with `"status": "ok"` — the middleware is live and ready.

```
http://localhost:3005/demo
```

Opens the demo UI showing all cars and tracks with preview images.

---

## Source

GitHub: https://github.com/martianclaw-spec/simpull-middleware
