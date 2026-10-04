import numpy as np, pandas as pd

def clean(o):
    """Recursively convert numpy/pandas objects to JSON-safe Python types."""
    if isinstance(o, dict): return {str(k): clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [clean(v) for v in o]
    if isinstance(o, np.generic): o = o.item()
    if isinstance(o, float): return None if (o != o or o in (float("inf"), float("-inf"))) else round(o, 4)
    if isinstance(o, pd.Timestamp): return str(o)
    return o

def resolve_pos_label(model, y, requested=None):
    """Pick the positive class (matched by string form against model classes)."""
    mc = getattr(model, "classes_", None)
    classes = list(mc) if mc is not None else sorted(pd.unique(y), key=str)
    if requested is not None:
        for c in classes:
            if str(c) == str(requested): return c
    return classes[-1]

def predict_binary(model, X, pos_label):
    return (np.asarray(model.predict(X)).astype(str) == str(pos_label)).astype(int)

def predict_proba_pos(model, X, pos_label):
    if not hasattr(model, "predict_proba"): return None
    idx = [str(c) for c in model.classes_].index(str(pos_label))
    return model.predict_proba(X)[:, idx]
