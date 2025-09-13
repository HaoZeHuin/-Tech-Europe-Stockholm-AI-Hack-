from fastapi import APIRouter, Query
from pydantic import BaseModel

try:
    from db.memory_bank import update_memory, list_categories
except Exception:
    from memory_bank import update_memory, list_categories

router = APIRouter(prefix="/memory", tags=["memory"])

class MemoryUpdateReq(BaseModel):
    category: str
    top_k: int = 24

@router.get("/categories")
def memory_categories():
    return {"categories": list_categories()}

@router.post("/update")
def memory_update(req: MemoryUpdateReq):
    return update_memory(category=req.category, top_k=req.top_k)

# handy GET for quick manual testing
@router.get("/update")
def memory_update_get(category: str = Query(...), top_k: int = 24):
    return update_memory(category=category, top_k=top_k)
