import { formatDartResult } from "../lib/gameModes";
import type { ScoredVisit } from "../types/game";

interface VisitHistoryProps {
  history: ScoredVisit[];
  targetSegment: number;
}

export function VisitHistory({ history, targetSegment }: VisitHistoryProps) {
  return (
    <section className="card secondary-panel history-panel">
      <div className="section-heading">
        <h2>History</h2>
        <span className="history-count">{history.length}</span>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <p className="empty-state">Recent visits will appear here once you start throwing.</p>
        ) : (
          history.map((visit) => (
            <article key={visit.visitNumber} className={`history-item ${visit.success ? "success" : "fail"}`}>
              <div>
                <strong>Visit {visit.visitNumber}</strong>
                <p>{visit.darts.map((dart) => formatDartResult(dart, targetSegment)).join(" / ")}</p>
              </div>
              <div className="history-meta">
                <span>{visit.pointsEarned > 0 ? `+${visit.pointsEarned}` : "0"}</span>
                <small>{visit.note}</small>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
