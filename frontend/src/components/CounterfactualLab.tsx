import { useState } from "react";

const pct = (v: number | null | undefined) => (v == null ? "n/a" : `${(v * 100).toFixed(0)}%`);

export default function CounterfactualLab({ cf, running, onRun }: { cf: any; running: boolean; onRun: (n: number) => void }) {
  const [n, setN] = useState(50);
  return (
    <section className="bg-white p-5">
      <h2 className="font-display text-xl font-semibold">Counterfactual lab</h2>
      <p className="mt-1 text-sm text-muted">Same person, only the sensitive attribute changes. We compare what the model predicts.</p>
      <div className="mt-3 flex items-end gap-3">
        <label className="text-sm">Rows to test
          <select className="ml-2 border border-line bg-white px-2 py-1" value={n} onChange={e => setN(+e.target.value)}>
            {[25, 50, 100, 200].map(v => <option key={v}>{v}</option>)}
          </select>
        </label>
        <button disabled={running} onClick={() => onRun(n)} className="bg-ink px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          {running ? "Running…" : "Run probe"}
        </button>
      </div>
      {!cf ? <p className="mt-4 text-sm text-muted">The sensitive attribute is not a model input, so counterfactual flipping does not apply.</p> : (
        <>
          <p className="mt-4 text-sm">
            <b className="tabular-nums">{cf.prediction_changes} of {cf.samples_tested}</b> predictions changed when
            <b> {cf.feature}</b> was flipped ({pct(cf.counterfactual_change_rate)}).
          </p>
          <ul className="mt-2 text-xs text-muted">
            {Object.entries(cf.changes_by_original_group ?? {}).map(([g, v]: any) => (
              <li key={g}>Originally {g}: {v.changed} of {v.tested} changed</li>
            ))}
          </ul>
          <div className="mt-3 space-y-2">
            {cf.examples.map((e: any, i: number) => (
              <div key={i} className="border border-line p-3 text-sm" style={e.prediction_changed ? { borderLeft: "4px solid var(--color-flag)" } : {}}>
                <div className="text-xs text-muted">{Object.entries(e.context).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span>{e.changed_feature} <b>{String(e.original_value)}</b> → <b>{String(e.counterfactual_value)}</b></span>
                  <span className="tabular-nums text-muted">p {pct(e.original_probability)} → {pct(e.counterfactual_probability)}</span>
                  <span className={e.prediction_changed ? "font-medium text-flag" : "text-muted"}>
                    {e.prediction_changed ? "Prediction changed under this counterfactual" : "Prediction unchanged"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{cf.note}</p>
        </>
      )}
    </section>
  );
}
