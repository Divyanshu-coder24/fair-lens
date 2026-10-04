from fastapi import APIRouter, HTTPException
from ..schemas.audit import ChatRequest
from ..state import STATE
from ..agent import gemma

router = APIRouter(prefix="/api/agent")

def _guard():
    if not STATE["audit"]: raise HTTPException(400, "Run an audit first.")

def _wrap(fn, *a):
    try: return fn(*a)
    except RuntimeError as e: raise HTTPException(503, str(e))
    except HTTPException: raise
    except Exception as e: raise HTTPException(502, f"Gemma request failed: {e}")

@router.post("/audit")
def agent_audit():
    _guard(); return _wrap(gemma.audit_report)

@router.post("/chat")
def agent_chat(req: ChatRequest):
    _guard(); return _wrap(gemma.chat, req.message, [h.model_dump() for h in req.history][-10:])
