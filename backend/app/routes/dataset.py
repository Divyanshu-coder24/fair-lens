import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..state import STATE

router = APIRouter(prefix="/api")

@router.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        df = pd.read_csv(io.BytesIO(await file.read()), skipinitialspace=True)
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")
    STATE.update(df=df, dataset_name=(file.filename or "dataset").rsplit(".", 1)[0], audit=None, cfg=None)
    return {"dataset": STATE["dataset_name"], "columns": df.columns.tolist(), "rows": len(df)}
