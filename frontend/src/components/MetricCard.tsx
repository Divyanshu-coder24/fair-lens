export default function MetricCard({ label, value, hint, flag }: { label: string; value: string; hint: string; flag?: boolean }) {
  return (
    <div className="border-l-4 bg-white px-4 py-3" style={{ borderColor: flag ? "var(--color-flag)" : "var(--color-ga)" }}>
      <div className="text-sm text-muted">{label}</div>
      <div className="font-display text-3xl font-semibold tabular-nums">{value}</div>
      <p className="mt-1 text-xs leading-snug text-muted">{hint}</p>
    </div>
  );
}
