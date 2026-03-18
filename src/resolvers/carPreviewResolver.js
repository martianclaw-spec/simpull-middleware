// Resolves the best available preview image for a given car.
//
// Search order (mirrors what the current working Sim-Pull backend uses):
//   1. First skin folder alphabetically — preview.jpg / preview.png
//   2. ui/dlc_preview.png  (DLC cars)
//   3. ui/preview.jpg / ui/preview.png  (some mods)
//   4. ui/badge.png  (manufacturer logo — always present for Kunos cars)
//   5. null — no preview available

const fs = require('fs')
const path = require('path')

function safeReaddir(dir) {
  try { return fs.readdirSync(dir) } catch { return [] }
}

function isDirectory(p) {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function fileExists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true } catch { return false }
}

function resolveCarPreview(carDir) {
  const uiDir = path.join(carDir, 'ui')
  const skinsDir = path.join(carDir, 'skins')

  // 1. Walk skin folders (sorted) — first preview.jpg / preview.png wins
  const skins = safeReaddir(skinsDir).sort()
  for (const skin of skins) {
    const skinDir = path.join(skinsDir, skin)
    if (!isDirectory(skinDir)) continue
    for (const filename of ['preview.jpg', 'preview.png']) {
      const p = path.join(skinDir, filename)
      if (fileExists(p)) return p
    }
  }

  // 2. DLC preview
  const dlcPreview = path.join(uiDir, 'dlc_preview.png')
  if (fileExists(dlcPreview)) return dlcPreview

  // 3. Mod preview in ui/
  for (const filename of ['preview.jpg', 'preview.png']) {
    const p = path.join(uiDir, filename)
    if (fileExists(p)) return p
  }

  // 4. Badge fallback
  const badge = path.join(uiDir, 'badge.png')
  if (fileExists(badge)) return badge

  return null
}

module.exports = { resolveCarPreview }
