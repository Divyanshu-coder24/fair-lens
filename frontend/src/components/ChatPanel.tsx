import { useRef, useState } from "react";
import { api, errMsg, Chat } from "../api/client";

const SUGGESTED = ["Why is there a disparity?", "Which group is affected most?", "What should we investigate next?", "Show me a counterfactual example."];
type Msg = Chat & { tools?: string[] };

export default function ChatPanel({ disabled }: { disabled: boolean }) {
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
    <section className="bg-white p-5">
      <h2 className="font-display text-xl font-semibold">Ask the audit</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED.map(q => (
          <button key={q} disabled={disabled || busy} onClick={() => send(q)} className="border border-line px-2 py-1 text-xs hover:bg-paper disabled:opacity-50">{q}</button>
        ))}
      </div>
      <div className="mt-3 max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-left text-sm ${m.role === "user" ? "bg-ink text-white" : "bg-paper"}`}>{m.text}</div>
            {m.tools && m.tools.length > 0 && <div className="mt-1 text-xs text-muted">Tools called: {m.tools.join(", ")}</div>}
          </div>
        ))}
        {busy && <div className="text-sm text-muted">Gemma is investigating…</div>}
        <div ref={end} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={e => setInput(e.target.value)} disabled={disabled} placeholder={disabled ? "Run an audit first" : "Why is the model showing disparity?"}
          className="min-w-0 flex-1 border border-line px-3 py-2 text-sm" />
        <button disabled={disabled || busy} className="bg-ink px-4 text-sm font-medium text-white disabled:opacity-50">Ask</button>
      </form>
    </section>
  );
}
