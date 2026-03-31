import { gameModes } from "../lib/gameModes";
import type { GameModeId } from "../types/game";

interface ModeSelectorProps {
  selectedMode: GameModeId;
  onSelect: (modeId: GameModeId) => void;
}

export function ModeSelector({ selectedMode, onSelect }: ModeSelectorProps) {
  return (
    <div className="mode-grid">
      {Object.values(gameModes).map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`mode-card ${selectedMode === mode.id ? "selected" : ""}`}
          onClick={() => onSelect(mode.id)}
          aria-pressed={selectedMode === mode.id}
        >
          <span className="mode-name">{mode.name}</span>
          <span className="mode-description">{mode.description}</span>
          <span className="mode-rule">{mode.successLabel}</span>
        </button>
      ))}
    </div>
  );
}
