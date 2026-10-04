import { useState } from "react";
import { Database, Play, ScanSearch, TriangleAlert } from "lucide-react";
import { api, errMsg } from "@/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { GroupChart } from "@/components/group-chart";
import { CounterfactualLab } from "@/components/counterfactual-lab";
import { AuditPanel } from "@/components/audit-panel";
import { ChatPanel } from "@/components/chat-panel";
import { ThemeToggle } from "@/components/theme-toggle";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function Dashboard() {
  const [info, setInfo] = useState<any>(null);
  const [target, setTarget] = useState("");
  const [sensitive, setSensitive] = useState("");
  const [audit, setAudit] = useState<any>(null);
  const [cf, setCf] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [modelName, setModelName] = useState("");
  const [busy, setBusy] = useState({ audit: false, cf: false, ai: false });
  const [err, setErr] = useState({ setup: "", ai: "" });
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
    try { const r = await api.audit(target, sensitive); setAudit(r); setCf(r.counterfactual); runAi(); }
    catch (e) { setErr(x => ({ ...x, setup: errMsg(e) })); } finally { set("audit", false); }
  }
  async function runProbe(n: number) {
    set("cf", true);
    try { setCf(await api.counterfactual(n)); } catch (e) { setErr(x => ({ ...x, setup: errMsg(e) })); } finally { set("cf", false); }
  }

  const m = audit?.metrics;
  const ready = !!info && !!modelName;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <ScanSearch className="size-6" />
            <div><h1 className="text-lg leading-tight font-semibold">FairLens</h1><p className="text-xs text-muted-foreground">See what accuracy can't.</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDemo}><Database />Load Adult Income demo</Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Set up the audit</CardTitle>
            <CardDescription>{modelName ? `Model: ${modelName}` : "No model loaded"}{info ? ` · ${info.rows} rows` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-1.5"><Label htmlFor="model">Model (.joblib / .pkl)</Label>
                <Input id="model" type="file" accept=".joblib,.pkl" onChange={e => upModel(e.target.files?.[0])} /></div>
              <div className="grid gap-1.5"><Label htmlFor="data">Dataset (.csv)</Label>
                <Input id="data" type="file" accept=".csv" onChange={e => upData(e.target.files?.[0])} /></div>
              <div className="grid gap-1.5"><Label>Target column</Label>
                <Select value={target} onValueChange={setTarget} disabled={!info}>
                  <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                  <SelectContent>{info?.columns.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid gap-1.5"><Label>Sensitive attribute</Label>
                <Select value={sensitive} onValueChange={setSensitive} disabled={!info}>
                  <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
                  <SelectContent>{info?.columns.filter((c: string) => c !== target).map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <Button onClick={runAudit} disabled={!ready || busy.audit}><Play />{busy.audit ? "Running audit…" : "Run audit"}</Button>
            {err.setup && <Alert variant="destructive"><TriangleAlert /><AlertTitle>Something went wrong</AlertTitle><AlertDescription>{err.setup}</AlertDescription></Alert>}
          </CardContent>
        </Card>

        {m && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Accuracy" value={pct(m.accuracy)} hint={`Share of correct predictions. Positive class: ${m.positive_label}.`} />
              <StatCard label="Demographic parity diff." value={m.demographic_parity_difference.toFixed(3)} flag={m.demographic_parity_difference > 0.1}
                hint="Gap between highest and lowest group selection rates. 0 means equal." />
              <StatCard label="Equalized odds diff." value={m.equalized_odds_difference.toFixed(3)} flag={m.equalized_odds_difference > 0.1}
                hint="Larger of the TPR and FPR gaps across groups." />
              <StatCard label="Counterfactual change" value={cf ? pct(cf.counterfactual_change_rate) : "n/a"} flag={!!cf && cf.counterfactual_change_rate > 0.05}
                hint="Predictions that changed when only the sensitive attribute was flipped." />
            </div>
            <p className="text-xs text-muted-foreground">Metrics are measurements, not verdicts. Whether a gap matters depends on context.</p>

            <Card>
              <CardHeader>
                <CardTitle>Group performance by {audit.sensitive_attribute}</CardTitle>
                <CardDescription>{Object.entries(audit.groups).map(([g, v]: any) => `${g} (${v.count})`).join(" · ")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart">
                  <TabsList><TabsTrigger value="chart">Chart</TabsTrigger><TabsTrigger value="table">Table</TabsTrigger><TabsTrigger value="gaps">Largest gaps</TabsTrigger></TabsList>
                  <TabsContent value="chart"><GroupChart groups={audit.groups} /></TabsContent>
                  <TabsContent value="table">
                    <Table>
                      <TableHeader><TableRow><TableHead>Group</TableHead><TableHead>Rows</TableHead><TableHead>Selection</TableHead><TableHead>Accuracy</TableHead><TableHead>TPR</TableHead><TableHead>FPR</TableHead></TableRow></TableHeader>
                      <TableBody>{Object.entries(audit.groups).map(([g, v]: any) => (
                        <TableRow key={g}><TableCell className="font-medium">{g}</TableCell><TableCell>{v.count}</TableCell>
                          <TableCell>{pct(v.selection_rate)}</TableCell><TableCell>{pct(v.accuracy)}</TableCell>
                          <TableCell>{pct(v.true_positive_rate)}</TableCell><TableCell>{pct(v.false_positive_rate)}</TableCell></TableRow>))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="gaps">
                    <Table>
                      <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Highest</TableHead><TableHead>Lowest</TableHead><TableHead>Gap</TableHead></TableRow></TableHeader>
                      <TableBody>{audit.comparison.largest_disparities.map((d: any) => (
                        <TableRow key={d.metric}><TableCell className="font-medium">{d.metric.replaceAll("_", " ")}</TableCell>
                          <TableCell>{d.highest_group} ({pct(d.highest_value)})</TableCell><TableCell>{d.lowest_group} ({pct(d.lowest_value)})</TableCell>
                          <TableCell><Badge variant={d.gap > 0.1 ? "destructive" : "secondary"}>{pct(d.gap)}</Badge></TableCell></TableRow>))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <CounterfactualLab cf={cf} running={busy.cf} onRun={runProbe} />
              <AuditPanel result={ai} loading={busy.ai} error={err.ai} onRun={runAi} />
            </div>
          </>
        )}
        <ChatPanel disabled={!audit} />
      </main>
    </div>
  );
}
