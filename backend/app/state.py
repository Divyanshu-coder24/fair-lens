"""In-memory single-user state (MVP: no database)."""
STATE = {
    "model": None, "model_name": None,
    "df": None, "dataset_name": None,
    "cfg": None,       # target, sensitive, pos_label, include_sensitive
    "audit": None,     # last audit evidence
}
