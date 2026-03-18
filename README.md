# SimPull Middleware

A lightweight, standalone local HTTP service that normalizes Assetto Corsa content into a clean, stable REST API.

Kiosks, overlays, launcher tools, and third-party sim platforms consume it over HTTP without needing to know anything about how AC stores its files internally.

---

## What It Does

- Scans your local Assetto Corsa installation
- Normalizes car and track names, IDs, and preview images
- Exposes a stable REST API on `localhost:3005`
- Handles multi-layout tracks, DLC cars, mod previews, and fallbacks
- Ships with a minimal demo UI to verify everything is working

## What It Does NOT Do

This is a content/data layer only. It does not include:
- Venue management or booking
- Session or race launching
- Kiosk UI
- Payments
- VM orchestration

Those belong in **SimPull VM/Platform**, which consumes this middleware as a client.

---

## Install & Run

```bash
# 1. Clone
git clone https://github.com/simpull/simpull-middleware.git
cd simpull-middleware

# 2. Install dependencies
npm install

# 3. Set your AC path (edit data/config.json or copy .env.example to .env)
# Default: C:/Program Files (x86)/Steam/steamapps/common/assettocorsa

# 4. Start
npm start
```

Open your browser:
- **Demo UI:** http://localhost:3005/demo
- **Cars API:** http://localhost:3005/api/cars
- **Tracks API:** http://localhost:3005/api/tracks
- **Status:** http://localhost:3005/api/status

---

## API Reference

### `GET /api/cars`
```json
[
  {
    "id": "ks_ferrari_488_gt3",
    "name": "Ferrari 488 GT3",
    "brand": "Ferrari",
    "preview": "http://localhost:3005/api/car-preview/ks_ferrari_488_gt3"
  }
]
```

### `GET /api/tracks`
```json
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
```

### `GET /api/car-preview/:carId`
Returns the car preview image directly. Never 404s — falls back to a 1x1 transparent placeholder.

### `GET /api/track-preview/:track`
### `GET /api/track-preview/:track/:layout`
Returns the track/layout preview image. Falls back to track-level image, then placeholder.

### `GET /api/status`
```json
{
  "status": "ok",
  "acPath": "C:/Program Files (x86)/Steam/.../assettocorsa",
  "carsLoaded": 47,
  "tracksLoaded": 23,
  "lastScan": "2026-03-18T06:05:00.000Z"
}
```

### `POST /api/rescan`
Triggers a fresh scan of the AC directory. Returns updated counts.

### `GET /api/config`
### `PUT /api/config`
Read or update runtime configuration (acPath, port, scanOnStart).

---

## Configuration

Edit `data/config.json`:

```json
{
  "port": 3005,
  "acPath": "C:/Program Files (x86)/Steam/steamapps/common/assettocorsa",
  "scanOnStart": true
}
```

Or set environment variables (see `.env.example`).

---

## Integrations

See `src/integrations/README.md` for how to add adapters for Simbook, RaceDepartment, or other platforms.

---

## Project Structure

```
simpull-middleware/
├── server.js                  Entry point
├── config/defaults.js         Default values
├── src/
│   ├── scanner/               Walks AC content/cars/ and content/tracks/
│   ├── resolvers/             Finds preview images with fallback logic
│   ├── normalizer/            Converts folder names to human-readable names
│   ├── cache/                 In-memory content store
│   ├── routes/                Express route handlers
│   └── integrations/          Future third-party adapter modules
├── demo/                      Minimal browser demo UI
└── data/config.json           Persisted configuration
```

---

## Relationship to SimPull VM/Platform

SimPull VM/Platform is the full venue system — kiosks, session launching, scenario management, and venue workflows. It treats this middleware as an external HTTP dependency, calling `/api/cars` and `/api/tracks` exactly like any other client.

The middleware has no knowledge of the platform. The platform has no embedded content logic — it reads from here.
