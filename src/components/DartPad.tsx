import { dartButtons } from "../lib/gameModes";
import type { DartResult } from "../types/game";

interface DartPadProps {
  disabled?: boolean;
  onSelect: (dart: DartResult) => void;
}

export function DartPad({ disabled = false, onSelect }: DartPadProps) {
  return (
    <section className="card input-panel">
      <div className="section-heading input-heading">
        <div>
          <p className="section-label">Input</p>
          <h2>Log the dart</h2>
        </div>
        <small className="input-note">Tap three results, then move straight into the next visit.</small>
      </div>
      <div className="dart-pad">
        {dartButtons.map((button) => (
          <button
            key={button.value}
            type="button"
            className={`dart-button dart-${button.value.toLowerCase()}`}
            onClick={() => onSelect(button.value)}
            disabled={disabled}
          >
            <span>{button.label}</span>
            <small>{button.hint}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
