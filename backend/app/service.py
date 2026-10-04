"""Shared orchestration used by routes and by Gemma's tools."""
import pandas as pd
from fastapi import HTTPException
from .state import STATE
from .util import clean, resolve_pos_label
from .fairness.metrics import calculate_metrics
from .fairness.groups import group_analysis, compare_groups
from .fairness.counterfactual import run_counterfactual_batch

CF_DEFAULT_N = 100

def features_frame():
    cfg, df, model = STATE["cfg"], STATE["df"], STATE["model"]
    X = df.drop(columns=[cfg["target"]])
    if hasattr(model, "feature_names_in_"):
        missing = [c for c in model.feature_names_in_ if c not in X.columns]
        if missing: raise HTTPException(400, f"Dataset is missing model features: {missing}")
        X = X[list(model.feature_names_in_)]
    elif not cfg["include_sensitive"]:
        X = X.drop(columns=[cfg["sensitive"]])
    return X

def require_ready():
    if STATE["model"] is None or STATE["df"] is None:
        raise HTTPException(400, "Load a model and a dataset first.")

def run_audit(target, sensitive, positive_label=None, include_sensitive=True):
    require_ready()
    df = STATE["df"]
    for c in (target, sensitive):
        if c not in df.columns: raise HTTPException(400, f"Column '{c}' not in dataset.")
    pos = resolve_pos_label(STATE["model"], df[target], positive_label)
    STATE["cfg"] = {"target": target, "sensitive": sensitive, "pos_label": pos, "include_sensitive": include_sensitive}
    X = features_frame()
    try:
        m = calculate_metrics(STATE["model"], X, df[target], df[sensitive], pos)
        cf = run_counterfactual_batch(STATE["model"], X, sensitive, CF_DEFAULT_N, pos) if sensitive in X.columns else None
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(400, f"Model could not score this dataset: {e}")
    audit = clean({
        "audit_id": "demo-001", "model": STATE["model_name"], "dataset": STATE["dataset_name"],
        "target": target, "sensitive_attribute": sensitive, "rows": len(df),
        "metrics": m, "groups": group_analysis(m)["groups"], "comparison": compare_groups(m),
        "counterfactual": cf,
        "counterfactual_note": None if cf else "Sensitive attribute is not a model input, so direct counterfactual flipping is not applicable.",
    })
    STATE["audit"] = audit
    return audit

def probe(feature=None, n=50):
    require_ready()
    if STATE["audit"] is None: raise HTTPException(400, "Run an audit first.")
    cfg = STATE["cfg"]; feature = feature or cfg["sensitive"]
    X = features_frame()
    if feature not in X.columns: raise HTTPException(400, f"'{feature}' is not a model input feature.")
    return clean(run_counterfactual_batch(STATE["model"], X, feature, n, cfg["pos_label"]))

def evidence_summary():
    a = STATE["audit"]
    if not a: return None
    cf = a.get("counterfactual") or {}
    return {k: a[k] for k in ("model", "dataset", "target", "sensitive_attribute")} | {
        "accuracy": a["metrics"]["accuracy"], "positive_label": a["metrics"]["positive_label"],
        "fairness": {k: a["metrics"][k] for k in ("demographic_parity_difference", "demographic_parity_ratio", "equalized_odds_difference")},
        "groups": a["groups"],
        "counterfactual": {k: cf.get(k) for k in ("samples_tested", "prediction_changes", "counterfactual_change_rate")} if cf else None}
