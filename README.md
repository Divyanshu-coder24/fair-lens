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

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Demo path
Load demo → target `income`, sensitive `sex` → Run audit → Run probe → ask "Why is this happening and what should I investigate?"

## Custom model
Upload a `.joblib`/`.pkl` scikit-learn **Pipeline** (raw CSV columns in, `predict` out; `predict_proba` optional). Only upload files you trust — pickles execute code on load.

## API
`POST /api/model/upload` · `POST /api/dataset/upload` · `POST /api/demo/load` · `POST /api/audit` · `POST /api/counterfactual` · `POST /api/agent/audit` · `POST /api/agent/chat`

A changed prediction is evidence of counterfactual sensitivity, not proof of causal discrimination.
