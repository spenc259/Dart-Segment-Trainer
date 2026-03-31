export type DartResult = "S20" | "D20" | "T20" | "OTHER" | "MISS";

export type GameModeId = "standard" | "strict" | "precision" | "endurance";

export interface GameMode {
  id: GameModeId;
  name: string;
  description: string;
  successLabel: string;
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

export interface SessionStats {
  score: number;
  streak: number;
  bestStreak: number;
  visitsPlayed: number;
  totalDarts: number;
  totalQualifyingHits: number;
  successfulVisits: number;
  history: ScoredVisit[];
  currentVisit: DartResult[];
  modeId: GameModeId;
  personalBestStreak: number;
}
