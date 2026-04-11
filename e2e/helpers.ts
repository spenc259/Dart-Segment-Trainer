import { expect, type Locator, type Page } from "@playwright/test";

export type StoredDart = "S" | "D" | "T" | "OTHER" | "MISS";
export type ThemePreference = "dark" | "light" | "device";
export type ModeName = "Standard" | "Strict" | "Precision" | "Endurance";
export type DartButtonName = "Single" | "Double" | "Treble" | "Miss" | "Advance";

export interface StoredVisit {
  visitNumber: number;
  darts: StoredDart[];
  qualifyingHits: number;
  success: boolean;
  perfect: boolean;
  pointsEarned: number;
  streakAfterVisit: number;
  note: string;
}

export interface StoredSession {
  score: number;
  streak: number;
  bestStreak: number;
  visitsPlayed: number;
  totalDarts: number;
  totalQualifyingHits: number;
  successfulVisits: number;
  history: StoredVisit[];
  currentVisit: StoredDart[];
  modeId: "standard" | "strict" | "precision" | "endurance";
  targetSegment: number;
  personalBestStreak: number;
}

const STORAGE_KEY = "twenty-lock-session-v1";
const THEME_STORAGE_KEY = "twenty-lock-theme-v1";

export const buildSession = (overrides: Partial<StoredSession> = {}): StoredSession => ({
  score: 0,
  streak: 0,
  bestStreak: 0,
  visitsPlayed: 0,
  totalDarts: 0,
  totalQualifyingHits: 0,
  successfulVisits: 0,
  history: [],
  currentVisit: [],
  modeId: "standard",
  targetSegment: 20,
  personalBestStreak: 0,
  ...overrides,
});

export const buildVisit = (
  visitNumber: number,
  darts: StoredDart[],
  overrides: Partial<StoredVisit> = {},
): StoredVisit => ({
  visitNumber,
  darts,
  qualifyingHits: 0,
  success: false,
  perfect: false,
  pointsEarned: 0,
  streakAfterVisit: 0,
  note: "",
  ...overrides,
});

export const gotoApp = async (
  page: Page,
  options: { session?: StoredSession; theme?: ThemePreference } = {},
) => {
  await page.addInitScript(
    ({ session, theme, storageKey, themeStorageKey }) => {
      if (window.sessionStorage.getItem("__pw_storage_seeded") === "true") {
        return;
      }

      window.localStorage.clear();
      window.sessionStorage.setItem("__pw_storage_seeded", "true");

      if (session) {
        window.localStorage.setItem(storageKey, JSON.stringify(session));
      }

      if (theme) {
        window.localStorage.setItem(themeStorageKey, theme);
      }
    },
    {
      session: options.session,
      theme: options.theme,
      storageKey: STORAGE_KEY,
      themeStorageKey: THEME_STORAGE_KEY,
    },
  );

  await page.goto("/");
};

export const setStoredSession = async (page: Page, session: StoredSession) => {
  await page.evaluate(
    ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    },
    { storageKey: STORAGE_KEY, value: session },
  );
};

export const getStoredSession = async (page: Page): Promise<StoredSession> => {
  return page.evaluate((storageKey) => {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      throw new Error("Expected a stored session but none was found.");
    }

    return JSON.parse(stored) as StoredSession;
  }, STORAGE_KEY);
};

export const getStoredThemePreference = async (page: Page): Promise<string | null> => {
  return page.evaluate((themeStorageKey) => window.localStorage.getItem(themeStorageKey), THEME_STORAGE_KEY);
};

export const startPractice = async (
  page: Page,
  options: { mode?: ModeName; segment?: number } = {},
) => {
  const mode = options.mode ?? "Standard";
  const segment = options.segment ?? 20;

  if (mode !== "Standard") {
    await page.getByRole("button", { name: new RegExp(`^${mode}\\b`, "i") }).click();
  }

  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByRole("heading", { name: "Choose the segment for this block." })).toBeVisible();

  if (segment !== 20) {
    await page.getByLabel("Target segment").selectOption(String(segment));
  }

  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`${mode} on ${segment}`, "i") })).toBeVisible();
};

export const enterDarts = async (page: Page, darts: DartButtonName[]) => {
  for (const dart of darts) {
    await page.getByRole("button", { name: new RegExp(`^${dart}\\b`, "i") }).click();
  }
};

export const expectSummaryValue = async (page: Page, label: string, value: string | number) => {
  await expect(page.locator(".summary-item", { hasText: label })).toContainText(String(value));
};

export const resultStat = (page: Page, label: string): Locator => {
  return page.locator(".mini-stat").filter({ has: page.getByText(label, { exact: true }) });
};

export const historyItem = (page: Page, index = 0): Locator => {
  return page.locator(".history-item").nth(index);
};
