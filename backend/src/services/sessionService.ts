import { randomUUID } from "node:crypto";
import { DatabaseClient } from "../db/database.js";
import { DEFAULT_TARGET_SEGMENT, gameModes } from "../domain/gameModes.js";
import {
  addDartToSession,
  completeVisitWithDart,
  createInitialSessionState,
  getAccuracyPercent,
  getAverageScorePerVisit,
  getVisitSuccessRate,
  removePendingDart,
  replaySessionState,
  resetSessionState,
} from "../domain/sessionEngine.js";
import type { DartResult, GameModeId, Player, SessionState, SessionSummary } from "../domain/types.js";

export interface CreateSessionInput {
  playerId?: string;
  modeId?: GameModeId;
  targetSegment?: number;
}

export interface SessionResource extends SessionState {
  stats: {
    accuracyPercent: number;
    visitSuccessRate: number;
    averageScorePerVisit: number;
  };
}

export class NotFoundError extends Error {}

export class SessionService {
  constructor(private readonly db: DatabaseClient) {}

  private now() {
    return new Date().toISOString();
  }

  private hydrateSessionResource(session: SessionState): SessionResource {
    return {
      ...session,
      stats: {
        accuracyPercent: getAccuracyPercent(session),
        visitSuccessRate: getVisitSuccessRate(session),
        averageScorePerVisit: getAverageScorePerVisit(session),
      },
    };
  }

  private getExistingSession(sessionId: string) {
    const session = this.db.getSession(sessionId);

    if (!session) {
      throw new NotFoundError(`Session ${sessionId} was not found.`);
    }

    return session;
  }

  private getOrCreatePlayer(playerId: string | undefined, createdAt: string): Player {
    if (!playerId) {
      return this.db.createAnonymousPlayer(createdAt);
    }

    const player = this.db.getPlayer(playerId);

    if (!player) {
      throw new NotFoundError(`Player ${playerId} was not found.`);
    }

    return player;
  }

  createSession(input: CreateSessionInput = {}) {
    const now = this.now();
    const player = this.getOrCreatePlayer(input.playerId, now);
    const modeId = input.modeId ?? "standard";
    const targetSegment = input.targetSegment ?? DEFAULT_TARGET_SEGMENT;
    const session = createInitialSessionState(randomUUID(), player.id, modeId, targetSegment, now);

    this.db.createSession(session);

    return {
      player,
      session: this.hydrateSessionResource(session),
    };
  }

  getSession(sessionId: string) {
    return this.hydrateSessionResource(this.getExistingSession(sessionId));
  }

  listPlayerSessions(playerId: string): SessionSummary[] {
    const player = this.db.getPlayer(playerId);

    if (!player) {
      throw new NotFoundError(`Player ${playerId} was not found.`);
    }

    return this.db.listPlayerSessions(playerId);
  }

  addDart(sessionId: string, dart: DartResult) {
    const now = this.now();
    const session = this.getExistingSession(sessionId);
    const nextSession = dart === "MISS" ? completeVisitWithDart(session, "MISS") : addDartToSession(session, dart);
    const completedVisit = nextSession.visitsPlayed > session.visitsPlayed ? nextSession.history[0] : null;
    const persisted: SessionState = {
      ...nextSession,
      updatedAt: now,
      completedAt: nextSession.status === "completed" ? now : null,
    };

    if (completedVisit) {
      this.db.insertVisit(sessionId, completedVisit, now);
    }

    this.db.updateSession(persisted);

    return this.hydrateSessionResource(persisted);
  }

  advanceSession(sessionId: string) {
    const now = this.now();
    const session = this.getExistingSession(sessionId);
    const nextSession = completeVisitWithDart(session, "OTHER");
    const completedVisit = nextSession.visitsPlayed > session.visitsPlayed ? nextSession.history[0] : null;
    const persisted: SessionState = {
      ...nextSession,
      updatedAt: now,
      completedAt: nextSession.status === "completed" ? now : null,
    };

    if (completedVisit) {
      this.db.insertVisit(sessionId, completedVisit, now);
    }

    this.db.updateSession(persisted);

    return this.hydrateSessionResource(persisted);
  }

  undoSession(sessionId: string) {
    const now = this.now();
    const session = this.getExistingSession(sessionId);

    if (session.currentVisit.length > 0) {
      const persisted: SessionState = {
        ...removePendingDart(session),
        updatedAt: now,
      };

      this.db.updateSession(persisted);
      return this.hydrateSessionResource(persisted);
    }

    if (session.visitsPlayed === 0) {
      return this.hydrateSessionResource(session);
    }

    this.db.deleteLastVisit(sessionId);

    const rebuilt = replaySessionState(
      {
        ...session,
        history: [],
        currentVisit: [],
      },
      this.db.listAllVisits(sessionId),
      now,
    );

    this.db.updateSession(rebuilt);

    return this.hydrateSessionResource({
      ...rebuilt,
      history: this.db.listRecentVisits(sessionId),
    });
  }

  resetSession(sessionId: string) {
    const session = this.getExistingSession(sessionId);
    const now = this.now();
    const reset = resetSessionState(session, now);

    this.db.clearVisits(sessionId);
    this.db.updateSession(reset);

    return this.hydrateSessionResource(reset);
  }

  isValidMode(modeId: string): modeId is GameModeId {
    return modeId in gameModes;
  }
}
