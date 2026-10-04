import { useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pct = (v: number | null | undefined) => (v == null ? "n/a" : `${(v * 100).toFixed(0)}%`);

export function CounterfactualLab({ cf, running, onRun }: { cf: any; running: boolean; onRun: (n: number) => void }) {
  const [n, setN] = useState("50");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Counterfactual lab</CardTitle>
        <CardDescription>Same person, only the sensitive attribute changes. We compare what the model predicts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="grid gap-1.5">
            <Label>Rows to test</Label>
            <Select value={n} onValueChange={setN}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{["25", "50", "100", "200"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button disabled={running} onClick={() => onRun(+n)}><FlaskConical />{running ? "Running…" : "Run probe"}</Button>
        </div>
        {!cf ? (
          <p className="text-sm text-muted-foreground">The sensitive attribute is not a model input, so counterfactual flipping does not apply.</p>
        ) : (
          <>
            <p className="text-sm">
              <b className="tabular-nums">{cf.prediction_changes} of {cf.samples_tested}</b> predictions changed when <b>{cf.feature}</b> was flipped ({pct(cf.counterfactual_change_rate)}).
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(cf.changes_by_original_group ?? {}).map(([g, v]: any) => (
                <Badge key={g} variant="secondary">Originally {g}: {v.changed}/{v.tested} changed</Badge>
              ))}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Context</TableHead><TableHead>Flip</TableHead><TableHead>P(positive)</TableHead><TableHead>Result</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {cf.examples.map((e: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-48 truncate text-xs text-muted-foreground" title={Object.entries(e.context).map(([k, v]) => `${k}: ${v}`).join(", ")}>
                      {Object.entries(e.context).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </TableCell>
                    <TableCell><span className="inline-flex items-center gap-1">{String(e.original_value)}<ArrowRight className="size-3" />{String(e.counterfactual_value)}</span></TableCell>
                    <TableCell className="tabular-nums">{pct(e.original_probability)} → {pct(e.counterfactual_probability)}</TableCell>
                    <TableCell>{e.prediction_changed ? <Badge variant="destructive">Changed</Badge> : <Badge variant="outline">Unchanged</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">{cf.note}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
