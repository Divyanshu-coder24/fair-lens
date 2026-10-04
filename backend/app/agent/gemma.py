import json, os, re
from . import tools
from .prompts import SYSTEM_PROMPT, AUDIT_INSTRUCTION
from ..service import evidence_summary

MAX_STEPS = 5

def _client():
    from google import genai
    key = os.getenv("GEMINI_API_KEY")
    if not key: raise RuntimeError("GEMINI_API_KEY is not set on the server.")
    return genai.Client(api_key=key)

def _generate(client, types, contents):
    cfg = dict(tools=[types.Tool(function_declarations=tools.declarations(types))],
               automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
               temperature=0.2, system_instruction=SYSTEM_PROMPT)
    last = None
    for model in (os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it"), os.getenv("GEMMA_FALLBACK_MODEL", "gemma-4-31b-it")):
        try:
            return client.models.generate_content(model=model, contents=contents, config=types.GenerateContentConfig(**cfg))
        except Exception as e:
            last = e
    raise last

def run_agent(user_text, history=None):
    """Tool-calling loop. Returns (final_text, tool_trace)."""
    from google.genai import types
    client = _client()
    contents = [types.Content(role=h["role"], parts=[types.Part.from_text(text=h["text"])]) for h in (history or [])]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_text)]))
    trace = []
    for _ in range(MAX_STEPS):
        resp = _generate(client, types, contents)
        calls = resp.function_calls or []
        if not calls:
            return (resp.text or "").strip(), trace
        contents.append(resp.candidates[0].content)
        parts = []
        for c in calls:
            args = dict(c.args or {})
            result = tools.execute(c.name, args)
            trace.append({"tool": c.name, "args": args})
            parts.append(types.Part.from_function_response(name=c.name, response={"result": result}))
        contents.append(types.Content(role="user", parts=parts))
    return "I reached the tool-call limit before finishing. Please ask a narrower question.", trace

def _parse_json(text):
    t = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    try: return json.loads(t)
    except Exception:
        m = re.search(r"\{.*\}", t, re.S)
        if m:
            try: return json.loads(m.group(0))
            except Exception: pass
    return None

def audit_report():
    ev = evidence_summary()
    text, trace = run_agent(AUDIT_INSTRUCTION + json.dumps(ev, indent=2))
    report = _parse_json(text) or {"summary": text, "key_findings": [], "evidence": [],
        "counterfactual_observation": "", "recommended_investigations": [],
        "limitations": ["Model output was not valid JSON; showing raw text."]}
    return {"report": report, "tool_trace": trace}

def chat(message, history):
    ev = evidence_summary()
    ctx = [{"role": "user", "text": "Current audit evidence (JSON):\n" + json.dumps(ev)},
           {"role": "model", "text": "Understood. I will use only this evidence and tool results."}]
    text, trace = run_agent(message, ctx + history)
    return {"reply": text, "tool_trace": trace}
