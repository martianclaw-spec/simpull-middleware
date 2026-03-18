// Routes: /api/cars, /api/car-preview/:carId

const express = require('express')
const path = require('path')
const router = express.Router()
const cache = require('../cache/contentCache')
const { resolveCarPreview } = require('../resolvers/carPreviewResolver')

// GET /api/cars
// Returns normalized array of all installed cars.
router.get('/', (req, res) => {
  if (!cache.isReady()) {
    return res.status(503).json({ error: 'Content not scanned yet. POST /api/rescan to initialize.' })
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`
  const cars = cache.getCars().map(car => ({
    id: car.id,
    name: car.name,
    brand: car.brand,
    preview: car._previewPath
      ? `${baseUrl}/api/car-preview/${encodeURIComponent(car.id)}`
      : null,
  }))

  res.json(cars)
})

// GET /api/car-preview/:carId
// Serves the preview image directly. Never 404s — falls back to placeholder.
router.get('/preview/:carId', (req, res) => {
  const acPath = cache.getAcPath()
  if (!acPath) return res.status(503).json({ error: 'Not initialized' })

  const carDir = path.join(acPath, 'content', 'cars', req.params.carId)
  const previewPath = resolveCarPreview(carDir)

  if (previewPath) {
    return res.sendFile(path.resolve(previewPath))
  }

  // No preview — send transparent 1x1 PNG placeholder
  const placeholder = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  res.set('Content-Type', 'image/png')
  res.send(placeholder)
})

module.exports = router
