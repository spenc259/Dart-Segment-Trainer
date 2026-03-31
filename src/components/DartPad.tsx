import { dartButtons } from "../lib/gameModes";
import type { DartResult } from "../types/game";

interface DartPadProps {
  disabled?: boolean;
  disabledMessage?: string;
  onSelect: (dart: DartResult) => void;
  onAdvance: () => void;
}

export function DartPad({ disabled = false, disabledMessage, onSelect, onAdvance }: DartPadProps) {
  const visibleButtons = dartButtons.filter((button) => button.value !== "OTHER");

  return (
    <section className="card input-panel">
      {disabledMessage ? (
        <p className="input-note" role="status" aria-live="polite">
          {disabledMessage}
        </p>
      ) : null}
      <div className="dart-pad">
        {visibleButtons.map((button) => (
          <button
            key={button.value}
            type="button"
            className={`dart-button dart-${button.value.toLowerCase()}`}
            onClick={() => onSelect(button.value)}
            disabled={disabled}
          >
            <span>{button.label}</span>
          </button>
        ))}
        <button
          type="button"
          className="dart-button dart-advance"
          onClick={onAdvance}
          disabled={disabled}
        >
          <span>Advance</span>
        </button>
      </div>
    </section>
  );
}
