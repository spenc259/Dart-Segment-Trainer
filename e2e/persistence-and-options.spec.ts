import { expect, test } from "@playwright/test";
import {
  buildSession,
  enterDarts,
  expectPlayStage,
  getStoredSession,
  getStoredThemePreference,
  gotoApp,
  startPractice,
} from "./helpers";

test("reloading preserves an in-progress practice session and returns to the play stage", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Standard" });

  await enterDarts(page, ["Single"]);
  await page.reload();

  await expectPlayStage(page, { mode: "Standard", segment: 20 });
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(page.getByText("S20")).toBeVisible();
});

test("options dialog opens, closes, and persists the chosen theme", async ({ page }) => {
  await gotoApp(page);

  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByRole("dialog", { name: "Session settings" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Session settings" })).toBeHidden();

  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
  expect(await getStoredThemePreference(page)).toBe("light");

  await page.reload();
  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");

  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
});

test("restart segment from results returns to practice with preserved personal best", async ({ page }) => {
  await gotoApp(
    page,
    {
      session: buildSession({
        score: 12,
        streak: 0,
        bestStreak: 3,
        visitsPlayed: 30,
        totalDarts: 90,
        totalQualifyingHits: 55,
        successfulVisits: 18,
        modeId: "standard",
        targetSegment: 14,
        personalBestStreak: 5,
      }),
    },
  );

  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
  await page.getByRole("button", { name: "Restart segment" }).click();

  await expectPlayStage(page, { mode: "Standard", segment: 14 });

  const session = await getStoredSession(page);
  expect(session.visitsPlayed).toBe(0);
  expect(session.targetSegment).toBe(14);
  expect(session.personalBestStreak).toBe(5);
});

test("pick another from results returns to segment selection", async ({ page }) => {
  await gotoApp(
    page,
    {
      session: buildSession({
        visitsPlayed: 30,
        modeId: "precision",
        targetSegment: 12,
        personalBestStreak: 2,
      }),
    },
  );

  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
  await page.getByRole("button", { name: "Edit setup" }).click();

  await expect(page.getByRole("heading", { name: "Choose the drill and segment for this block." })).toBeVisible();
  await expect(page.getByLabel("Target segment")).toHaveValue("12");
});

test("change mode from results returns to the intro stage", async ({ page }) => {
  await gotoApp(
    page,
    {
      session: buildSession({
        visitsPlayed: 30,
        modeId: "endurance",
        targetSegment: 20,
      }),
    },
  );

  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
  await page.getByRole("button", { name: "Back to intro" }).click();

  await expect(page.getByRole("heading", { name: "Lock in a cleaner darts session." })).toBeVisible();
  await page.getByRole("button", { name: "Set up session" }).click();
  await expect(page.getByRole("button", { name: /^Endurance\b/i })).toHaveAttribute("aria-pressed", "true");
});
