def group_analysis(metrics: dict) -> dict:
    """Per-group performance table plus group sizes."""
    return {"positive_label": metrics["positive_label"], "groups": metrics["group_metrics"]}

def compare_groups(metrics: dict) -> dict:
    """Largest observed gap per metric, with the groups involved."""
    gm, out = metrics["group_metrics"], []
    for m in ["selection_rate", "accuracy", "true_positive_rate", "false_positive_rate"]:
        vals = {g: v[m] for g, v in gm.items() if v.get(m) is not None}
        if len(vals) < 2: continue
        hi, lo = max(vals, key=vals.get), min(vals, key=vals.get)
        out.append({"metric": m, "highest_group": hi, "highest_value": round(vals[hi], 4),
                    "lowest_group": lo, "lowest_value": round(vals[lo], 4),
                    "gap": round(vals[hi] - vals[lo], 4)})
    out.sort(key=lambda r: r["gap"], reverse=True)
    return {"largest_disparities": out}
