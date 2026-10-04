import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const LABELS: Record<string, string> = {
  selection_rate: "Selection rate", accuracy: "Accuracy",
  true_positive_rate: "True positive rate", false_positive_rate: "False positive rate",
};

export function GroupChart({ groups }: { groups: Record<string, any> }) {
  const names = Object.keys(groups);
  const data = Object.keys(LABELS).map(k => ({ metric: LABELS[k], ...Object.fromEntries(names.map(n => [n, groups[n][k]])) }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -12 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
          <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
          <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {names.map((n, i) => <Bar key={n} dataKey={n} fill={COLORS[i % 4]} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
