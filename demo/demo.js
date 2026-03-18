// SimPull Middleware — Demo Consumer
// This file only reads from the middleware API. It does not contain business logic.

const BASE = window.location.origin

async function init() {
  await loadStatus()
  await Promise.all([loadCars(), loadTracks()])
}

async function loadStatus() {
  try {
    const res = await fetch(`${BASE}/api/status`)
    const data = await res.json()

    const dot = document.getElementById('status-dot')
    const txt = document.getElementById('status-text')

    if (data.status === 'ok') {
      dot.className = 'status-dot ok'
      txt.textContent = `${data.carsLoaded} cars · ${data.tracksLoaded} tracks`
    } else {
      dot.className = 'status-dot error'
      txt.textContent = 'Not scanned — click Rescan'
    }

    document.getElementById('status-json').textContent = JSON.stringify(data, null, 2)
  } catch {
    document.getElementById('status-dot').className = 'status-dot error'
    document.getElementById('status-text').textContent = 'Cannot reach middleware'
  }
}

async function loadCars() {
  const grid = document.getElementById('cars-grid')
  grid.innerHTML = '<div class="empty">Loading cars...</div>'

  try {
    const res = await fetch(`${BASE}/api/cars`)
    const cars = await res.json()

    document.getElementById('car-count').textContent = cars.length

    if (!cars.length) {
      grid.innerHTML = '<div class="empty">No cars found. Check acPath in config.</div>'
      return
    }

    grid.innerHTML = cars.map(car => `
      <div class="card">
        ${car.preview
          ? `<img class="card-img" src="${car.preview}" alt="${esc(car.name)}" loading="lazy" />`
          : `<div class="card-img no-preview" style="display:flex;align-items:center;justify-content:center;font-size:12px">No preview</div>`
        }
        <div class="card-body">
          <div class="card-name">${esc(car.name)}</div>
          ${car.brand ? `<div class="card-sub">${esc(car.brand)}</div>` : ''}
        </div>
      </div>
    `).join('')
  } catch (err) {
    grid.innerHTML = `<div class="empty">Error: ${esc(err.message)}</div>`
  }
}

async function loadTracks() {
  const grid = document.getElementById('tracks-grid')
  grid.innerHTML = '<div class="empty">Loading tracks...</div>'

  try {
    const res = await fetch(`${BASE}/api/tracks`)
    const tracks = await res.json()

    document.getElementById('track-count').textContent = tracks.length

    if (!tracks.length) {
      grid.innerHTML = '<div class="empty">No tracks found. Check acPath in config.</div>'
      return
    }

    grid.innerHTML = tracks.map(t => `
      <div class="card">
        ${t.preview
          ? `<img class="card-img" src="${t.preview}" alt="${esc(t.name)}" loading="lazy" />`
          : `<div class="card-img no-preview" style="display:flex;align-items:center;justify-content:center;font-size:12px">No preview</div>`
        }
        <div class="card-body">
          <div class="card-name">${esc(t.name)}</div>
          ${t.layout ? `<div class="card-sub">Layout: ${esc(t.layout)}</div>` : ''}
        </div>
      </div>
    `).join('')
  } catch (err) {
    grid.innerHTML = `<div class="empty">Error: ${esc(err.message)}</div>`
  }
}

async function rescan() {
  const btn = document.getElementById('rescan-btn')
  btn.disabled = true
  btn.textContent = 'Scanning...'
  try {
    await fetch(`${BASE}/api/rescan`, { method: 'POST' })
    await init()
  } finally {
    btn.disabled = false
    btn.textContent = 'Rescan AC'
  }
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    const names = ['cars', 'tracks', 'api']
    t.classList.toggle('active', names[i] === name)
  })
  document.querySelectorAll('.section').forEach(s => {
    s.classList.toggle('active', s.id === `tab-${name}`)
  })
  if (name === 'api') loadStatus()
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

init()
