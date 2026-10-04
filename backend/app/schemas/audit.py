from typing import Optional
from pydantic import BaseModel

class AuditRequest(BaseModel):
    target_column: str
    sensitive_column: str
    positive_label: Optional[str] = None
    include_sensitive_in_features: bool = True

class CounterfactualRequest(BaseModel):
    feature: Optional[str] = None
    sample_count: int = 50

class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
