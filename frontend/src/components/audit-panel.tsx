import { Sparkles, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

export function AuditPanel({ result, loading, error, onRun }: { result: any; loading: boolean; error: string; onRun: () => void }) {
  const r = result?.report;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">Gemma 4 audit <Badge variant="secondary">AI</Badge></CardTitle>
            <CardDescription>Gemma interprets measured evidence. All numbers come from the Python engine.</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={loading} onClick={onRun}><Sparkles />{loading ? "Investigating…" : r ? "Re-run" : "Run AI audit"}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><TriangleAlert /><AlertTitle>Gemma audit failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {loading && <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>}
        {r && !loading && (
          <>
            <p className="text-sm leading-relaxed">{r.summary}</p>
            <Section title="Key findings" items={r.key_findings} />
            <Section title="Evidence" items={r.evidence} />
            {r.counterfactual_observation && <div><h3 className="text-sm font-semibold">Counterfactual observation</h3><p className="mt-1 text-sm text-muted-foreground">{r.counterfactual_observation}</p></div>}
            <Section title="Recommended investigations" items={r.recommended_investigations} />
            <Section title="Limitations" items={r.limitations} />
            {result.tool_trace?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">Tools called:
                {result.tool_trace.map((t: any, i: number) => <Badge key={i} variant="outline">{t.tool}</Badge>)}
              </div>
            )}
          </>
        )}
        {!r && !loading && !error && <p className="text-sm text-muted-foreground">Run the AI audit to get findings, evidence and suggested investigations.</p>}
      </CardContent>
    </Card>
  );
}
