from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import model, dataset, audit, counterfactual, agent

app = FastAPI(title="FairLens")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
for r in (model, dataset, audit, counterfactual, agent):
    app.include_router(r.router)

@app.get("/api/health")
def health(): return {"ok": True}
