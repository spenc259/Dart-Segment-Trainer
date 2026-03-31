import { gameModes } from "./gameModes";
import type { DartResult, GameModeId, ScoredVisit, SessionStats } from "../types/game";

export const STORAGE_KEY = "twenty-lock-session-v1";
export const DEFAULT_MAX_VISITS = 30;

export const createInitialSession = (modeId: GameModeId = "standard"): SessionStats => ({
  score: 0,
  streak: 0,
  bestStreak: 0,
  visitsPlayed: 0,
  totalDarts: 0,
  totalQualifyingHits: 0,
  successfulVisits: 0,
  history: [],
  currentVisit: [],
  modeId,
  personalBestStreak: 0,
});

export const getVisitFeedback = (visit: ScoredVisit) => {
  if (visit.perfect && visit.streakAfterVisit >= 3) return "Hot hand. Keep that lane.";
  if (visit.perfect) return "Clean grouping. Excellent visit.";
  if (visit.success && visit.streakAfterVisit >= 2) return "Streak alive. Stay smooth.";
  if (visit.success) return "Good grouping. Build on it.";
  return "Reset and refocus.";
};

export const getSessionVisitLimit = (session: SessionStats) => {
  const mode = gameModes[session.modeId];
  return mode.fixedVisits ?? DEFAULT_MAX_VISITS;
};

export const isSessionComplete = (session: SessionStats) => {
  const mode = gameModes[session.modeId];

  if (session.visitsPlayed >= getSessionVisitLimit(session)) {
    return true;
  }

  return Boolean(mode.endsOnMiss && session.history.some((visit) => visit.darts.includes("MISS")));
};

const getStreakBonus = (streakAfterVisit: number) => {
  if (streakAfterVisit > 0 && streakAfterVisit % 3 === 0) return 1;
  return 0;
};

export const scoreVisit = (session: SessionStats, darts: DartResult[]): SessionStats => {
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

  const visit: ScoredVisit = {
    visitNumber: session.visitsPlayed + 1,
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

  return {
    ...session,
    score: session.score + pointsEarned,
    streak: nextStreak,
    bestStreak,
    visitsPlayed: session.visitsPlayed + 1,
    totalDarts: session.totalDarts + darts.length,
    totalQualifyingHits: session.totalQualifyingHits + qualifyingHits,
    successfulVisits: session.successfulVisits + (success ? 1 : 0),
    history: [visit, ...session.history].slice(0, 8),
    currentVisit: [],
    personalBestStreak,
  };
};

export const addDartToSession = (session: SessionStats, dart: DartResult): SessionStats => {
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

export const completeVisitWithDart = (session: SessionStats, dart: DartResult): SessionStats => {
  if (isSessionComplete(session)) {
    return session;
  }

  const remainingDarts = Math.max(0, 3 - session.currentVisit.length);

  if (remainingDarts === 0) {
    return session;
  }

  const completedVisit = [
    ...session.currentVisit,
    ...Array.from({ length: remainingDarts }, () => dart),
  ];

  return scoreVisit(session, completedVisit);
};

export const undoLastDartOrVisit = (session: SessionStats): SessionStats => {
  if (session.currentVisit.length > 0) {
    return {
      ...session,
      currentVisit: session.currentVisit.slice(0, -1),
    };
  }

  const [lastVisit, ...remainingHistory] = session.history;
  if (!lastVisit) return session;

  const previous = createInitialSession(session.modeId);
  previous.personalBestStreak = session.personalBestStreak;

  const chronological = [...remainingHistory].reverse();
  const rebuilt = chronological.reduce<SessionStats>((state, visit) => {
    const rescored = scoreVisit(state, visit.darts);
    return {
      ...rescored,
      history: [visit, ...rescored.history.slice(1)],
    };
  }, previous);

  return {
    ...rebuilt,
    history: remainingHistory,
  };
};

export const switchMode = (session: SessionStats, modeId: GameModeId): SessionStats => {
  return {
    ...createInitialSession(modeId),
    personalBestStreak: session.personalBestStreak,
  };
};

export const hydrateSession = (value: string | null): SessionStats => {
  if (!value) return createInitialSession();

  try {
    const parsed = JSON.parse(value) as Partial<SessionStats>;
    const modeId = parsed.modeId && parsed.modeId in gameModes ? parsed.modeId : "standard";

    return {
      ...createInitialSession(modeId),
      ...parsed,
      modeId,
      currentVisit: parsed.currentVisit ?? [],
      history: parsed.history ?? [],
      personalBestStreak: parsed.personalBestStreak ?? parsed.bestStreak ?? 0,
    };
  } catch {
    return createInitialSession();
  }
};

export const saveSession = (session: SessionStats) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const getAccuracyPercent = (session: SessionStats) => {
  if (session.totalDarts === 0) return 0;
  return Math.round((session.totalQualifyingHits / session.totalDarts) * 100);
};

export const getVisitSuccessRate = (session: SessionStats) => {
  if (session.visitsPlayed === 0) return 0;
  return Math.round((session.successfulVisits / session.visitsPlayed) * 100);
};

export const getAverageScorePerVisit = (session: SessionStats) => {
  if (session.visitsPlayed === 0) return 0;
  return Number((session.score / session.visitsPlayed).toFixed(2));
};
