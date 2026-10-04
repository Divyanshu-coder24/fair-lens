from fastapi import APIRouter
from ..schemas.audit import AuditRequest
from .. import service

router = APIRouter(prefix="/api")

@router.post("/audit")
def audit(req: AuditRequest):
    return service.run_audit(req.target_column, req.sensitive_column, req.positive_label, req.include_sensitive_in_features)
