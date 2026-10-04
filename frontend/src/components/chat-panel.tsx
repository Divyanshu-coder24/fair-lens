import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { api, errMsg, type Chat } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTED = ["Why is there a disparity?", "Which group is affected most?", "What should we investigate next?", "Show me a counterfactual example."];
type Msg = Chat & { tools?: string[] };

export function ChatPanel({ disabled }: { disabled: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = msgs.map(({ role, text }) => ({ role, text }));
    setMsgs(m => [...m, { role: "user", text }]); setInput(""); setBusy(true);
    try {
      const r = await api.chat(text, history);
      setMsgs(m => [...m, { role: "model", text: r.reply, tools: r.tool_trace.map((t: any) => t.tool) }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "model", text: `Error: ${errMsg(e)}` }]);
    } finally { setBusy(false); setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask the audit</CardTitle>
        <CardDescription>Gemma can call the analysis tools before answering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map(q => <Button key={q} variant="outline" size="sm" disabled={disabled || busy} onClick={() => send(q)}>{q}</Button>)}
        </div>
        <div className="max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</div>
              {m.tools && m.tools.length > 0 && <div className="flex flex-wrap gap-1">{m.tools.map((t, j) => <Badge key={j} variant="outline">{t}</Badge>)}</div>}
            </div>
          ))}
          {busy && <p className="text-sm text-muted-foreground">Gemma is investigating…</p>}
          <div ref={end} />
        </div>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(input); }}>
          <Input value={input} onChange={e => setInput(e.target.value)} disabled={disabled}
            placeholder={disabled ? "Run an audit first" : "Why is the model showing disparity?"} />
          <Button type="submit" size="icon" disabled={disabled || busy} aria-label="Send"><Send /></Button>
        </form>
      </CardContent>
    </Card>
  );
}
