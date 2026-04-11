import { expect, test } from "@playwright/test";
import {
  buildSession,
  buildVisit,
  enterDarts,
  expectSummaryValue,
  gotoApp,
  historyItem,
  resultStat,
  setStoredSession,
  startPractice,
} from "./helpers";

test("covers the standard journey from intro to results with core scoring checks", async ({ page }) => {
  await gotoApp(page);

  await expect(page.getByRole("heading", { name: "Lock in a cleaner darts session." })).toBeVisible();
  await startPractice(page, { mode: "Standard", segment: 19 });

  await enterDarts(page, ["Single", "Single", "Advance"]);
  await enterDarts(page, ["Treble", "Double", "Single"]);
  await enterDarts(page, ["Single", "Single", "Single"]);

  await expectSummaryValue(page, "Score", 8);
  await expectSummaryValue(page, "Streak", 3);
  await expectSummaryValue(page, "Best", 3);
  await expectSummaryValue(page, "Turn", 4);

  await expect(historyItem(page, 0)).toContainText("Visit 3");
  await expect(historyItem(page, 0)).toContainText("S19 / S19 / S19");
  await expect(historyItem(page, 0)).toContainText("+4");
  await expect(historyItem(page, 1)).toContainText("Visit 2");
  await expect(historyItem(page, 1)).toContainText("T19 / D19 / S19");
  await expect(historyItem(page, 1)).toContainText("+3");

  await setStoredSession(
    page,
    buildSession({
      score: 9,
      streak: 2,
      bestStreak: 4,
      visitsPlayed: 29,
      totalDarts: 87,
      totalQualifyingHits: 58,
      successfulVisits: 20,
      history: [
        buildVisit(29, ["S", "S", "OTHER"], {
          qualifyingHits: 2,
          success: true,
          perfect: false,
          pointsEarned: 1,
          streakAfterVisit: 2,
          note: "Streak alive. Stay smooth.",
        }),
      ],
      modeId: "standard",
      targetSegment: 19,
      personalBestStreak: 4,
    }),
  );

  await page.reload();
  await expect(page.getByRole("heading", { name: "Standard on 19" })).toBeVisible();

  await enterDarts(page, ["Single", "Treble", "Advance"]);

  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
  await expect(page.getByText("You completed 30 visits on segment 19.")).toBeVisible();

  await expect(resultStat(page, "Final score")).toContainText("11");
  await expect(resultStat(page, "Accuracy")).toContainText("67%");
  await expect(resultStat(page, "Visit success")).toContainText("70%");
  await expect(resultStat(page, "Average score")).toContainText("0.37");
  await expect(resultStat(page, "Hits landed")).toContainText("60");
  await expect(resultStat(page, "Best streak")).toContainText("4");
  await expect(resultStat(page, "Personal best")).toContainText("4");
  await expect(resultStat(page, "Completed visits")).toContainText("30");
});
