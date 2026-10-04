# FairLens — See what accuracy can't.

Python computes. Gemma reasons. FairLens runs deterministic fairness + counterfactual tests, then lets **Gemma 4** (Gemini API, function calling) investigate the evidence.

## Run

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env          # add GEMINI_API_KEY
python ../scripts/prepare_demo.py   # builds data/demo/adult.csv + models/demo_model.joblib
uvicorn app.main:app --reload --port 8000