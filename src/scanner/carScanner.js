// Scans the AC content/cars/ directory and returns a normalized array of car objects.
//
// Each car object:
//   { id, name, brand, preview }
//   - id      : folder name (stable, used in preview URLs)
//   - name    : from ui_car.json, fallback to normalized folder name
//   - brand   : from ui_car.json, fallback to ''
//   - preview : full preview URL (set by route layer, not here) — scanner returns hasPreview bool

const fs = require('fs')
const path = require('path')
const { normalizeId } = require('../normalizer/idNormalizer')
const { normalizeName } = require('../normalizer/nameNormalizer')
const { resolveCarPreview } = require('../resolvers/carPreviewResolver')

function safeReaddir(dir) {
  try { return fs.readdirSync(dir) } catch { return [] }
}

function isDirectory(p) {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function fileExists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true } catch { return false }
}

// AC JSON files can contain BOM and unescaped control characters — clean before parsing
function parseACJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const cleaned = raw
    .replace(/^\uFEFF/, '')        // strip BOM
    .replace(/[\x00-\x1F]/g, ' ') // replace control chars with space
  return JSON.parse(cleaned)
}

function readCarMeta(carDir, folderName) {
  const uiDir = path.join(carDir, 'ui')
  for (const filename of ['ui_car.json', 'dlc_ui_car.json']) {
    const jsonPath = path.join(uiDir, filename)
    if (!fileExists(jsonPath)) continue
    try {
      const ui = parseACJson(jsonPath)
      return {
        name: (ui.name && ui.name.trim()) || normalizeName(folderName),
        brand: ui.brand || '',
      }
    } catch { /* try next */ }
  }
  return { name: normalizeName(folderName), brand: '' }
}

function scanCars(acPath) {
  const carsPath = path.join(acPath, 'content', 'cars')
  const entries = safeReaddir(carsPath)
  const cars = []

  for (const entry of entries) {
    const carDir = path.join(carsPath, entry)
    if (!isDirectory(carDir)) continue

    // Skip empty placeholder folders (uninstalled DLC) — they have no ui/ subfolder
    const uiDir = path.join(carDir, 'ui')
    if (!isDirectory(uiDir)) continue

    const id = normalizeId(entry)
    const { name, brand } = readCarMeta(carDir, entry)
    const previewPath = resolveCarPreview(carDir)

    cars.push({
      id,
      name,
      brand,
      _previewPath: previewPath, // absolute path — used by route to serve file
    })
  }

  cars.sort((a, b) => a.name.localeCompare(b.name))
  return cars
}

module.exports = { scanCars }
