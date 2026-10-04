import io, joblib, pickle

def load_model(raw: bytes, filename: str):
    """Load a scikit-learn model. WARNING: pickles can execute code — trusted files only."""
    buf = io.BytesIO(raw)
    model = pickle.load(buf) if filename.endswith(".pkl") else joblib.load(buf)
    if not hasattr(model, "predict"):
        raise ValueError("Uploaded object has no predict() method.")
    return model
