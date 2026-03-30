import type { ScoredVisit } from "../types/game";

interface VisitHistoryProps {
  history: ScoredVisit[];
}

export function VisitHistory({ history }: VisitHistoryProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">History</p>
          <h2>Recent visits</h2>
        </div>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <p className="empty-state">Your last few visits will appear here once you start throwing.</p>
        ) : (
          history.map((visit) => (
            <article key={visit.visitNumber} className={`history-item ${visit.success ? "success" : "fail"}`}>
              <div>
                <strong>Visit {visit.visitNumber}</strong>
                <p>{visit.darts.join(" • ")}</p>
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
