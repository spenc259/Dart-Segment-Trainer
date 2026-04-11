import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DartResult, Player, ScoredVisit, SessionState, SessionSummary } from "../domain/types.js";
import { schemaSql } from "./schema.js";

interface SessionRow {
  id: string;
  player_id: string;
  status: SessionState["status"];
  mode_id: SessionState["modeId"];
  target_segment: number;
  score: number;
  streak: number;
  best_streak: number;
  visits_played: number;
  total_darts: number;
  total_qualifying_hits: number;
  successful_visits: number;
  current_visit: string;
  personal_best_streak: number;
  visit_limit: number;
  ended_by_miss: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface VisitRow {
  visit_number: number;
  darts: string;
  qualifying_hits: number;
  success: number;
  perfect: number;
  points_earned: number;
  streak_after_visit: number;
  note: string;
}

const toBoolean = (value: number) => value === 1;
const parseDarts = (value: string) => JSON.parse(value) as DartResult[];

const mapVisitRow = (row: VisitRow): ScoredVisit => ({
  visitNumber: row.visit_number,
  darts: parseDarts(row.darts),
  qualifyingHits: row.qualifying_hits,
  success: toBoolean(row.success),
  perfect: toBoolean(row.perfect),
  pointsEarned: row.points_earned,
  streakAfterVisit: row.streak_after_visit,
  note: row.note,
});

const mapSessionRow = (row: SessionRow, history: ScoredVisit[]): SessionState => ({
  id: row.id,
  playerId: row.player_id,
  status: row.status,
  modeId: row.mode_id,
  targetSegment: row.target_segment,
  score: row.score,
  streak: row.streak,
  bestStreak: row.best_streak,
  visitsPlayed: row.visits_played,
  totalDarts: row.total_darts,
  totalQualifyingHits: row.total_qualifying_hits,
  successfulVisits: row.successful_visits,
  history,
  currentVisit: parseDarts(row.current_visit),
  personalBestStreak: row.personal_best_streak,
  visitLimit: row.visit_limit,
  endedByMiss: toBoolean(row.ended_by_miss),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
});

export class DatabaseClient {
  private readonly db: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ":memory:") {
      mkdirSync(dirname(filename), { recursive: true });
    }

    this.db = new DatabaseSync(filename);
    this.db.exec(schemaSql);
  }

  close() {
    this.db.close();
  }

  createAnonymousPlayer(createdAt: string): Player {
    const player: Player = {
      id: randomUUID(),
      kind: "anonymous",
      createdAt,
    };

    this.db.prepare("INSERT INTO players (id, kind, created_at) VALUES (?, ?, ?)").run(
      player.id,
      player.kind,
      player.createdAt,
    );

    return player;
  }

  getPlayer(playerId: string): Player | null {
    const row = this.db
      .prepare("SELECT id, kind, created_at FROM players WHERE id = ?")
      .get(playerId) as { id: string; kind: "anonymous"; created_at: string } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      kind: row.kind,
      createdAt: row.created_at,
    };
  }

  createSession(session: SessionState) {
    this.db.prepare(
      `
        INSERT INTO drill_sessions (
          id, player_id, status, mode_id, target_segment, score, streak, best_streak,
          visits_played, total_darts, total_qualifying_hits, successful_visits, current_visit,
          personal_best_streak, visit_limit, ended_by_miss, created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      session.id,
      session.playerId,
      session.status,
      session.modeId,
      session.targetSegment,
      session.score,
      session.streak,
      session.bestStreak,
      session.visitsPlayed,
      session.totalDarts,
      session.totalQualifyingHits,
      session.successfulVisits,
      JSON.stringify(session.currentVisit),
      session.personalBestStreak,
      session.visitLimit,
      session.endedByMiss ? 1 : 0,
      session.createdAt,
      session.updatedAt,
      session.completedAt,
    );
  }

  updateSession(session: SessionState) {
    this.db.prepare(
      `
        UPDATE drill_sessions
        SET status = ?,
            mode_id = ?,
            target_segment = ?,
            score = ?,
            streak = ?,
            best_streak = ?,
            visits_played = ?,
            total_darts = ?,
            total_qualifying_hits = ?,
            successful_visits = ?,
            current_visit = ?,
            personal_best_streak = ?,
            visit_limit = ?,
            ended_by_miss = ?,
            updated_at = ?,
            completed_at = ?
        WHERE id = ?
      `,
    ).run(
      session.status,
      session.modeId,
      session.targetSegment,
      session.score,
      session.streak,
      session.bestStreak,
      session.visitsPlayed,
      session.totalDarts,
      session.totalQualifyingHits,
      session.successfulVisits,
      JSON.stringify(session.currentVisit),
      session.personalBestStreak,
      session.visitLimit,
      session.endedByMiss ? 1 : 0,
      session.updatedAt,
      session.completedAt,
      session.id,
    );
  }

  getSession(sessionId: string): SessionState | null {
    const row = this.db.prepare("SELECT * FROM drill_sessions WHERE id = ?").get(sessionId) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    return mapSessionRow(row, this.listRecentVisits(sessionId));
  }

  listPlayerSessions(playerId: string): SessionSummary[] {
    const rows = this.db.prepare(
      `
        SELECT id, player_id, status, mode_id, target_segment, score, visits_played,
               best_streak, updated_at, completed_at
        FROM drill_sessions
        WHERE player_id = ?
        ORDER BY updated_at DESC
      `,
    ).all(playerId) as Array<{
      id: string;
      player_id: string;
      status: SessionState["status"];
      mode_id: SessionState["modeId"];
      target_segment: number;
      score: number;
      visits_played: number;
      best_streak: number;
      updated_at: string;
      completed_at: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      playerId: row.player_id,
      status: row.status,
      modeId: row.mode_id,
      targetSegment: row.target_segment,
      score: row.score,
      visitsPlayed: row.visits_played,
      bestStreak: row.best_streak,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    }));
  }

  listRecentVisits(sessionId: string, limit = 8): ScoredVisit[] {
    const rows = this.db.prepare(
      `
        SELECT visit_number, darts, qualifying_hits, success, perfect, points_earned,
               streak_after_visit, note
        FROM session_visits
        WHERE session_id = ?
        ORDER BY visit_number DESC
        LIMIT ?
      `,
    ).all(sessionId, limit) as unknown as VisitRow[];

    return rows.map(mapVisitRow);
  }

  listAllVisits(sessionId: string): ScoredVisit[] {
    const rows = this.db.prepare(
      `
        SELECT visit_number, darts, qualifying_hits, success, perfect, points_earned,
               streak_after_visit, note
        FROM session_visits
        WHERE session_id = ?
        ORDER BY visit_number ASC
      `,
    ).all(sessionId) as unknown as VisitRow[];

    return rows.map(mapVisitRow);
  }

  insertVisit(sessionId: string, visit: ScoredVisit, createdAt: string) {
    this.db.prepare(
      `
        INSERT INTO session_visits (
          id, session_id, visit_number, darts, qualifying_hits, success, perfect,
          points_earned, streak_after_visit, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      sessionId,
      visit.visitNumber,
      JSON.stringify(visit.darts),
      visit.qualifyingHits,
      visit.success ? 1 : 0,
      visit.perfect ? 1 : 0,
      visit.pointsEarned,
      visit.streakAfterVisit,
      visit.note,
      createdAt,
    );
  }

  deleteLastVisit(sessionId: string) {
    this.db.prepare(
      `
        DELETE FROM session_visits
        WHERE id = (
          SELECT id
          FROM session_visits
          WHERE session_id = ?
          ORDER BY visit_number DESC
          LIMIT 1
        )
      `,
    ).run(sessionId);
  }

  clearVisits(sessionId: string) {
    this.db.prepare("DELETE FROM session_visits WHERE session_id = ?").run(sessionId);
  }
}
