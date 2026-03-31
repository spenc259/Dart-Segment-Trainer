import type { DartResult, GameMode, GameModeId } from "../types/game";

const twentyHits: DartResult[] = ["S20", "D20", "T20"];
const strictHits: DartResult[] = ["S20", "T20"];

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
    description: "Only singles and trebles count. Doubles are treated as off target.",
    successLabel: "2x singles or trebles = success, 3x = big bonus",
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
    description: "A 10-visit focus block where any miss ends the run immediately.",
    successLabel: "Survive 10 visits without a miss",
    fixedVisits: 10,
    endsOnMiss: true,
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
