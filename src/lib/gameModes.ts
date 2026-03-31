import type { DartResult, GameMode, GameModeId } from "../types/game";

const twentyHits: DartResult[] = ["S20", "D20", "T20"];
const strictHits: DartResult[] = ["D20", "T20"];

const countHits = (darts: DartResult[], allowed: DartResult[]) =>
  darts.filter((dart) => allowed.includes(dart)).length;

const hasTreble = (darts: DartResult[]) => darts.includes("T20");

export const gameModes: Record<GameModeId, GameMode> = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Any 20 bed counts. Build rhythm through grouped 20s.",
    successLabel: "2x 20s = success, 3x 20s = bonus",
    getQualifyingHits: (darts) => countHits(darts, twentyHits),
    isSuccess: (darts) => countHits(darts, twentyHits) >= 2,
    isPerfect: (darts) => countHits(darts, twentyHits) === 3,
  },
  strict: {
    id: "strict",
    name: "Strict",
    description: "Only D20 and T20 count. Punishes loose singles.",
    successLabel: "2x power hits = success, 3x = big bonus",
    getQualifyingHits: (darts) => countHits(darts, strictHits),
    isSuccess: (darts) => countHits(darts, strictHits) >= 2,
    isPerfect: (darts) => countHits(darts, strictHits) === 3,
  },
  precision: {
    id: "precision",
    name: "Precision",
    description: "Need at least one T20 plus another 20 hit to score.",
    successLabel: "T20 + another 20 = success",
    getQualifyingHits: (darts) => countHits(darts, twentyHits),
    isSuccess: (darts) => countHits(darts, twentyHits) >= 2 && hasTreble(darts),
    isPerfect: (darts) => countHits(darts, twentyHits) === 3 && hasTreble(darts),
  },
  endurance: {
    id: "endurance",
    name: "Endurance",
    description: "A 12-visit focus block with best streak tracking.",
    successLabel: "12 visits, stack streaks and finish strong",
    fixedVisits: 12,
    getQualifyingHits: (darts) => countHits(darts, twentyHits),
    isSuccess: (darts) => countHits(darts, twentyHits) >= 2,
    isPerfect: (darts) => countHits(darts, twentyHits) === 3,
  },
};

export const dartButtons: { value: DartResult; label: string; hint: string }[] = [
  { value: "S20", label: "Single", hint: "Single 20" },
  { value: "D20", label: "Double", hint: "Double 20" },
  { value: "T20", label: "Treble", hint: "Treble 20" },
  { value: "OTHER", label: "Other", hint: "Any non-20 hit" },
  { value: "MISS", label: "Miss", hint: "Missed board or no score" },
];
