export type DartResult = "S" | "D" | "T" | "OTHER" | "MISS";

export type GameModeId = "standard" | "strict" | "precision" | "endurance";

export type SessionStatus = "active" | "completed";

export interface GameMode {
  id: GameModeId;
  name: string;
  description: (segment: number) => string;
  successLabel: (segment: number) => string;
  fixedVisits?: number;
  endsOnMiss?: boolean;
  getQualifyingHits: (darts: DartResult[]) => number;
  isSuccess: (darts: DartResult[]) => boolean;
  isPerfect: (darts: DartResult[]) => boolean;
}

export interface ScoredVisit {
  visitNumber: number;
  darts: DartResult[];
  qualifyingHits: number;
  success: boolean;
  perfect: boolean;
  pointsEarned: number;
  streakAfterVisit: number;
  note: string;
}

export interface SessionState {
  id: string;
  playerId: string;
  status: SessionStatus;
  modeId: GameModeId;
  targetSegment: number;
  score: number;
  streak: number;
  bestStreak: number;
  visitsPlayed: number;
  totalDarts: number;
  totalQualifyingHits: number;
  successfulVisits: number;
  history: ScoredVisit[];
  currentVisit: DartResult[];
  personalBestStreak: number;
  visitLimit: number;
  endedByMiss: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Player {
  id: string;
  kind: "anonymous";
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  playerId: string;
  status: SessionStatus;
  modeId: GameModeId;
  targetSegment: number;
  score: number;
  visitsPlayed: number;
  bestStreak: number;
  updatedAt: string;
  completedAt: string | null;
}
