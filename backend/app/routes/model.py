from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from ..state import STATE
from ..models.loader import load_model

router = APIRouter(prefix="/api")
ROOT = Path(__file__).resolve().parents[3]  # project root

@router.post("/model/upload")
async def upload_model(file: UploadFile = File(...)):
    try:
        STATE["model"] = load_model(await file.read(), file.filename or "model.joblib")
    except Exception as e:
        raise HTTPException(400, f"Could not load model: {e}")
    STATE.update(model_name=file.filename, audit=None, cfg=None)
    return {"model": file.filename, "has_predict_proba": hasattr(STATE["model"], "predict_proba")}

@router.post("/demo/load")
def load_demo():
    mp, dp = ROOT / "models/demo_model.joblib", ROOT / "data/demo/adult.csv"
    if not (mp.exists() and dp.exists()):
        raise HTTPException(404, "Demo files missing. Run: python scripts/prepare_demo.py")
    import joblib
    STATE.update(model=joblib.load(mp), model_name="Adult Income · Logistic Regression",
                 df=pd.read_csv(dp), dataset_name="adult_income", audit=None, cfg=None)
    return {"model": STATE["model_name"], "dataset": STATE["dataset_name"],
            "columns": STATE["df"].columns.tolist(), "rows": len(STATE["df"]),
            "suggested": {"target": "income", "sensitive": "sex"}}
