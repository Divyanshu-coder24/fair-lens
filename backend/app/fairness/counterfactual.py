import numpy as np, pandas as pd
from ..util import predict_binary, predict_proba_pos

def _alt_value(values, current):
    others = [v for v in values if str(v) != str(current)]
    return others[0] if others else current

def run_counterfactual(model, sample: pd.DataFrame, sensitive_feature, alternate_value, pos_label) -> dict:
    """Change ONLY the sensitive feature on a single-row frame and compare predictions."""
    cf = sample.copy(); cf[sensitive_feature] = alternate_value
    p0, p1 = predict_binary(model, sample, pos_label)[0], predict_binary(model, cf, pos_label)[0]
    q0, q1 = predict_proba_pos(model, sample, pos_label), predict_proba_pos(model, cf, pos_label)
    return {
        "changed_feature": sensitive_feature,
        "original_value": sample[sensitive_feature].iloc[0], "counterfactual_value": alternate_value,
        "original_prediction": int(p0), "counterfactual_prediction": int(p1),
        "original_probability": None if q0 is None else float(q0[0]),
        "counterfactual_probability": None if q1 is None else float(q1[0]),
        "prediction_changed": bool(p0 != p1),
    }

def run_counterfactual_batch(model, X: pd.DataFrame, feature, n, pos_label, seed=42) -> dict:
    """Sample borderline + random rows across groups (seeded), flip `feature`, aggregate."""
    rng = np.random.default_rng(seed)
    n = int(max(1, min(n, len(X))))
    X = X.reset_index(drop=True)
    proba = predict_proba_pos(model, X, pos_label)
    border = np.abs(proba - 0.5) if proba is not None else rng.random(len(X))
    idx, groups = [], X[feature].astype(str)
    glist = sorted(groups.unique())
    per = max(1, n // len(glist))
    for g in glist:  # half borderline, half random, per group
        gi = np.where(groups.values == g)[0]
        gi_sorted = gi[np.argsort(border[gi], kind="stable")]
        take_b = list(gi_sorted[: (per + 1) // 2])
        rest = [i for i in gi if i not in set(take_b)]
        take_r = list(rng.choice(rest, size=min(len(rest), per - len(take_b)), replace=False)) if rest else []
        idx += take_b + take_r
    idx = idx[:n]
    orig = X.iloc[idx].copy(); cf = orig.copy()
    vals = X[feature].value_counts().index.tolist()
    cf[feature] = [_alt_value(vals, v) for v in orig[feature]]
    p0, p1 = predict_binary(model, orig, pos_label), predict_binary(model, cf, pos_label)
    q0, q1 = predict_proba_pos(model, orig, pos_label), predict_proba_pos(model, cf, pos_label)
    changed = np.where(p0 != p1)[0]
    shown_cols = [c for c in X.columns if c != feature][:6]
    unchanged = [i for i in range(len(idx)) if p0[i] == p1[i]]
    examples = []
    for k in list(changed[:6]) + unchanged[: max(0, 6 - len(changed))]:
        examples.append({
            "context": {c: orig.iloc[k][c] for c in shown_cols},
            "changed_feature": feature, "original_value": orig.iloc[k][feature], "counterfactual_value": cf.iloc[k][feature],
            "original_prediction": int(p0[k]), "counterfactual_prediction": int(p1[k]),
            "original_probability": None if q0 is None else float(q0[k]),
            "counterfactual_probability": None if q1 is None else float(q1[k]),
            "prediction_changed": bool(p0[k] != p1[k]),
        })
    by_group = {}
    for g in glist:
        m = (orig[feature].astype(str).values == g)
        if m.sum(): by_group[g] = {"tested": int(m.sum()), "changed": int((p0 != p1)[m].sum())}
    return {"feature": feature, "samples_tested": len(idx), "prediction_changes": int(len(changed)),
            "counterfactual_change_rate": float(len(changed) / max(1, len(idx))),
            "changes_by_original_group": by_group, "examples": examples,
            "note": "A changed prediction indicates counterfactual sensitivity, not proof of causal discrimination."}
