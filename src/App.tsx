import { useEffect, useMemo, useState } from "react";
import { DartPad } from "./components/DartPad";
import { ModeSelector } from "./components/ModeSelector";
import { StatCard } from "./components/StatCard";
import { VisitHistory } from "./components/VisitHistory";
import {
  STORAGE_KEY,
  addDartToSession,
  createInitialSession,
  getAccuracyPercent,
  getAverageScorePerVisit,
  getVisitFeedback,
  getVisitSuccessRate,
  hydrateSession,
  saveSession,
  switchMode,
  undoLastDartOrVisit,
} from "./lib/gameEngine";
import { gameModes } from "./lib/gameModes";
import type { GameModeId, SessionStats } from "./types/game";

const getStatusMessage = (session: SessionStats) => {
  const latestVisit = session.history[0];
  if (latestVisit) return getVisitFeedback(latestVisit);
  if (session.currentVisit.length > 0) return "Stay with the line. Finish the visit.";
  return "Three darts. Find the 20 bed and stack good visits.";
};

function App() {
  const [session, setSession] = useState<SessionStats>(() =>
    hydrateSession(window.localStorage.getItem(STORAGE_KEY)),
  );

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const mode = gameModes[session.modeId];
  const currentVisitNumber = session.visitsPlayed + 1;
  const statusMessage = getStatusMessage(session);
  const accuracy = getAccuracyPercent(session);
  const successRate = getVisitSuccessRate(session);
  const averageScore = getAverageScorePerVisit(session);
  const visitsRemaining = mode.fixedVisits ? Math.max(mode.fixedVisits - session.visitsPlayed, 0) : null;
  const drillComplete = useMemo(
    () => Boolean(mode.fixedVisits && session.visitsPlayed >= mode.fixedVisits),
    [mode.fixedVisits, session.visitsPlayed],
  );

  const handleModeSelect = (modeId: GameModeId) => {
    setSession((current) => switchMode(current, modeId));
  };

  const handleDart = (dart: Parameters<typeof addDartToSession>[1]) => {
    setSession((current) => addDartToSession(current, dart));
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
      <section className="hero panel">
        <div>
          <p className="eyebrow">Twenty Lock</p>
          <h1>Train tighter groups in the 20 bed.</h1>
          <p className="hero-copy">
            Quick visits, light scoring, and streak pressure designed for repeatable practice rather
            than full-match scoring.
          </p>
        </div>
        <div className="hero-score">
          <div>
            <span>Score</span>
            <strong>{session.score}</strong>
          </div>
          <div>
            <span>Streak</span>
            <strong>{session.streak}</strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{session.bestStreak}</strong>
          </div>
        </div>
      </section>

      <ModeSelector selectedMode={session.modeId} onSelect={handleModeSelect} />

      <section className="layout-grid">
        <section className="panel main-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current Visit</p>
              <h2>
                Visit {currentVisitNumber}
                {visitsRemaining !== null ? ` of ${mode.fixedVisits}` : ""}
              </h2>
            </div>
            <span className={`pill ${drillComplete ? "done" : ""}`}>
              {drillComplete ? "Block complete" : mode.name}
            </span>
          </div>

          <div className="slots">
            {[0, 1, 2].map((index) => (
              <div key={index} className={`slot ${session.currentVisit[index] ? "filled" : ""}`}>
                <span>Dart {index + 1}</span>
                <strong>{session.currentVisit[index] ?? "..."}</strong>
              </div>
            ))}
          </div>

          <div className="feedback-strip">
            <p>{statusMessage}</p>
            {mode.fixedVisits ? (
              <small>
                {visitsRemaining === 0 ? "Start a new session when ready." : `${visitsRemaining} visits remaining`}
              </small>
            ) : (
              <small>{mode.successLabel}</small>
            )}
          </div>

          <div className="action-row">
            <button type="button" className="secondary" onClick={handleUndo}>
              Undo last dart / visit
            </button>
            <button type="button" className="ghost" onClick={handleResetScore}>
              Reset game
            </button>
            <button type="button" className="ghost" onClick={handleNewSession}>
              New session
            </button>
          </div>
        </section>

        <DartPad disabled={drillComplete} onSelect={handleDart} />
      </section>

      <section className="stats-grid">
        <StatCard label="Visits played" value={session.visitsPlayed} />
        <StatCard label="Qualifying hit accuracy" value={`${accuracy}%`} accent />
        <StatCard label="Visit success rate" value={`${successRate}%`} />
        <StatCard label="Average points / visit" value={averageScore} />
        <StatCard label="Qualifying hits landed" value={session.totalQualifyingHits} />
        <StatCard label="Personal best streak" value={session.personalBestStreak} />
      </section>

      <VisitHistory history={session.history} />
    </main>
  );
}

export default App;
