import numpy as np
from fairlearn.metrics import (MetricFrame, selection_rate, true_positive_rate, false_positive_rate,
    demographic_parity_difference, demographic_parity_ratio, equalized_odds_difference)
from sklearn.metrics import accuracy_score
from ..util import predict_binary, resolve_pos_label

def calculate_metrics(model, X, y, sensitive_features, pos_label=None) -> dict:
    """Deterministic metrics. Python is the only source of numbers."""
    pos = resolve_pos_label(model, y, pos_label)
    y_true = (np.asarray(y).astype(str) == str(pos)).astype(int)
    y_pred = predict_binary(model, X, pos)
    A = np.asarray(sensitive_features).astype(str)
    mf = MetricFrame(
        metrics={"selection_rate": selection_rate, "accuracy": accuracy_score,
                 "true_positive_rate": true_positive_rate, "false_positive_rate": false_positive_rate},
        y_true=y_true, y_pred=y_pred, sensitive_features=A)
    groups = {}
    for g, row in mf.by_group.iterrows():
        groups[str(g)] = {k: float(v) for k, v in row.items()}
        groups[str(g)]["count"] = int((A == str(g)).sum())
    return {
        "positive_label": str(pos),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "demographic_parity_difference": float(demographic_parity_difference(y_true, y_pred, sensitive_features=A)),
        "demographic_parity_ratio": float(demographic_parity_ratio(y_true, y_pred, sensitive_features=A)),
        "equalized_odds_difference": float(equalized_odds_difference(y_true, y_pred, sensitive_features=A)),
        "group_metrics": groups,
    }
