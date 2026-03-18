/**
 * SimPull Middleware — Simbook Integration Adapter
 *
 * Exposes SimPull car and track data in a format optimized for booking tools
 * like simbook.io. Routes mount at /api/integrations/simbook/
 *
 * Endpoints:
 *   GET /api/integrations/simbook/cars
 *   GET /api/integrations/simbook/tracks
 *   GET /api/integrations/simbook/catalog   ← cars + tracks in one call
 *   GET /api/integrations/simbook/status
 *
 * How Simbook connects:
 *   1. Venue runs SimPull Middleware on their sim PC (http://localhost:3005)
 *   2. Simbook's app fetches from http://localhost:3005/api/integrations/simbook/catalog
 *   3. Venue configures their Simbook venue profile with their middleware URL
 *   4. Simbook shows their available cars and tracks automatically
 */

const express = require('express')
const cache   = require('../../cache/contentCache')

const router = express.Router()

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCar (car, base) {
  return {
    // Stable identifiers
    id:           car.id,
    slug:         car.id,

    // Display
    name:         car.name,
    brand:        car.brand || null,

    // Preview image — absolute URL, always present (placeholder if no image)
    preview_url:  `${base}/api/car-preview/${encodeURIComponent(car.id)}`,

    // Metadata for filtering/categorization in a booking UI
    tags:         car.tags   || [],
    class:        car.class  || null,

    // Source
    source: 'simpull-middleware',
  }
}

function formatTrack (track, base) {
  const previewUrl = track.layout
    ? `${base}/api/track-preview/${encodeURIComponent(track.track)}/${encodeURIComponent(track.layout)}`
    : `${base}/api/track-preview/${encodeURIComponent(track.track)}`

  return {
    // Stable identifiers
    id:           track.id,
    slug:         track.id,

    // Display
    name:         track.name,
    track:        track.track,
    layout:       track.layout || null,

    // Preview image — absolute URL, always present
    preview_url:  previewUrl,

    // Source
    source: 'simpull-middleware',
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/integrations/simbook/cars
router.get('/cars', (req, res) => {
  if (!cache.isReady()) {
    return res.status(503).json({ error: 'Middleware not scanned yet', retry: true })
  }
  const base = `${req.protocol}://${req.get('host')}`
  res.json(cache.getCars().map(c => formatCar(c, base)))
})

// GET /api/integrations/simbook/tracks
router.get('/tracks', (req, res) => {
  if (!cache.isReady()) {
    return res.status(503).json({ error: 'Middleware not scanned yet', retry: true })
  }
  const base = `${req.protocol}://${req.get('host')}`
  res.json(cache.getTracks().map(t => formatTrack(t, base)))
})

// GET /api/integrations/simbook/catalog
// Returns cars + tracks in a single call — ideal for booking UIs that need both
router.get('/catalog', (req, res) => {
  if (!cache.isReady()) {
    return res.status(503).json({ error: 'Middleware not scanned yet', retry: true })
  }
  const base = `${req.protocol}://${req.get('host')}`
  res.json({
    cars:       cache.getCars().map(c  => formatCar(c, base)),
    tracks:     cache.getTracks().map(t => formatTrack(t, base)),
    lastScan:   cache.getLastScan(),
    source:     'simpull-middleware',
    version:    '1.0',
  })
})

// GET /api/integrations/simbook/status
// Health check endpoint Simbook can ping to verify middleware is reachable
router.get('/status', (req, res) => {
  res.json({
    online:       true,
    ready:        cache.isReady(),
    carsLoaded:   cache.getCars().length,
    tracksLoaded: cache.getTracks().length,
    lastScan:     cache.getLastScan(),
    version:      '1.0',
    product:      'SimPull Middleware',
  })
})

module.exports = { router }
