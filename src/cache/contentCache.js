// In-memory content cache.
// Holds the results of the last AC scan.
// Data is stable until POST /api/rescan is called.

const { scanCars } = require('../scanner/carScanner')
const { scanTracks } = require('../scanner/trackScanner')

let _cars = []
let _tracks = []
let _lastScan = null
let _acPath = null

async function rescan(acPath) {
  console.log(`[SimPull Middleware] Scanning AC content at: ${acPath}`)
  const start = Date.now()

  _acPath = acPath
  _cars = scanCars(acPath)
  _tracks = scanTracks(acPath)
  _lastScan = new Date().toISOString()

  const elapsed = Date.now() - start
  console.log(`[SimPull Middleware] Scan complete — ${_cars.length} cars, ${_tracks.length} tracks (${elapsed}ms)`)
}

function getCars() { return _cars }
function getTracks() { return _tracks }
function getLastScan() { return _lastScan }
function getAcPath() { return _acPath }
function isReady() { return _lastScan !== null }

module.exports = { rescan, getCars, getTracks, getLastScan, getAcPath, isReady }
