import { dartButtons } from "../lib/gameModes";
import type { DartResult } from "../types/game";

interface DartPadProps {
  disabled?: boolean;
  onSelect: (dart: DartResult) => void;
}

export function DartPad({ disabled = false, onSelect }: DartPadProps) {
  return (
    <section className="card input-panel">
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
          </button>
        ))}
      </div>
    </section>
  );
}
