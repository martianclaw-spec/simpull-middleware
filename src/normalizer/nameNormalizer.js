// Converts AC internal folder names to human-readable display names.
// Used as a fallback when ui_car.json / ui_track.json has no name field.
//
// Examples:
//   ks_ferrari_488_gt3  → Ferrari 488 GT3
//   rss_formula_hybrid  → Formula Hybrid
//   tatuusfa1           → Tatuusfa1  (unknown prefix — title case as-is)

const KNOWN_PREFIXES = [
  'ks_',   // Kunos official
  'rss_',  // Race Sim Studio
  'vrc_',  // VRC Modding
  'acc_',  // AC Competizione port
  'urd_',  // URD
  'ct_',   // CarTech Modding
  'asr_',  // ASR Formula
  'ms_',   // various mod packs
  'fr_',
  'af_',
  'bls_',
]

// Words that should stay uppercase
const UPPERCASE_WORDS = new Set(['gt3', 'gt4', 'gt2', 'gte', 'lmp1', 'lmp2', 'dtm', 'tcr', 'wrc', 'f1', 'f2', 'f3', 'f4', 'v8', 'v10', 'v12', 'bmw', 'amg', 'rsr', 'rs3', 'rs4', 'rs5', 'rsr'])

function normalizeName(folderId) {
  let name = folderId

  // Strip known mod prefixes
  for (const prefix of KNOWN_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length)
      break
    }
  }

  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, ' ').trim()

  // Title-case each word, respecting known uppercase abbreviations
  name = name
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase()
      if (UPPERCASE_WORDS.has(lower)) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')

  return name
}

module.exports = { normalizeName }
