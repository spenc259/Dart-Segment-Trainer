import { expect, test } from "@playwright/test";
import { enterDarts, expectSummaryValue, gotoApp, historyItem, startPractice } from "./helpers";

test("strict mode treats doubles as off target for scoring", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Strict" });

  await enterDarts(page, ["Double", "Single", "Advance"]);

  await expectSummaryValue(page, "Score", 0);
  await expectSummaryValue(page, "Streak", 0);
  await expectSummaryValue(page, "Turn", 2);
  await expect(historyItem(page, 0)).toContainText("D20 / S20 / Other");
  await expect(historyItem(page, 0)).toContainText("Reset and refocus.");
});

test("precision mode requires a treble plus another hit to score", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Precision", segment: 18 });

  await enterDarts(page, ["Single", "Single", "Advance"]);
  await enterDarts(page, ["Treble", "Single", "Advance"]);

  await expectSummaryValue(page, "Score", 1);
  await expectSummaryValue(page, "Streak", 1);
  await expectSummaryValue(page, "Best", 1);
  await expectSummaryValue(page, "Turn", 3);
  await expect(historyItem(page, 0)).toContainText("T18 / S18 / Other");
  await expect(historyItem(page, 0)).toContainText("+1");
  await expect(historyItem(page, 1)).toContainText("S18 / S18 / Other");
  await expect(historyItem(page, 1)).toContainText("Reset and refocus.");
});

test("endurance mode ends the run immediately when a miss is recorded", async ({ page }) => {
  await gotoApp(page);
  await startPractice(page, { mode: "Endurance" });

  await enterDarts(page, ["Single", "Miss"]);

  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
  await expect(page.getByText("A miss ended this endurance block. Restart the segment or choose a different number.")).toBeVisible();
  await expect(page.getByLabel("Session stats")).toContainText("Completed visits1");
});
