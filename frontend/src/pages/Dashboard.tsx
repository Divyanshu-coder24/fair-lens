import { useState } from "react";
import { api, errMsg } from "../api/client";
import MetricCard from "../components/MetricCard";
import GroupChart from "../components/GroupChart";
import CounterfactualLab from "../components/CounterfactualLab";
import AuditPanel from "../components/AuditPanel";
import ChatPanel from "../components/ChatPanel";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function Dashboard() {
  const [info, setInfo] = useState<any>(null);
  const [target, setTarget] = useState("");
  const [sensitive, setSensitive] = useState("");
  const [audit, setAudit] = useState<any>(null);
  const [cf, setCf] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [busy, setBusy] = useState({ audit: false, cf: false, ai: false });
  const [err, setErr] = useState({ setup: "", ai: "" });
  const [modelName, setModelName] = useState("");
  const set = (k: keyof typeof busy, v: boolean) => setBusy(b => ({ ...b, [k]: v }));
  const reset = () => { setAudit(null); setCf(null); setAi(null); };

  async function guard(fn: () => Promise<void>) {
    setErr(e => ({ ...e, setup: "" }));
    try { await fn(); } catch (e) { setErr(x => ({ ...x, setup: errMsg(e) })); }
  }

  const loadDemo = () => guard(async () => {
    const r = await api.loadDemo(); setInfo(r); setModelName(r.model);
    setTarget(r.suggested.target); setSensitive(r.suggested.sensitive); reset();
  });
  const upModel = (f?: File) => { if (f) guard(async () => { const r = await api.uploadModel(f); setModelName(r.model); reset(); }); };
  const upData = (f?: File) => { if (f) guard(async () => {
    const r = await api.uploadDataset(f); setInfo(r);
    setTarget(r.columns[r.columns.length - 1]); setSensitive(r.columns[0]); reset();
  }); };

  async function runAi() {
    set("ai", true); setErr(e => ({ ...e, ai: "" }));
    try { setAi(await api.agentAudit()); } catch (e) { setErr(x => ({ ...x, ai: errMsg(e) })); } finally { set("ai", false); }
  }
  async function runAudit() {
    set("audit", true); setAi(null); setErr({ setup: "", ai: "" });
    try {
      const r = await api.audit(target, sensitive); setAudit(r); setCf(r.counterfactual);
      runAi();
    } catch (e) { setErr(x => ({ ...x, setup: errMsg(e) })); } finally { set("audit", false); }
  }
  async function runProbe(n: number) {
    set("cf", true);
    try { setCf(await api.counterfactual(n)); } catch (e) { setErr(x => ({ ...x, setup: errMsg(e) })); } finally { set("cf", false); }
  }

  const m = audit?.metrics;
  const ready = !!info && !!modelName;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex items-baseline justify-between border-b border-line py-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">FairLens</h1>
          <p className="text-sm text-muted">See what accuracy can't.</p>
        </div>
        <button onClick={loadDemo} className="border border-ink px-3 py-1.5 text-sm font-medium">Load Adult Income demo</button>
      </header>

      <section className="mt-5 bg-white p-5">
        <h2 className="font-display text-xl font-semibold">Set up the audit</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <label className="text-sm">Model (.joblib / .pkl)
            <input type="file" accept=".joblib,.pkl" onChange={e => upModel(e.target.files?.[0])} className="mt-1 block w-full text-xs" />
          </label>
          <label className="text-sm">Dataset (.csv)
            <input type="file" accept=".csv" onChange={e => upData(e.target.files?.[0])} className="mt-1 block w-full text-xs" />
          </label>
          <label className="text-sm">Target column
            <select value={target} onChange={e => setTarget(e.target.value)} disabled={!info} className="mt-1 block w-full border border-line bg-white px-2 py-1.5">
              {info?.columns.map((c: string) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">Sensitive attribute
            <select value={sensitive} onChange={e => setSensitive(e.target.value)} disabled={!info} className="mt-1 block w-full border border-line bg-white px-2 py-1.5">
              {info?.columns.filter((c: string) => c !== target).map((c: string) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={runAudit} disabled={!ready || busy.audit} className="bg-ink px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy.audit ? "Running audit…" : "Run audit"}
          </button>
          <span className="text-sm text-muted">{modelName ? `Model: ${modelName}` : "No model loaded"}{info ? ` · ${info.rows} rows` : ""}</span>
        </div>
        {err.setup && <p role="alert" className="mt-3 text-sm text-flag">{err.setup}</p>}
      </section>

      {m && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Accuracy" value={pct(m.accuracy)} hint={`Share of correct predictions overall. Positive class: ${m.positive_label}.`} />
            <MetricCard label="Demographic parity difference" value={m.demographic_parity_difference.toFixed(3)} flag={m.demographic_parity_difference > 0.1}
              hint="Gap between highest and lowest group selection rates. 0 means equal rates." />
            <MetricCard label="Equalized odds difference" value={m.equalized_odds_difference.toFixed(3)} flag={m.equalized_odds_difference > 0.1}
              hint="Larger of the true-positive and false-positive rate gaps across groups." />
            <MetricCard label="Counterfactual change rate" value={cf ? pct(cf.counterfactual_change_rate) : "n/a"} flag={!!cf && cf.counterfactual_change_rate > 0.05}
              hint="Predictions that changed when only the sensitive attribute was flipped." />
          </div>
          <p className="mt-2 text-xs text-muted">Metrics are measurements, not verdicts. Whether a gap matters depends on context.</p>

          <section className="mt-5 bg-white p-5">
            <h2 className="font-display text-xl font-semibold">Group performance by {audit.sensitive_attribute}</h2>
            <div className="mt-3"><GroupChart groups={audit.groups} /></div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <CounterfactualLab cf={cf} running={busy.cf} onRun={runProbe} />
            <AuditPanel result={ai} loading={busy.ai} error={err.ai} onRun={runAi} />
          </div>
        </>
      )}
      <div className="mt-5"><ChatPanel disabled={!audit} /></div>
    </div>
  );
}
