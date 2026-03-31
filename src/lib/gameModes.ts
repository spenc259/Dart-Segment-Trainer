import type { DartResult, GameMode, GameModeId } from "../types/game";

export const DEFAULT_TARGET_SEGMENT = 20;
export const targetSegmentOptions = Array.from({ length: 20 }, (_, index) => index + 1);

const targetHits: DartResult[] = ["S", "D", "T"];
const strictHits: DartResult[] = ["S", "T"];

const countHits = (darts: DartResult[], allowed: DartResult[]) =>
  darts.filter((dart) => allowed.includes(dart)).length;

const hasTreble = (darts: DartResult[]) => darts.includes("T");

export const formatDartResult = (dart: DartResult, segment: number) => {
  switch (dart) {
    case "S":
    case "D":
    case "T":
      return `${dart}${segment}`;
    case "OTHER":
      return "Other";
    case "MISS":
      return "Miss";
    default:
      return dart;
  }
};

export const gameModes: Record<GameModeId, GameMode> = {
  standard: {
    id: "standard",
    name: "Standard",
    description: (segment) => `Any ${segment} bed counts. Build rhythm through grouped ${segment}s.`,
    successLabel: (segment) => `2x ${segment}s = success, 3x ${segment}s = bonus`,
    getQualifyingHits: (darts) => countHits(darts, targetHits),
    isSuccess: (darts) => countHits(darts, targetHits) >= 2,
    isPerfect: (darts) => countHits(darts, targetHits) === 3,
  },
  strict: {
    id: "strict",
    name: "Strict",
    description: (segment) =>
      `Only singles and trebles on ${segment} count. Doubles are treated as off target.`,
    successLabel: (segment) => `2x singles or trebles on ${segment} = success, 3x = big bonus`,
    getQualifyingHits: (darts) => countHits(darts, strictHits),
    isSuccess: (darts) => countHits(darts, strictHits) >= 2,
    isPerfect: (darts) => countHits(darts, strictHits) === 3,
  },
  precision: {
    id: "precision",
    name: "Precision",
    description: (segment) => `Need at least one T${segment} plus another ${segment} hit to score.`,
    successLabel: (segment) => `T${segment} + another ${segment} hit = success`,
    getQualifyingHits: (darts) => countHits(darts, targetHits),
    isSuccess: (darts) => countHits(darts, targetHits) >= 2 && hasTreble(darts),
    isPerfect: (darts) => countHits(darts, targetHits) === 3 && hasTreble(darts),
  },
  endurance: {
    id: "endurance",
    name: "Endurance",
    description: (segment) =>
      `A 10-visit focus block on ${segment} where any miss ends the run immediately.`,
    successLabel: () => "Survive 10 visits without a miss",
    fixedVisits: 10,
    endsOnMiss: true,
    getQualifyingHits: (darts) => countHits(darts, targetHits),
    isSuccess: (darts) => countHits(darts, targetHits) >= 2,
    isPerfect: (darts) => countHits(darts, targetHits) === 3,
  },
};

export const getDartButtons = (segment: number) => [
  { value: "S" as const, label: "Single", hint: `Single ${segment}` },
  { value: "D" as const, label: "Double", hint: `Double ${segment}` },
  { value: "T" as const, label: "Treble", hint: `Treble ${segment}` },
  { value: "OTHER" as const, label: "Other", hint: `Any non-${segment} hit` },
  { value: "MISS" as const, label: "Miss", hint: "Missed board or no score" },
];
