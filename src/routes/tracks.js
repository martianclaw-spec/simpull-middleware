// Routes: /api/tracks, /api/track-preview/:track, /api/track-preview/:track/:layout

const express = require('express')
const path = require('path')
const router = express.Router()
const cache = require('../cache/contentCache')
const { resolveTrackPreview } = require('../resolvers/trackPreviewResolver')

// GET /api/tracks
// Returns normalized array of all installed tracks (one entry per layout).
router.get('/', (req, res) => {
  if (!cache.isReady()) {
    return res.status(503).json({ error: 'Content not scanned yet. POST /api/rescan to initialize.' })
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`
  const tracks = cache.getTracks().map(t => {
    const previewUrl = t.layout
      ? `${baseUrl}/api/track-preview/${encodeURIComponent(t.track)}/${encodeURIComponent(t.layout)}`
      : `${baseUrl}/api/track-preview/${encodeURIComponent(t.track)}`

    return {
      id: t.id,
      name: t.name,
      track: t.track,
      layout: t.layout,
      preview: t._previewPath ? previewUrl : null,
    }
  })

  res.json(tracks)
})

// GET /api/track-preview/:track
// Serves preview for a single-layout track. Also works as track-level fallback.
router.get('/preview/:track', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return res.status(503).json({ error: 'Not initialized' })

  const trackDir = path.join(acPath, 'content', 'tracks', req.params.track)
  const previewPath = resolveTrackPreview(trackDir, null)

  if (previewPath) {
    return res.sendFile(path.resolve(previewPath))
  }

  sendPlaceholder(res)
})

// GET /api/track-preview/:track/:layout
// Serves preview for a specific layout, falling back to track-level preview.
router.get('/preview/:track/:layout', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return res.status(503).json({ error: 'Not initialized' })

  const trackDir = path.join(acPath, 'content', 'tracks', req.params.track)
  const previewPath = resolveTrackPreview(trackDir, req.params.layout)

  if (previewPath) {
    return res.sendFile(path.resolve(previewPath))
  }

  sendPlaceholder(res)
})

function sendPlaceholder(res) {
  const placeholder = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  res.set('Content-Type', 'image/png')
  res.send(placeholder)
}

module.exports = router
