import type { CSSProperties, ChangeEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { DartPad } from "./components/DartPad";
import { DartboardOutline } from "./components/DartboardOutline";
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
  switchTargetSegment,
  undoLastDartOrVisit,
} from "./lib/gameEngine";
import type { DartResult, GameModeId, SessionStats } from "./types/game";
import { DEFAULT_TARGET_SEGMENT, formatDartResult, gameModes, targetSegmentOptions } from "./lib/gameModes";

type ThemePreference = "dark" | "light" | "device";
type JourneyStage = "intro" | "segment" | "play" | "results";

const THEME_STORAGE_KEY = "twenty-lock-theme-v1";

const getStoredThemePreference = (): ThemePreference => {
  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedPreference === "light" || storedPreference === "device" || storedPreference === "dark") {
    return storedPreference;
  }

  return "dark";
};

const getStoredSession = () => hydrateSession(window.localStorage.getItem(STORAGE_KEY));

const getSystemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const getInitialJourneyStage = (session: SessionStats): JourneyStage => {
  if (isSessionComplete(session)) {
    return "results";
  }

  if (session.visitsPlayed > 0 || session.currentVisit.length > 0) {
    return "play";
  }

  return "intro";
};

const getRingStyle = (progress: number, color: string): CSSProperties => {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  return {
    background: `conic-gradient(${color} 0deg ${clampedProgress * 3.6}deg, rgba(173, 183, 194, 0.28) ${clampedProgress * 3.6}deg 360deg)`,
  };
};

const getVisitRingMeta = (dart?: DartResult) => {
  switch (dart) {
    case "T":
      return { progress: 100, color: "#1fb36d" };
    case "D":
      return { progress: 80, color: "#f4a11a" };
    case "S":
      return { progress: 60, color: "#ef5b4d" };
    case "OTHER":
      return { progress: 28, color: "#4d95ff" };
    case "MISS":
      return { progress: 0, color: "#cbd4de" };
    default:
      return { progress: 0, color: "#d7dde5" };
  }
};

const journeySteps: Array<{ id: JourneyStage; label: string }> = [
  { id: "intro", label: "Intro" },
  { id: "segment", label: "Segment" },
  { id: "play", label: "Inputs" },
  { id: "results", label: "Results" },
];

function App() {
  const [session, setSession] = useState<SessionStats>(getStoredSession);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>(() => getInitialJourneyStage(getStoredSession()));
  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredThemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (isSessionComplete(session)) {
      setJourneyStage("results");
    }
  }, [session]);

  useEffect(() => {
    if (!optionsOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOptionsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [optionsOpen]);

  const resolvedTheme = themePreference === "device" ? (systemPrefersDark ? "dark" : "light") : themePreference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [resolvedTheme, themePreference]);

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
  const endedByMiss = Boolean(mode.endsOnMiss && session.history.some((visit) => visit.darts.includes("MISS")));
  const completionMessage = endedByMiss
    ? "A miss ended this endurance block. Restart the segment or choose a different number."
    : `You completed ${goalVisits} visits on segment ${session.targetSegment}.`;

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

  const resultStats = [
    { label: "Final score", value: session.score },
    { label: "Accuracy", value: `${accuracy}%` },
    { label: "Visit success", value: `${successRate}%` },
    { label: "Average score", value: averageScore },
    { label: "Hits landed", value: session.totalQualifyingHits },
    { label: "Best streak", value: session.bestStreak },
    { label: "Personal best", value: session.personalBestStreak },
    { label: "Completed visits", value: session.visitsPlayed },
  ];

  const handleModeSelect = (modeId: GameModeId) => {
    setSession((current) => switchMode(current, modeId));
  };

  const handleTargetSegmentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSegment = Number.parseInt(event.target.value, 10);

    setSession((current) =>
      switchTargetSegment(current, Number.isNaN(nextSegment) ? DEFAULT_TARGET_SEGMENT : nextSegment),
    );
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
      ...createInitialSession(current.modeId, current.targetSegment),
      personalBestStreak: current.personalBestStreak,
    }));
    setJourneyStage("play");
  };

  const handleNewSession = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession((current) => createInitialSession(current.modeId, current.targetSegment));
    setJourneyStage("intro");
  };

  const handleRestartSegment = () => {
    setSession((current) => ({
      ...createInitialSession(current.modeId, current.targetSegment),
      personalBestStreak: current.personalBestStreak,
    }));
    setJourneyStage("play");
  };

  const handlePickAnotherSegment = () => {
    setSession((current) => ({
      ...createInitialSession(current.modeId, current.targetSegment),
      personalBestStreak: current.personalBestStreak,
    }));
    setJourneyStage("segment");
  };

  const handleOverlayClose = () => {
    setOptionsOpen(false);
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleOverlayClose();
    }
  };

  const handleOverlayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      handleOverlayClose();
    }
  };

  return (
    <>
      <main className="app-shell">
        <nav className="card journey-nav" aria-label="Practice journey">
          {journeySteps.map((step, index) => {
            const currentIndex = journeySteps.findIndex((entry) => entry.id === journeyStage);
            const isActive = step.id === journeyStage;
            const isComplete = index < currentIndex;

            return (
              <div
                key={step.id}
                className={`journey-step ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
              >
                <span className="journey-index">{index + 1}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </nav>

        {journeyStage === "intro" ? (
          <section className="card stage-card hero-stage">
            <div className="stage-copy">
              <p className="section-label">Twenty Lock</p>
              <h1>Train through a cleaner journey from setup to session results.</h1>
              <p className="stage-description">
                Pick a mode, choose your number, record your visits, then finish on a results screen that helps you
                decide whether to run it back or move on.
              </p>
              <div className="progress-badge-row">
                <span className="streak-badge">{mode.name} mode</span>
                <span className="inline-badge">Target {session.targetSegment}</span>
              </div>
            </div>

            <div className="hero-layout">
              <section className="card hero-board-panel">
                <div className="section-heading">
                  <h2>Board picture</h2>
                </div>
                <p className="progress-support">
                  Keep the picture of {session.targetSegment} clear before you step into the throw.
                </p>
                <DartboardOutline targetSegment={session.targetSegment} />
              </section>

              <section className="card secondary-panel">
                <div className="section-heading">
                  <h2>Mode selection</h2>
                </div>
                <ModeSelector
                  selectedMode={session.modeId}
                  targetSegment={session.targetSegment}
                  onSelect={handleModeSelect}
                />
              </section>
            </div>

            <div className="stage-actions">
              <button type="button" className="utility-button primary large" onClick={() => setJourneyStage("segment")}>
                Continue to segment
              </button>
            </div>
          </section>
        ) : null}

        {journeyStage === "segment" ? (
          <section className="card stage-card selection-stage">
            <div className="section-heading">
              <div>
                <p className="section-label">Step 2</p>
                <h1>Choose the segment for this block.</h1>
              </div>
              <button type="button" className="section-toggle" onClick={() => setJourneyStage("intro")}>
                Back
              </button>
            </div>

            <div className="selection-layout">
              <section className="card secondary-panel segment-panel">
                <div className="section-heading">
                  <h2>Segment selector</h2>
                </div>
                <label className="segment-control" htmlFor="target-segment">
                  <span>Target segment</span>
                  <select
                    id="target-segment"
                    className="segment-select"
                    value={session.targetSegment}
                    onChange={handleTargetSegmentChange}
                  >
                    {targetSegmentOptions.map((segment) => (
                      <option key={segment} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="progress-support">{mode.successLabel(session.targetSegment)}</p>
              </section>

              <section className="card hero-board-panel selection-preview">
                <div className="section-heading">
                  <h2>Current picture</h2>
                </div>
                <p className="progress-support">
                  {mode.name} mode is now set to segment {session.targetSegment}.
                </p>
                <DartboardOutline targetSegment={session.targetSegment} />
              </section>
            </div>

            <div className="stage-actions">
              <button type="button" className="utility-button" onClick={() => setJourneyStage("intro")}>
                Change mode
              </button>
              <button type="button" className="utility-button primary large" onClick={() => setJourneyStage("play")}>
                Start practice
              </button>
            </div>
          </section>
        ) : null}

        {journeyStage === "play" ? (
          <section className="stage-flow">
            <header className="card stage-header">
              <div className="stage-copy">
                <p className="section-label">Current inputs</p>
                <h1>
                  {mode.name} on {session.targetSegment}
                </h1>
                <p className="stage-description">{mode.description(session.targetSegment)}</p>
              </div>

              <div className="header-actions">
                <button type="button" className="section-toggle" onClick={() => setJourneyStage("segment")}>
                  Change segment
                </button>
                <button type="button" className="section-toggle" onClick={() => setJourneyStage("intro")}>
                  Change mode
                </button>
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

            <section className="play-grid">
              <div className="play-main">
                <DartPad
                  disabled={drillComplete}
                  disabledMessage={drillComplete ? completionMessage : undefined}
                  targetSegment={session.targetSegment}
                  onSelect={handleDart}
                  onAdvance={handleAdvance}
                />

                <section className="card visit-stage">
                  <div className="section-heading">
                    <h2>Visit stage</h2>
                    <span className="history-count">{session.currentVisit.length}/3</span>
                  </div>
                  <div className="visit-grid" aria-label="Current visit dart slots">
                    {[0, 1, 2].map((index) => {
                      const dart = session.currentVisit[index];
                      const ringMeta = getVisitRingMeta(dart);

                      return (
                        <article key={index} className="visit-slot">
                          <div
                            className="progress-ring progress-ring-visit"
                            style={getRingStyle(ringMeta.progress, ringMeta.color)}
                          >
                            <div className="progress-ring-inner">
                              <strong>{dart ? formatDartResult(dart, session.targetSegment) : "--"}</strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="card secondary-panel controls-panel">
                  <div className="section-heading">
                    <h2>Controls panel</h2>
                  </div>
                  <div className="action-row">
                    <button
                      type="button"
                      className="utility-button primary"
                      aria-label="Undo last dart or visit"
                      onClick={handleUndo}
                    >
                      Undo
                    </button>
                    <button type="button" className="utility-button" aria-label="Reset game" onClick={handleResetScore}>
                      Reset
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
              </div>

              <aside className="play-side">
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
                    <p className="section-label">Progress card</p>
                    <h2>Overall progress</h2>
                    <p className="progress-support">
                      {sessionProgressValue}/{goalVisits} visits completed
                    </p>
                    <div className="progress-badge-row">
                      <span className="streak-badge">Streak {session.streak}</span>
                      <span className={`inline-badge ${drillComplete ? "done" : ""}`}>
                        {drillComplete ? "Complete" : mode.name}
                      </span>
                    </div>
                  </div>
                </section>

                <VisitHistory history={session.history} targetSegment={session.targetSegment} />
              </aside>
            </section>
          </section>
        ) : null}

        {journeyStage === "results" ? (
          <section className="card stage-card results-stage">
            <div className="results-hero">
              <div className="stage-copy">
                <p className="section-label">Results</p>
                <h1>Session complete.</h1>
                <p className="stage-description">{completionMessage}</p>
                <div className="progress-badge-row">
                  <span className="streak-badge">{mode.name}</span>
                  <span className="inline-badge done">Segment {session.targetSegment}</span>
                </div>
              </div>

              <div className="progress-ring progress-ring-large" style={getRingStyle(successRate, "#1fb36d")}>
                <div className="progress-ring-inner">
                  <strong>{successRate}%</strong>
                  <span>Visit success</span>
                </div>
              </div>
            </div>

            <section className="results-grid" aria-label="Session stats">
              {resultStats.map((stat) => (
                <article key={stat.label} className="mini-stat">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </section>

            <div className="stage-actions">
              <button type="button" className="utility-button primary large" onClick={handleRestartSegment}>
                Restart segment
              </button>
              <button type="button" className="utility-button large" onClick={handlePickAnotherSegment}>
                Pick another
              </button>
              <button type="button" className="utility-button large" onClick={() => setJourneyStage("intro")}>
                Change mode
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <button
        type="button"
        className="options-fab"
        aria-haspopup="dialog"
        aria-expanded={optionsOpen}
        onClick={() => setOptionsOpen(true)}
      >
        Options
      </button>

      {optionsOpen ? (
        <div
          className="options-overlay"
          role="presentation"
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
        >
          <section className="card options-popout" role="dialog" aria-modal="true" aria-labelledby="options-title">
            <div className="section-heading">
              <div>
                <p className="section-label">Options</p>
                <h2 id="options-title">Session settings</h2>
              </div>
              <button type="button" className="section-toggle" onClick={handleOverlayClose}>
                Close
              </button>
            </div>

            <div className="options-section">
              <p className="section-label">Theme</p>
              <div className="theme-switcher" role="group" aria-label="Theme preference">
                {(["dark", "light", "device"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`theme-button ${themePreference === option ? "selected" : ""}`}
                    aria-pressed={themePreference === option}
                    onClick={() => setThemePreference(option)}
                  >
                    {option === "device" ? "Device" : option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
              <p className="progress-support">
                {themePreference === "device"
                  ? `Using your device preference. Current theme: ${resolvedTheme}.`
                  : `Using the ${resolvedTheme} theme.`}
              </p>
            </div>

            <div className="options-section">
              <p className="section-label">Current setup</p>
              <div className="options-summary">
                <span className="inline-badge">{mode.name}</span>
                <span className="inline-badge">Segment {session.targetSegment}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default App;
