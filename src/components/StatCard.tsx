interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <article className={`stat-card ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
