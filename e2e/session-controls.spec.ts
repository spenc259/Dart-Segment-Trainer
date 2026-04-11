import { expect, test } from "@playwright/test";
import {
  enterDarts,
  expectSummaryValue,
  getStoredSession,
  gotoApp,
  historyItem,
  startPractice,
} from "./helpers";

test("advance fills the visit and undo removes the latest in-progress dart", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Standard" });

  await enterDarts(page, ["Single", "Double"]);
  await expect(page.getByText("2/3")).toBeVisible();

  await page.getByRole("button", { name: "Undo last dart or visit" }).click();
  await expect(page.getByText("1/3")).toBeVisible();

  await page.getByRole("button", { name: /^Advance\b/i }).click();

  await expect(page.getByText("0/3")).toBeVisible();
  await expect(historyItem(page, 0)).toContainText("S20 / Other / Other");
  await expectSummaryValue(page, "Score", 0);
  await expectSummaryValue(page, "Turn", 2);
});

test("undo after a completed visit rebuilds score, streak, and history", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Standard" });

  await enterDarts(page, ["Single", "Single", "Single"]);
  await enterDarts(page, ["Single", "Single", "Advance"]);

  await expectSummaryValue(page, "Score", 4);
  await expectSummaryValue(page, "Streak", 2);
  await expectSummaryValue(page, "Best", 2);

  await page.getByRole("button", { name: "Undo last dart or visit" }).click();

  await expectSummaryValue(page, "Score", 3);
  await expectSummaryValue(page, "Streak", 1);
  await expectSummaryValue(page, "Best", 1);
  await expectSummaryValue(page, "Turn", 2);
  await expect(historyItem(page, 0)).toContainText("Visit 1");
  await expect(page.locator(".history-item")).toHaveCount(1);
});

test("reset restarts the segment while preserving the personal best in storage", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Standard", segment: 17 });

  await enterDarts(page, ["Single", "Single", "Advance"]);
  await page.getByRole("button", { name: "Reset game" }).click();

  await expect(page.getByRole("heading", { name: "Standard on 17" })).toBeVisible();
  await expectSummaryValue(page, "Score", 0);
  await expectSummaryValue(page, "Streak", 0);
  await expectSummaryValue(page, "Turn", 1);

  const session = await getStoredSession(page);
  expect(session.targetSegment).toBe(17);
  expect(session.visitsPlayed).toBe(0);
  expect(session.personalBestStreak).toBe(1);
});

test("new session returns to intro with a fresh persisted session", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Strict", segment: 15 });

  await enterDarts(page, ["Single"]);
  await page.getByRole("button", { name: "Start a new session" }).click();

  await expect(page.getByRole("heading", { name: "Lock in a cleaner darts session." })).toBeVisible();
  await expect(page.getByText("Current target: 15")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Strict\b/i })).toHaveAttribute("aria-pressed", "true");

  const session = await getStoredSession(page);
  expect(session.modeId).toBe("strict");
  expect(session.targetSegment).toBe(15);
  expect(session.score).toBe(0);
  expect(session.visitsPlayed).toBe(0);
  expect(session.currentVisit).toEqual([]);
});
