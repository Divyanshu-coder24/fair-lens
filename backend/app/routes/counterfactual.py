from fastapi import APIRouter
from ..schemas.audit import CounterfactualRequest
from .. import service

router = APIRouter(prefix="/api")

@router.post("/counterfactual")
def counterfactual(req: CounterfactualRequest):
    return service.probe(req.feature, req.sample_count)
