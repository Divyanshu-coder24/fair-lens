const List = ({ title, items }: { title: string; items?: string[] }) =>
  items && items.length ? (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  ) : null;

export default function AuditPanel({ result, loading, error, onRun }: { result: any; loading: boolean; error: string; onRun: () => void }) {
  const r = result?.report;
  return (
    <section className="bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Gemma 4 audit</h2>
          <p className="mt-1 text-sm text-muted">Gemma interprets measured evidence. All numbers come from the Python engine.</p>
        </div>
        <button disabled={loading} onClick={onRun} className="shrink-0 border border-ink px-3 py-1.5 text-sm font-medium disabled:opacity-50">
          {loading ? "Investigating…" : r ? "Re-run" : "Run AI audit"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-flag">{error}</p>}
      {r && (
        <>
          <p className="mt-4 text-sm leading-relaxed">{r.summary}</p>
          <List title="Key findings" items={r.key_findings} />
          <List title="Evidence" items={r.evidence} />
          {r.counterfactual_observation && (<div className="mt-4"><h3 className="text-sm font-semibold">Counterfactual observation</h3><p className="mt-1 text-sm">{r.counterfactual_observation}</p></div>)}
          <List title="Recommended investigations" items={r.recommended_investigations} />
          <List title="Limitations" items={r.limitations} />
          {result.tool_trace?.length > 0 && (
            <p className="mt-4 text-xs text-muted">Tools called: {result.tool_trace.map((t: any) => t.tool).join(", ")}</p>
          )}
        </>
      )}
    </section>
  );
}
