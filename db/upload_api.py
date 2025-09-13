# db/upload_api.py — file upload + ingest (lives in db/)
import os
import pathlib
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException

from .weaviate_utils import ingest_paths  # same package, clean import

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
pathlib.Path(UPLOADS_DIR).mkdir(parents=True, exist_ok=True)

ALLOWED_EXTS = {".pdf", ".md"}

@router.post("/files")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more .pdf/.md files, save to disk, then ingest into Weaviate.
    Returns saved paths and count of ingested chunks.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    saved: List[str] = []
    for f in files:
        ext = pathlib.Path(f.filename).suffix.lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
        out_path = pathlib.Path(UPLOADS_DIR) / f.filename
        out_path.write_bytes(await f.read())
        saved.append(str(out_path))

    ingested = ingest_paths(saved)
    return {"saved": saved, "ingested_chunks": ingested}
