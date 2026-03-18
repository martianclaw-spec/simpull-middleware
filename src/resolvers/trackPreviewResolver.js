// Resolves the best available preview image for a given track / layout.
//
// Search order (outline first — much better for kiosk identification than a photo):
//   Single-layout:
//     1. ui/outline.png
//     2. ui/preview.png
//   Multi-layout:
//     1. ui/{layoutId}/outline.png
//     2. ui/{layoutId}/preview.png
//     3. ui/outline.png          (track-level fallback)
//     4. ui/preview.png          (track-level fallback)
//   Returns null if nothing found.

const fs = require('fs')
const path = require('path')

function fileExists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true } catch { return false }
}

function resolveTrackPreview(trackDir, layoutId) {
  const uiDir = path.join(trackDir, 'ui')

  const candidates = layoutId
    ? [
        path.join(uiDir, layoutId, 'outline.png'),
        path.join(uiDir, layoutId, 'preview.png'),
        path.join(uiDir, 'outline.png'),
        path.join(uiDir, 'preview.png'),
      ]
    : [
        path.join(uiDir, 'outline.png'),
        path.join(uiDir, 'preview.png'),
      ]

  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate
  }

  return null
}

module.exports = { resolveTrackPreview }
