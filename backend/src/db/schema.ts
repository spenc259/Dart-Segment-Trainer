export const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('anonymous')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS drill_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
    mode_id TEXT NOT NULL CHECK (mode_id IN ('standard', 'strict', 'precision', 'endurance')),
    target_segment INTEGER NOT NULL,
    score INTEGER NOT NULL,
    streak INTEGER NOT NULL,
    best_streak INTEGER NOT NULL,
    visits_played INTEGER NOT NULL,
    total_darts INTEGER NOT NULL,
    total_qualifying_hits INTEGER NOT NULL,
    successful_visits INTEGER NOT NULL,
    current_visit TEXT NOT NULL,
    personal_best_streak INTEGER NOT NULL,
    visit_limit INTEGER NOT NULL,
    ended_by_miss INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS session_visits (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES drill_sessions(id) ON DELETE CASCADE,
    visit_number INTEGER NOT NULL,
    darts TEXT NOT NULL,
    qualifying_hits INTEGER NOT NULL,
    success INTEGER NOT NULL,
    perfect INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    streak_after_visit INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, visit_number)
  );

  CREATE INDEX IF NOT EXISTS idx_drill_sessions_player_updated
    ON drill_sessions(player_id, updated_at DESC);

  CREATE INDEX IF NOT EXISTS idx_session_visits_session_number
    ON session_visits(session_id, visit_number DESC);
`;
