import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PALETTE = ["#1d6a8a", "#c4772a", "#5a7d3a", "#7a4f8f"];
const LABELS: Record<string, string> = {
  selection_rate: "Selection rate", accuracy: "Accuracy",
  true_positive_rate: "True positive rate", false_positive_rate: "False positive rate",
};

export default function GroupChart({ groups }: { groups: Record<string, any> }) {
  const names = Object.keys(groups);
  const data = Object.keys(LABELS).map(k => ({ metric: LABELS[k], ...Object.fromEntries(names.map(n => [n, groups[n][k]])) }));
  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -10 }}>
            <CartesianGrid stroke="#d5dbdf" vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
            <Legend />
            {names.map((n, i) => <Bar key={n} dataKey={n} fill={PALETTE[i % 4]} radius={[2, 2, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">
        Group sizes: {names.map(n => `${n} (${groups[n].count})`).join(", ")}
      </p>
    </div>
  );
}
