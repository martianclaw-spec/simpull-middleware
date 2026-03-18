# SimPull Middleware — Integrations

This folder contains adapters that map SimPull Middleware's stable API contract
to the formats required by third-party platforms.

## Adapter Pattern

Each adapter lives in its own subfolder:

```
integrations/
  simbook/          ← created when Simbook API docs are available
    adapter.js      ← maps { id, name, preview } → Simbook format
    README.md       ← documents what Simbook needs and what we provide
  racedepartment/
    adapter.js
```

## Rules

- Adapters **consume** the middleware's stable API — they never modify it
- Adapters may expose new routes like `GET /api/integrations/simbook/cars`
- The core `/api/cars` and `/api/tracks` contract is **never changed** for an adapter
- Adapters are registered in `server.js` only if their folder exists and is configured

## Adding a New Adapter

1. Create `integrations/{platform}/adapter.js`
2. Export `{ router }` — an Express router mounted at `/api/integrations/{platform}`
3. Register it in `server.js` under the integrations mount block
4. Document the mapping in `integrations/{platform}/README.md`

## Simbook

When Simbook publishes their API, the adapter will:
- Map `car.id` → Simbook's vehicle identifier format
- Map `car.preview` → Simbook's image URL field
- Expose `GET /api/integrations/simbook/vehicles` in Simbook's expected schema

No fake integration is built until real API documentation is available.
