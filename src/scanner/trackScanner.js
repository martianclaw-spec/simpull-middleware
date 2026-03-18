// Scans the AC content/tracks/ directory and returns a normalized array of track objects.
//
// Handles both single-layout and multi-layout tracks.
// Multi-layout: track folder has ui/{layoutId}/ui_track.json for each layout
// Single-layout: track folder has ui/ui_track.json directly
//
// Each track object:
//   { id, name, track, layout, _previewPath }
//   - id        : "{track}" for single, "{track}_{layout}" for multi
//   - name      : from ui_track.json, fallback to normalized folder name
//   - track     : AC track folder name
//   - layout    : AC layout subfolder name, or null for single-layout
//   - _previewPath : absolute path to best preview image, or null

const fs = require('fs')
const path = require('path')
const { normalizeId } = require('../normalizer/idNormalizer')
const { normalizeName } = require('../normalizer/nameNormalizer')
const { resolveTrackPreview } = require('../resolvers/trackPreviewResolver')

function safeReaddir(dir) {
  try { return fs.readdirSync(dir) } catch { return [] }
}

function isDirectory(p) {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function fileExists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true } catch { return false }
}

function parseACJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const cleaned = raw
    .replace(/^\uFEFF/, '')
    .replace(/[\x00-\x1F]/g, ' ')
  return JSON.parse(cleaned)
}

function readTrackName(jsonPath, fallback) {
  if (!fileExists(jsonPath)) return normalizeName(fallback)
  try {
    const ui = parseACJson(jsonPath)
    return (ui.name && ui.name.trim()) || normalizeName(fallback)
  } catch {
    return normalizeName(fallback)
  }
}

function scanTracks(acPath) {
  const tracksPath = path.join(acPath, 'content', 'tracks')
  const entries = safeReaddir(tracksPath)
  const tracks = []

  for (const entry of entries) {
    const trackDir = path.join(tracksPath, entry)
    if (!isDirectory(trackDir)) continue

    const uiDir = path.join(trackDir, 'ui')
    let foundLayouts = false

    // Check for multi-layout: subdirectories inside ui/ that each contain ui_track.json
    if (isDirectory(uiDir)) {
      const uiEntries = safeReaddir(uiDir)
      for (const uiEntry of uiEntries) {
        const layoutDir = path.join(uiDir, uiEntry)
        if (!isDirectory(layoutDir)) continue
        const layoutJson = path.join(layoutDir, 'ui_track.json')
        if (!fileExists(layoutJson)) continue

        foundLayouts = true
        const layoutId = normalizeId(uiEntry)
        const name = readTrackName(layoutJson, uiEntry)
        const previewPath = resolveTrackPreview(trackDir, uiEntry)

        tracks.push({
          id: `${normalizeId(entry)}_${layoutId}`,
          name,
          track: normalizeId(entry),
          layout: layoutId,
          _previewPath: previewPath,
        })
      }
    }

    // Single-layout track
    if (!foundLayouts) {
      const singleJson = path.join(uiDir, 'ui_track.json')
      if (!fileExists(singleJson)) continue // no metadata at all — skip

      const name = readTrackName(singleJson, entry)
      const previewPath = resolveTrackPreview(trackDir, null)

      tracks.push({
        id: normalizeId(entry),
        name,
        track: normalizeId(entry),
        layout: null,
        _previewPath: previewPath,
      })
    }
  }

  tracks.sort((a, b) => a.name.localeCompare(b.name))
  return tracks
}

module.exports = { scanTracks }
