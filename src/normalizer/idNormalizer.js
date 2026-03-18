// Produces stable, URL-safe IDs from AC folder names.
// The folder name IS the canonical ID — we just lowercase and sanitize.
//
// Rule: never transform the ID in a way that breaks the filesystem lookup.
// The id returned here must map 1:1 back to the folder name on disk.

function normalizeId(folderName) {
  // AC folder names are already lowercase with underscores — just ensure clean string
  return folderName.trim().toLowerCase()
}

module.exports = { normalizeId }
