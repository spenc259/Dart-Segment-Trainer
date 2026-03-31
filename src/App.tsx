import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { DartPad } from "./components/DartPad";
import { ModeSelector } from "./components/ModeSelector";
import { VisitHistory } from "./components/VisitHistory";
import {
  DEFAULT_MAX_VISITS,
  STORAGE_KEY,
  addDartToSession,
  completeVisitWithDart,
  createInitialSession,
  getAccuracyPercent,
  getAverageScorePerVisit,
  getSessionVisitLimit,
  getVisitSuccessRate,
  hydrateSession,
  isSessionComplete,
  saveSession,
  switchMode,
  undoLastDartOrVisit,
} from "./lib/gameEngine";
import type { DartResult, GameModeId, SessionStats } from "./types/game";
import { gameModes } from "./lib/gameModes";

const getRingStyle = (progress: number, color: string): CSSProperties => {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  return {
    background: `conic-gradient(${color} 0deg ${clampedProgress * 3.6}deg, rgba(173, 183, 194, 0.28) ${clampedProgress * 3.6}deg 360deg)`,
  };
};

const getVisitRingMeta = (dart?: DartResult) => {
  switch (dart) {
    case "T20":
      return { progress: 100, color: "#1fb36d" };
    case "D20":
      return { progress: 80, color: "#f4a11a" };
    case "S20":
      return { progress: 60, color: "#ef5b4d" };
    case "OTHER":
      return { progress: 28, color: "#4d95ff" };
    case "MISS":
      return { progress: 0, color: "#cbd4de" };
    default:
      return { progress: 0, color: "#d7dde5" };
  }
};

function App() {
  const [session, setSession] = useState<SessionStats>(() =>
    hydrateSession(window.localStorage.getItem(STORAGE_KEY)),
  );
  const [statsExpanded, setStatsExpanded] = useState(false);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const mode = gameModes[session.modeId];
  const visitLimit = getSessionVisitLimit(session);
  const currentVisitNumber = Math.min(session.visitsPlayed + 1, visitLimit);
  const accuracy = getAccuracyPercent(session);
  const successRate = getVisitSuccessRate(session);
  const averageScore = getAverageScorePerVisit(session);
  const drillComplete = isSessionComplete(session);
  const goalVisits = mode.fixedVisits ?? DEFAULT_MAX_VISITS;
  const sessionProgressValue = Math.min(session.visitsPlayed, goalVisits);
  const sessionProgress = Math.round((sessionProgressValue / goalVisits) * 100);
  const personalBestBase = Math.max(session.personalBestStreak, 4);
  const completionMessage = drillComplete
    ? `You've reached ${goalVisits} visits. Reset to start another block.`
    : undefined;

  const summaryCards = [
    {
      label: "Score",
      value: session.score,
      progress: Math.min(100, Math.round((session.score / Math.max(goalVisits * 2, 1)) * 100)),
      color: "#2c7df0",
    },
    {
      label: "Streak",
      value: session.streak,
      progress: Math.min(100, Math.round((session.streak / personalBestBase) * 100)),
      color: "#f4a11a",
    },
    {
      label: "Best",
      value: session.bestStreak,
      progress: Math.min(100, Math.round((session.bestStreak / personalBestBase) * 100)),
      color: "#1fb36d",
    },
    {
      label: "Turn",
      value: currentVisitNumber,
      progress: Math.min(100, Math.round((Math.min(currentVisitNumber, goalVisits) / goalVisits) * 100)),
      color: "#7d8df7",
    },
  ];

  const handleModeSelect = (modeId: GameModeId) => {
    setSession((current) => switchMode(current, modeId));
  };

  const handleDart = (dart: Parameters<typeof addDartToSession>[1]) => {
    setSession((current) =>
      dart === "MISS" ? completeVisitWithDart(current, "MISS") : addDartToSession(current, dart),
    );
  };

  const handleAdvance = () => {
    setSession((current) => completeVisitWithDart(current, "OTHER"));
  };

  const handleUndo = () => {
    setSession((current) => undoLastDartOrVisit(current));
  };

  const handleResetScore = () => {
    setSession((current) => ({
      ...createInitialSession(current.modeId),
      personalBestStreak: current.personalBestStreak,
    }));
  };

  const handleNewSession = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(createInitialSession(session.modeId));
  };

  return (
    <main className="app-shell">
      <header className="intro-panel intro-panel-plain">
        <div className="intro-copy">
          <p className="intro-description intro-description-strong">Find the segment consistently</p>
        </div>
      </header>

      <section className="card summary-bar" aria-label="Live stats">
        {summaryCards.map((card, index) => (
          <article key={card.label} className="summary-item">
            <p className="section-label summary-label">{card.label}</p>
            <div className="summary-ring" style={getRingStyle(card.progress, card.color)}>
              <div className="summary-ring-inner">
                <strong>{card.value}</strong>
              </div>
            </div>
            {index < summaryCards.length - 1 ? <span className="summary-divider" aria-hidden="true" /> : null}
          </article>
        ))}
      </section>

      <DartPad
        disabled={drillComplete}
        disabledMessage={completionMessage}
        onSelect={handleDart}
        onAdvance={handleAdvance}
      />

      <section className="visit-stage">
        <div className="visit-grid" aria-label="Current visit dart slots">
          {[0, 1, 2].map((index) => {
            const dart = session.currentVisit[index];
            const ringMeta = getVisitRingMeta(dart);

            return (
              <article key={index} className="visit-slot">
                <div className="progress-ring progress-ring-visit" style={getRingStyle(ringMeta.progress, ringMeta.color)}>
                  <div className="progress-ring-inner">
                    <strong>{dart ?? "--"}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card secondary-panel controls-panel">
        {drillComplete ? <p className="input-note">{completionMessage}</p> : null}

        <div className="action-row">
          <button
            type="button"
            className="utility-button primary"
            aria-label="Undo last dart or visit"
            onClick={handleUndo}
          >
            Undo
          </button>
          <button
            type="button"
            className="utility-button"
            aria-label="Reset game"
            onClick={handleResetScore}
          >
            {drillComplete ? "Reset to play again" : "Reset"}
          </button>
          <button
            type="button"
            className="utility-button"
            aria-label="Start a new session"
            onClick={handleNewSession}
          >
            New session
          </button>
        </div>
      </section>

      <section className="card progress-card progress-card-large">
        <div className="progress-ring progress-ring-large" style={getRingStyle(sessionProgress, "#2c7df0")}>
          <div className="progress-ring-inner">
            <strong>
              {sessionProgressValue}/{goalVisits}
            </strong>
            <span>Visits</span>
          </div>
        </div>

        <div className="progress-copy">
          <p className="section-label">Session progress</p>
          <h2>Overall progress</h2>
          <p className="progress-support">{sessionProgressValue}/{goalVisits} visits completed</p>
          <div className="progress-badge-row">
            <span className="streak-badge">Streak {session.streak}</span>
            <span className={`inline-badge ${drillComplete ? "done" : ""}`}>
              {drillComplete ? "Complete" : mode.name}
            </span>
          </div>
        </div>
      </section>

      <VisitHistory history={session.history} />

      <section className="card secondary-panel stats-panel">
        <div className="section-heading">
          <h2>Stats</h2>
          <button
            type="button"
            className="section-toggle"
            aria-expanded={statsExpanded}
            aria-controls="session-stats-grid"
            onClick={() => setStatsExpanded((current) => !current)}
          >
            {statsExpanded ? "Hide" : "Show"}
          </button>
        </div>

        {statsExpanded ? (
          <div id="session-stats-grid" className="mini-stats-grid" aria-label="Session stats">
            <article className="mini-stat">
              <span>Accuracy</span>
              <strong>{accuracy}%</strong>
            </article>
            <article className="mini-stat">
              <span>Visit success</span>
              <strong>{successRate}%</strong>
            </article>
            <article className="mini-stat">
              <span>Average score</span>
              <strong>{averageScore}</strong>
            </article>
            <article className="mini-stat">
              <span>Hits landed</span>
              <strong>{session.totalQualifyingHits}</strong>
            </article>
            <article className="mini-stat">
              <span>Personal best</span>
              <strong>{session.personalBestStreak}</strong>
            </article>
            <article className="mini-stat">
              <span>Mode target</span>
              <strong>{mode.successLabel}</strong>
            </article>
          </div>
        ) : null}
      </section>

      <section className="secondary-grid">
        <section className="card secondary-panel session-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Modes</p>
              <h2>Change drill</h2>
            </div>
          </div>
          <ModeSelector selectedMode={session.modeId} onSelect={handleModeSelect} />
        </section>
      </section>
    </main>
  );
}

export default App;
