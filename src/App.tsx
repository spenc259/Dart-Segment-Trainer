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
    background: `conic-gradient(${color} 0deg ${clampedProgress * 3.6}deg, var(--ring-track) ${clampedProgress * 3.6}deg 360deg)`,
  };
};

const getVisitRingMeta = (dart?: DartResult) => {
  switch (dart) {
    case "T":
      return { progress: 100, color: "var(--ring-triple-color)" };
    case "D":
      return { progress: 80, color: "var(--ring-double-color)" };
    case "S":
      return { progress: 60, color: "var(--ring-single-color)" };
    case "OTHER":
      return { progress: 28, color: "var(--ring-other-color)" };
    case "MISS":
      return { progress: 0, color: "var(--ring-muted-color)" };
    default:
      return { progress: 0, color: "var(--ring-empty-color)" };
  };
};

const journeySteps: Array<{ id: JourneyStage; label: string }> = [
  { id: "intro", label: "Intro" },
  { id: "segment", label: "Setup" },
  { id: "play", label: "Practice" },
  { id: "results", label: "Results" },
];

const introHighlights = [
  {
    title: "Build a repeatable picture",
    description: "Keep the target clear before each throw and settle into the same visual lane.",
  },
  {
    title: "Choose the right drill",
    description: "Switch between standard, strict, precision, and endurance practice blocks.",
  },
  {
    title: "Finish with a clear recap",
    description: "End on a results screen with streak, accuracy, visit success, and restart options.",
  },
];

function JourneyIcon({ step }: { step: JourneyStage }) {
  switch (step) {
    case "intro":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.4 12 5l8 6.4V20a1 1 0 0 1-1 1h-4.8v-6h-4.4v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "segment":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9A9 9 0 0 0 12 3Zm0 3.1a5.9 5.9 0 1 1-5.9 5.9A5.9 5.9 0 0 1 12 6.1Zm0 2.8a3.1 3.1 0 1 0 3.1 3.1A3.1 3.1 0 0 0 12 8.9Z" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 5.5A2.5 2.5 0 1 1 4.5 8 2.5 2.5 0 0 1 7 5.5Zm0 7A2.5 2.5 0 1 1 4.5 15 2.5 2.5 0 0 1 7 12.5Zm0 7A2.5 2.5 0 1 1 4.5 22 2.5 2.5 0 0 1 7 19.5ZM11.5 7h8a1 1 0 0 1 0 2h-8a1 1 0 0 1 0-2Zm0 7h8a1 1 0 0 1 0 2h-8a1 1 0 0 1 0-2Zm0 7h8a1 1 0 0 1 0 2h-8a1 1 0 0 1 0-2Z" transform="translate(0 -1.5)" />
        </svg>
      );
    case "results":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19a1 1 0 0 1-1-1V7.5a1 1 0 0 1 2 0V17h13a1 1 0 0 1 0 2Zm4.3-3.3a1 1 0 0 1-1-1v-4.2a1 1 0 0 1 2 0v4.2a1 1 0 0 1-1 1Zm4.7 0a1 1 0 0 1-1-1V5.7a1 1 0 1 1 2 0v9a1 1 0 0 1-1 1Zm4.7 0a1 1 0 0 1-1-1v-6.4a1 1 0 0 1 2 0v6.4a1 1 0 0 1-1 1Z" />
        </svg>
      );
    default:
      return null;
  }
}

function OptionsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.7 3h2.6l.5 2.2a7 7 0 0 1 1.8.8l2-1.1 1.8 1.8-1.1 2a7 7 0 0 1 .8 1.8L21 10.7v2.6l-2.2.5a7 7 0 0 1-.8 1.8l1.1 2-1.8 1.8-2-1.1a7 7 0 0 1-1.8.8L13.3 21h-2.6l-.5-2.2a7 7 0 0 1-1.8-.8l-2 1.1-1.8-1.8 1.1-2a7 7 0 0 1-.8-1.8L3 13.3v-2.6l2.2-.5a7 7 0 0 1 .8-1.8l-1.1-2 1.8-1.8 2 1.1a7 7 0 0 1 1.8-.8Zm1.3 6.3A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Z" />
    </svg>
  );
}

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
      color: "var(--summary-score-color)",
    },
    {
      label: "Streak",
      value: session.streak,
      progress: Math.min(100, Math.round((session.streak / personalBestBase) * 100)),
      color: "var(--summary-streak-color)",
    },
    {
      label: "Best",
      value: session.bestStreak,
      progress: Math.min(100, Math.round((session.bestStreak / personalBestBase) * 100)),
      color: "var(--summary-best-color)",
    },
    {
      label: "Turn",
      value: currentVisitNumber,
      progress: Math.min(100, Math.round((Math.min(currentVisitNumber, goalVisits) / goalVisits) * 100)),
      color: "var(--summary-turn-color)",
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

  const canOpenResults = drillComplete;

  return (
    <>
      <main className="app-shell">
        {journeyStage === "intro" ? (
          <section className="intro-mobile">
            <section className="intro-hero-surface">
              <div className="intro-hero">
                <div className="stage-copy intro-copy-block">
                  <p className="section-label">Ready to practice</p>
                  <h1>Lock in a cleaner darts session.</h1>
                  <p className="stage-description">
                    Start with a quick overview, set your drill and segment in the next step, and finish with a recap
                    that tells you whether to run it back or move on.
                  </p>
                </div>
              </div>
            </section>

            <section className="intro-feature-grid">
              {introHighlights.map((item) => (
                <article key={item.title} className="card intro-feature-card">
                  <span className="intro-feature-icon" aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </section>

            <div className="intro-cta-wrap">
              <button
                type="button"
                className="utility-button primary intro-cta-button"
                onClick={() => setJourneyStage("segment")}
              >
                Set up session
              </button>
            </div>
          </section>
        ) : null}

        {journeyStage === "segment" ? (
          <section className="stage-card setup-stage">
            <section className="intro-hero-surface setup-hero-surface">
              <div className="section-heading setup-topbar">
                <div className="stage-copy intro-copy-block setup-copy-block">
                  <p className="section-label">Step 2</p>
                  <h1>Shape the session before the first dart.</h1>
                  <p className="stage-description">
                    Choose the drill that sets the pace, lock in the segment, and settle the board picture before you
                    start.
                  </p>
                </div>
                <button type="button" className="section-toggle" onClick={() => setJourneyStage("intro")}>
                  Back
                </button>
              </div>
            </section>

            <div className="selection-layout setup-grid">
              <section className="card intro-mode-panel selection-mode-panel">
                <div className="setup-panel-copy">
                  <p className="section-label">Session mode</p>
                  <p className="progress-support">Pick the rule set that fits this practice block.</p>
                </div>
                <ModeSelector
                  selectedMode={session.modeId}
                  targetSegment={session.targetSegment}
                  onSelect={handleModeSelect}
                />
              </section>

              <section className="card intro-board-card selection-config-panel">
                <div className="setup-inline">
                  <span className="inline-badge">{mode.name}</span>
                  <span className="inline-badge">Segment {session.targetSegment}</span>
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
                <div className="intro-board-preview">
                  <DartboardOutline targetSegment={session.targetSegment} />
                </div>
              </section>
            </div>

            <div className="stage-actions">
              <button type="button" className="utility-button" onClick={() => setJourneyStage("intro")}>
                Back to intro
              </button>
              <button type="button" className="utility-button primary large" onClick={() => setJourneyStage("play")}>
                Start practice
              </button>
            </div>
          </section>
        ) : null}

        {journeyStage === "play" ? (
            <section className="stage-flow">
              <section className="summary-bar" aria-label="Live stats">
                {summaryCards.map((card) => (
                  <article key={card.label} className="summary-item">
                    <p className="summary-label">{card.label}</p>
                    <div className="summary-ring" style={getRingStyle(card.progress, card.color)}>
                      <div className="summary-ring-inner">
                        <strong className="summary-value">{card.value}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

            <section className="play-grid">
              <div className="play-main">
                <DartPad
                  disabled={drillComplete}
                  targetSegment={session.targetSegment}
                  onSelect={handleDart}
                  onAdvance={handleAdvance}
                />

                <section className="visit-stage" aria-label="Current visit">
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

                <section className="controls-panel" aria-label="Session controls">
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
                <section className="progress-card progress-card-large">
                  <div
                    className="progress-ring progress-ring-large"
                    style={getRingStyle(sessionProgress, "var(--progress-ring-color)")}
                  >
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
          <section className="stage-card results-stage">
            <div className="results-hero">
              <div className="stage-copy">
                <h1>Session complete.</h1>
                <p className="stage-description">{completionMessage}</p>
                <div className="progress-badge-row">
                  <span className="streak-badge">{mode.name}</span>
                  <span className="inline-badge done">Segment {session.targetSegment}</span>
                </div>
              </div>

              <div
                className="progress-ring progress-ring-large"
                style={getRingStyle(successRate, "var(--success-ring-color)")}
              >
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
                Edit setup
              </button>
              <button type="button" className="utility-button large" onClick={() => setJourneyStage("intro")}>
                Back to intro
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <nav className="journey-float" aria-label="Practice journey">
        {journeySteps.map((step) => {
          const isActive = step.id === journeyStage;
          const isDisabled = step.id === "results" && !canOpenResults;

          return (
            <button
              key={step.id}
              type="button"
              className={`journey-float-button ${isActive ? "active" : ""}`}
              aria-label={step.label}
              aria-current={isActive ? "page" : undefined}
              disabled={isDisabled}
              onClick={() => setJourneyStage(step.id)}
            >
              <JourneyIcon step={step.id} />
            </button>
          );
        })}

        <button
          type="button"
          className={`journey-float-button ${optionsOpen ? "active" : ""}`}
          aria-label="Options"
          aria-expanded={optionsOpen}
          aria-haspopup="dialog"
          onClick={() => setOptionsOpen(true)}
        >
          <OptionsIcon />
        </button>
      </nav>

      {optionsOpen ? (
        <div
          className="options-overlay"
          role="presentation"
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
        >
          <section className="card options-popout" role="dialog" aria-modal="true" aria-labelledby="options-title">
            <div className="options-topbar">
              <div className="options-summary" id="options-title">
                <span className="inline-badge">{mode.name}</span>
                <span className="inline-badge">Segment {session.targetSegment}</span>
              </div>
              <button type="button" className="section-toggle" onClick={handleOverlayClose}>
                Close
              </button>
            </div>

            <div className="options-section">
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
          </section>
        </div>
      ) : null}
    </>
  );
}

export default App;
