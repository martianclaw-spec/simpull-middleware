/**
 * SimPull Middleware
 * Local content API for Assetto Corsa car and track data.
 *
 * Stable API contract:
 *   GET /api/cars
 *   GET /api/tracks
 *   GET /api/car-preview/:carId
 *   GET /api/track-preview/:track
 *   GET /api/track-preview/:track/:layout
 *   GET /api/status
 *   POST /api/rescan
 *   GET  /api/config
 *   PUT  /api/config
 */

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')

const defaults = require('./config/defaults')
const cache    = require('./src/cache/contentCache')
const { resolveCarPreview }   = require('./src/resolvers/carPreviewResolver')
const { resolveTrackPreview } = require('./src/resolvers/trackPreviewResolver')

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR   = path.join(__dirname, 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

function loadConfig () {
  let saved = {}
  try { saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch { /* first run */ }
  return {
    port:        Number(process.env.PORT)   || saved.port        || defaults.port,
    acPath:      process.env.AC_PATH        || saved.acPath      || defaults.acPath,
    scanOnStart: process.env.SCAN_ON_START === 'false' ? false
                 : saved.scanOnStart !== undefined ? saved.scanOnStart
                 : defaults.scanOnStart,
  }
}

function saveConfig (cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// 1×1 transparent PNG — sent instead of 404 when no preview image exists
const PLACEHOLDER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)
function sendPlaceholder (res) {
  res.set('Content-Type', 'image/png')
  res.send(PLACEHOLDER)
}

function notReady (res) {
  res.status(503).json({ error: 'Not scanned yet — POST /api/rescan to initialize.' })
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express()
app.use(cors())
app.use(express.json())

// Demo UI
app.use('/demo', express.static(path.join(__dirname, 'demo')))
app.get('/', (_, res) => res.redirect('/demo'))

// ─── GET /api/cars ────────────────────────────────────────────────────────────

app.get('/api/cars', (req, res) => {
  if (!cache.isReady()) return notReady(res)

  const base = `${req.protocol}://${req.get('host')}`
  const cars = cache.getCars().map(c => ({
    id:      c.id,
    name:    c.name,
    brand:   c.brand,
    preview: c._previewPath
      ? `${base}/api/car-preview/${encodeURIComponent(c.id)}`
      : null,
  }))
  res.json(cars)
})

// ─── GET /api/car-preview/:carId ──────────────────────────────────────────────

app.get('/api/car-preview/:carId', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return notReady(res)

  const carDir     = path.join(acPath, 'content', 'cars', req.params.carId)
  const previewPath = resolveCarPreview(carDir)
  if (previewPath) return res.sendFile(path.resolve(previewPath))
  sendPlaceholder(res)
})

// ─── GET /api/tracks ──────────────────────────────────────────────────────────

app.get('/api/tracks', (req, res) => {
  if (!cache.isReady()) return notReady(res)

  const base   = `${req.protocol}://${req.get('host')}`
  const tracks = cache.getTracks().map(t => {
    const previewUrl = t.layout
      ? `${base}/api/track-preview/${encodeURIComponent(t.track)}/${encodeURIComponent(t.layout)}`
      : `${base}/api/track-preview/${encodeURIComponent(t.track)}`
    return {
      id:      t.id,
      name:    t.name,
      track:   t.track,
      layout:  t.layout,
      preview: t._previewPath ? previewUrl : null,
    }
  })
  res.json(tracks)
})

// ─── GET /api/track-preview/:track ───────────────────────────────────────────

app.get('/api/track-preview/:track', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return notReady(res)

  const trackDir    = path.join(acPath, 'content', 'tracks', req.params.track)
  const previewPath = resolveTrackPreview(trackDir, null)
  if (previewPath) return res.sendFile(path.resolve(previewPath))
  sendPlaceholder(res)
})

// ─── GET /api/track-preview/:track/:layout ───────────────────────────────────

app.get('/api/track-preview/:track/:layout', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return notReady(res)

  const trackDir    = path.join(acPath, 'content', 'tracks', req.params.track)
  const previewPath = resolveTrackPreview(trackDir, req.params.layout)
  if (previewPath) return res.sendFile(path.resolve(previewPath))
  sendPlaceholder(res)
})

// ─── GET /api/status ─────────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
  const cfg = loadConfig()
  res.json({
    status:       cache.isReady() ? 'ok' : 'not_scanned',
    acPath:       cfg.acPath,
    carsLoaded:   cache.getCars().length,
    tracksLoaded: cache.getTracks().length,
    lastScan:     cache.getLastScan(),
  })
})

// ─── POST /api/rescan ─────────────────────────────────────────────────────────

app.post('/api/rescan', async (req, res) => {
  const cfg = loadConfig()
  try {
    await cache.rescan(cfg.acPath)
    res.json({
      ok:           true,
      carsLoaded:   cache.getCars().length,
      tracksLoaded: cache.getTracks().length,
      lastScan:     cache.getLastScan(),
    })
  } catch (err) {
    console.error('[SimPull Middleware] Rescan error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/config ──────────────────────────────────────────────────────────

app.get('/api/config', (req, res) => res.json(loadConfig()))

// ─── PUT /api/config ──────────────────────────────────────────────────────────

app.put('/api/config', (req, res) => {
  const current = loadConfig()
  const updated = { ...current }
  if (req.body.acPath       && req.body.acPath.trim()) updated.acPath = req.body.acPath.trim()
  if (req.body.port)                                   updated.port   = parseInt(req.body.port)
  if (req.body.scanOnStart !== undefined)              updated.scanOnStart = !!req.body.scanOnStart
  saveConfig(updated)
  res.json({ ok: true, config: updated })
})

// ─── Integrations (auto-loaded) ───────────────────────────────────────────────

const intDir = path.join(__dirname, 'src', 'integrations')
try {
  for (const entry of fs.readdirSync(intDir)) {
    const adapterFile = path.join(intDir, entry, 'adapter.js')
    if (fs.existsSync(adapterFile)) {
      const { router: r } = require(adapterFile)
      app.use(`/api/integrations/${entry}`, r)
      console.log(`[SimPull Middleware] Loaded integration: ${entry}`)
    }
  }
} catch { /* no integrations yet */ }

// ─── Start ────────────────────────────────────────────────────────────────────

async function start () {
  const cfg = loadConfig()
  saveConfig(cfg)

  if (cfg.scanOnStart) {
    await cache.rescan(cfg.acPath)
  }

  app.listen(cfg.port, () => {
    console.log('')
    console.log('  ╔══════════════════════════════════════╗')
    console.log('  ║       SimPull Middleware v1.0         ║')
    console.log('  ╚══════════════════════════════════════╝')
    console.log('')
    console.log(`  API:    http://localhost:${cfg.port}/api/status`)
    console.log(`  Cars:   http://localhost:${cfg.port}/api/cars`)
    console.log(`  Tracks: http://localhost:${cfg.port}/api/tracks`)
    console.log(`  Demo:   http://localhost:${cfg.port}/demo`)
    console.log('')
    console.log(`  AC Path: ${cfg.acPath}`)
    console.log('')
  })
}

start().catch(err => {
  console.error('[SimPull Middleware] Failed to start:', err.message)
  process.exit(1)
})
