import type { ScoredVisit } from "../types/game";

interface VisitHistoryProps {
  history: ScoredVisit[];
}

export function VisitHistory({ history }: VisitHistoryProps) {
  return (
    <section className="surface secondary-panel history-panel">
      <div className="section-heading">
        <div>
          <p className="section-label">History</p>
          <h2>Recent visits</h2>
        </div>
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
                <p>{visit.darts.join(" / ")}</p>
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
