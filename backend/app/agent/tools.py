from .. import service
from ..state import STATE
from ..fairness.groups import group_analysis, compare_groups

def _metrics():
    if not STATE["audit"]: raise ValueError("No audit has been run yet.")
    return STATE["audit"]["metrics"]

def get_fairness_metrics():
    m = _metrics()
    return {k: m[k] for k in ("accuracy", "positive_label", "demographic_parity_difference",
                              "demographic_parity_ratio", "equalized_odds_difference")}

def get_group_analysis(): return group_analysis(_metrics())
def compare_groups_tool(): return compare_groups(_metrics())

def run_counterfactual_probe(feature=None, sample_count=50):
    r = service.probe(feature, int(sample_count or 50))
    r["examples"] = r["examples"][:3]  # keep tool output compact
    return r

REGISTRY = {"get_fairness_metrics": get_fairness_metrics, "get_group_analysis": get_group_analysis,
            "run_counterfactual_probe": run_counterfactual_probe, "compare_groups": compare_groups_tool}

def execute(name, args):
    try:
        if name not in REGISTRY: return {"error": f"Unknown tool {name}"}
        return REGISTRY[name](**(args or {}))
    except Exception as e:
        return {"error": str(getattr(e, "detail", e))}

def declarations(types):
    S, T = types.Schema, types.Type
    empty = S(type=T.OBJECT, properties={})
    return [
        types.FunctionDeclaration(name="get_fairness_metrics", description="Returns current accuracy, demographic parity and equalized odds metrics.", parameters=empty),
        types.FunctionDeclaration(name="get_group_analysis", description="Returns performance (selection rate, accuracy, TPR, FPR, size) per sensitive group.", parameters=empty),
        types.FunctionDeclaration(name="run_counterfactual_probe", description="Runs additional counterfactual tests by flipping a feature (default: the sensitive attribute) on sampled rows.",
            parameters=S(type=T.OBJECT, properties={"feature": S(type=T.STRING, description="Feature to flip, e.g. the sensitive attribute"),
                                                    "sample_count": S(type=T.INTEGER, description="Number of rows to test (10-200)")})),
        types.FunctionDeclaration(name="compare_groups", description="Returns the largest observed group-level disparities per metric.", parameters=empty),
    ]
