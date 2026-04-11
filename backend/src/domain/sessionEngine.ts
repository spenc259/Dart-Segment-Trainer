import { DEFAULT_TARGET_SEGMENT, gameModes, getVisitLimitForMode } from "./gameModes.js";
import type { DartResult, GameModeId, ScoredVisit, SessionState } from "./types.js";

const RECENT_HISTORY_LIMIT = 8;

const getVisitFeedback = (visit: ScoredVisit) => {
  if (visit.perfect && visit.streakAfterVisit >= 3) return "Hot hand. Keep that lane.";
  if (visit.perfect) return "Clean grouping. Excellent visit.";
  if (visit.success && visit.streakAfterVisit >= 2) return "Streak alive. Stay smooth.";
  if (visit.success) return "Good grouping. Build on it.";
  return "Reset and refocus.";
};

const getStreakBonus = (streakAfterVisit: number) => {
  if (streakAfterVisit > 0 && streakAfterVisit % 3 === 0) return 1;
  return 0;
};

export const createInitialSessionState = (
  sessionId: string,
  playerId: string,
  modeId: GameModeId = "standard",
  targetSegment = DEFAULT_TARGET_SEGMENT,
  now = new Date().toISOString(),
): SessionState => ({
  id: sessionId,
  playerId,
  status: "active",
  modeId,
  targetSegment,
  score: 0,
  streak: 0,
  bestStreak: 0,
  visitsPlayed: 0,
  totalDarts: 0,
  totalQualifyingHits: 0,
  successfulVisits: 0,
  history: [],
  currentVisit: [],
  personalBestStreak: 0,
  visitLimit: getVisitLimitForMode(modeId),
  endedByMiss: false,
  createdAt: now,
  updatedAt: now,
  completedAt: null,
});

export const isSessionComplete = (session: SessionState) => {
  if (session.status === "completed") {
    return true;
  }

  if (session.endedByMiss) {
    return true;
  }

  return session.visitsPlayed >= session.visitLimit;
};

export const scoreVisit = (session: SessionState, darts: DartResult[]): SessionState => {
  if (isSessionComplete(session)) {
    return session;
  }

  const mode = gameModes[session.modeId];
  const qualifyingHits = mode.getQualifyingHits(darts);
  const success = mode.isSuccess(darts);
  const perfect = mode.isPerfect(darts);
  const nextStreak = success ? session.streak + 1 : 0;
  const basePoints = success ? (perfect ? 3 : 1) : 0;
  const streakBonus = success ? getStreakBonus(nextStreak) : 0;
  const pointsEarned = basePoints + streakBonus;
  const visitNumber = session.visitsPlayed + 1;
  const endedByMiss = Boolean(mode.endsOnMiss && darts.includes("MISS"));

  const visit: ScoredVisit = {
    visitNumber,
    darts,
    qualifyingHits,
    success,
    perfect,
    pointsEarned,
    streakAfterVisit: nextStreak,
    note: "",
  };

  visit.note = getVisitFeedback(visit);

  const bestStreak = Math.max(session.bestStreak, nextStreak);
  const personalBestStreak = Math.max(session.personalBestStreak, bestStreak);
  const visitsPlayed = visitNumber;
  const shouldComplete = endedByMiss || visitsPlayed >= session.visitLimit;

  return {
    ...session,
    status: shouldComplete ? "completed" : "active",
    score: session.score + pointsEarned,
    streak: nextStreak,
    bestStreak,
    visitsPlayed,
    totalDarts: session.totalDarts + darts.length,
    totalQualifyingHits: session.totalQualifyingHits + qualifyingHits,
    successfulVisits: session.successfulVisits + (success ? 1 : 0),
    history: [visit, ...session.history].slice(0, RECENT_HISTORY_LIMIT),
    currentVisit: [],
    personalBestStreak,
    endedByMiss,
  };
};

export const addDartToSession = (session: SessionState, dart: DartResult): SessionState => {
  if (isSessionComplete(session)) {
    return session;
  }

  const nextVisit = [...session.currentVisit, dart];

  if (nextVisit.length < 3) {
    return {
      ...session,
      currentVisit: nextVisit,
    };
  }

  return scoreVisit(session, nextVisit);
};

export const completeVisitWithDart = (session: SessionState, dart: DartResult): SessionState => {
  if (isSessionComplete(session)) {
    return session;
  }

  const remainingDarts = Math.max(0, 3 - session.currentVisit.length);

  if (remainingDarts === 0) {
    return session;
  }

  const completedVisit = [...session.currentVisit, ...Array.from({ length: remainingDarts }, () => dart)];

  return scoreVisit(session, completedVisit);
};

export const removePendingDart = (session: SessionState): SessionState => {
  if (session.currentVisit.length === 0) {
    return session;
  }

  return {
    ...session,
    currentVisit: session.currentVisit.slice(0, -1),
  };
};

export const resetSessionState = (session: SessionState, now = new Date().toISOString()): SessionState => ({
  ...createInitialSessionState(session.id, session.playerId, session.modeId, session.targetSegment, session.createdAt),
  personalBestStreak: session.personalBestStreak,
  updatedAt: now,
});

export const replaySessionState = (
  baseSession: SessionState,
  visits: ScoredVisit[],
  now = new Date().toISOString(),
): SessionState => {
  const replayed = visits.reduce<SessionState>(
    (state, visit) => scoreVisit(state, visit.darts),
    {
      ...createInitialSessionState(
        baseSession.id,
        baseSession.playerId,
        baseSession.modeId,
        baseSession.targetSegment,
        baseSession.createdAt,
      ),
      personalBestStreak: baseSession.personalBestStreak,
      createdAt: baseSession.createdAt,
    },
  );

  return {
    ...replayed,
    personalBestStreak: Math.max(baseSession.personalBestStreak, replayed.personalBestStreak),
    updatedAt: now,
    completedAt: replayed.status === "completed" ? now : null,
  };
};

export const getAccuracyPercent = (session: SessionState) => {
  if (session.totalDarts === 0) return 0;
  return Math.round((session.totalQualifyingHits / session.totalDarts) * 100);
};

export const getVisitSuccessRate = (session: SessionState) => {
  if (session.visitsPlayed === 0) return 0;
  return Math.round((session.successfulVisits / session.visitsPlayed) * 100);
};

export const getAverageScorePerVisit = (session: SessionState) => {
  if (session.visitsPlayed === 0) return 0;
  return Number((session.score / session.visitsPlayed).toFixed(2));
};
