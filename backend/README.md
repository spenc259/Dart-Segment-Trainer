# DartScorer Backend

This backend is intentionally isolated from the existing frontend app. It runs as a separate TypeScript service, listens on its own port, and persists drill sessions in SQLite without changing the current Vite client runtime.

## Stack

- Node.js + TypeScript
- Fastify for the HTTP API
- SQLite via Node's built-in `node:sqlite`
- Node's built-in test runner through `tsx --test`

## Run locally

```bash
cd backend
npm install
npm run dev
```

The API defaults to `http://127.0.0.1:4000`.

This service currently expects a recent Node runtime with `node:sqlite` available.

## Build and test

```bash
cd backend
npm test
npm run build
```

## Environment

Copy `.env.example` if you want explicit local config.

- `PORT`: API port
- `HOST`: bind host
- `DB_FILE`: SQLite database file path. Use `:memory:` for ephemeral runs and tests.

## First API surface

- `GET /health`
- `GET /api/v1/meta/modes`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions/:sessionId`
- `POST /api/v1/sessions/:sessionId/darts`
- `POST /api/v1/sessions/:sessionId/advance`
- `POST /api/v1/sessions/:sessionId/undo`
- `POST /api/v1/sessions/:sessionId/reset`
- `GET /api/v1/players/:playerId/sessions`

## Persisted entities

- `players`: currently anonymous player identities
- `drill_sessions`: live aggregate state and stats snapshot for a session
- `session_visits`: durable visit-by-visit history for replay, undo, and auditability
