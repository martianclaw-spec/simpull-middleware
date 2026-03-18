// SimPull Middleware — default configuration values
// These are used when config.json does not exist or is missing a field.

module.exports = {
  port: 3005,
  acPath: 'C:/Program Files (x86)/Steam/steamapps/common/assettocorsa',
  scanOnStart: true,
  // How long (ms) to cache scan results before allowing a rescan
  cacheTTLMs: 0, // 0 = cache forever until POST /api/rescan is called
}
