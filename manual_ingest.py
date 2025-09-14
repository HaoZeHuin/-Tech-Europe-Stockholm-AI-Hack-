# manual_ingest.py — ensure schema + ingest uploads/ by default
import os, re, sys, pathlib
from typing import List, Dict
from dotenv import load_dotenv
from openai import OpenAI
import weaviate
from weaviate.classes.config import Property, DataType, Configure
from pypdf import PdfReader

load_dotenv()

# === Config ===
OAI = OpenAI()
COLLECTION = os.getenv("DOC_COLLECTION", "JarvisDocs")
UPLOADS_DIR = pathlib.Path(os.getenv("UPLOADS_DIR", "uploads"))

# === Weaviate connection ===
def connect():
    url = os.getenv("WEAVIATE_URL")
    api_key = os.getenv("WEAVIATE_API_KEY")
    if not url:
        raise RuntimeError("WEAVIATE_URL missing")
    if not url.startswith("http"):
        url = "https://" + url
    if api_key:
        return weaviate.connect_to_wcs(
            cluster_url=url,
            auth_credentials=weaviate.auth.AuthApiKey(api_key)
        )
    return weaviate.connect_to_local(host=url)

def ensure_collection(client: weaviate.WeaviateClient):
    names = [c.name for c in client.collections.list_all()]
    if COLLECTION in names:
        return client.collections.get(COLLECTION)
    print(f"[setup] Creating collection {COLLECTION} with BYO vectors...")
    return client.collections.create(
        name=COLLECTION,
        vectorizer_config=Configure.Vectorizer.none(),  # BYO vectors
        properties=[
            Property(name="text", data_type=DataType.TEXT),
            Property(name="source_path", data_type=DataType.TEXT),
            Property(name="page", data_type=DataType.INT),
        ],
    )

# === Helpers ===
def chunk_text(text: str, size: int = 1000, overlap: int = 200) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    out, i = [], 0
    while i < len(text):
        end = min(len(text), i + size)
        out.append(text[i:end])
        i = max(0, end - overlap)
    return out

def embed_texts(texts: List[str]) -> List[List[float]]:
    vecs: List[List[float]] = []
    B = 64
    for i in range(0, len(texts), B):
        batch = texts[i:i+B]
        res = OAI.embeddings.create(model="text-embedding-3-large", input=batch)
        vecs.extend([d.embedding for d in res.data])
    return vecs

def read_md(path: str) -> str:
    return pathlib.Path(path).read_text(encoding="utf-8", errors="ignore")

def read_pdf_pages(path: str) -> List[Dict]:
    reader = PdfReader(path)
    out = []
    for idx, page in enumerate(reader.pages, start=1):
        txt = page.extract_text() or ""
        if txt.strip():
            out.append({"text": txt, "page": idx})
    return out

def insert_chunks(chunks: List[Dict]) -> int:
    """Insert [{text, source_path, page?}] with BYO vectors into COLLECTION."""
    if not chunks:
        return 0
    texts = [c["text"] for c in chunks]
    vectors = embed_texts(texts)
    with connect() as client:
        col = ensure_collection(client)
        B = 128
        total = 0
        for i in range(0, len(chunks), B):
            batch = chunks[i:i+B]
            props_batch = []
            for c in batch:
                props = {"text": c["text"], "source_path": c.get("source_path")}
                if c.get("page") is not None:
                    props["page"] = c["page"]
                props_batch.append(props)
            col.data.insert_many(properties=props_batch, vectors=vectors[i:i+B])
            total += len(props_batch)

        # quick sample fetch to verify visibility
        try:
            res = col.query.near_text(
                query="test",
                limit=1,
                return_properties=["text", "source_path", "page"]
            )
            if res.objects:
                p = res.objects[0].properties
                print(f"[verify] sample object: source={p.get('source_path')} page={p.get('page')}")
        except Exception:
            pass

        return total

def ingest_text(text: str, source_path: str = "manual://input", page: int | None = None) -> int:
    chunks = [{"text": t, "source_path": source_path, "page": page} for t in chunk_text(text)]
    return insert_chunks(chunks)

def ingest_path(path: str) -> int:
    p = pathlib.Path(path)
    if not p.exists():
        raise FileNotFoundError(path)

    if p.is_dir():
        total = 0
        for sub in p.rglob("*"):
            if sub.suffix.lower() == ".md":
                total += ingest_text(read_md(str(sub)), source_path=str(sub))
            elif sub.suffix.lower() == ".pdf":
                for pg in read_pdf_pages(str(sub)):
                    total += ingest_text(pg["text"], source_path=str(sub), page=pg["page"])
        return total

    if p.suffix.lower() == ".md":
        return ingest_text(read_md(str(p)), source_path=str(p))
    if p.suffix.lower() == ".pdf":
        total = 0
        for pg in read_pdf_pages(str(p)):
            total += ingest_text(pg["text"], source_path=str(p), page=pg["page"])
        return total

    raise ValueError("Only .md and .pdf are supported")

# === CLI ===
if __name__ == "__main__":
    if len(sys.argv) == 1:
        target = UPLOADS_DIR
        if not target.exists():
            print(f"uploads/ not found at: {target.resolve()}")
            sys.exit(1)
        n = ingest_path(str(target))
        print(f"Ingested {n} chunks from folder: {target}")
        sys.exit(0)

    if sys.argv[1] == "--text":
        text = " ".join(sys.argv[2:]) or "Hello from manual ingest."
        n = ingest_text(text, source_path="manual://cli")
        print(f"Ingested {n} chunks from raw text")
        sys.exit(0)

    target = pathlib.Path(sys.argv[1])
    if not target.exists():
        print(f"Path not found: {target.resolve()}")
        sys.exit(1)
    n = ingest_path(str(target))
    msg = "folder" if target.is_dir() else "file"
    print(f"Ingested {n} chunks from {msg}: {target}")

import os, weaviate
from weaviate.classes.config import Property, DataType, Configure

url=os.getenv("WEAVIATE_URL"); key=os.getenv("WEAVIATE_API_KEY")
client = weaviate.connect_to_wcs(cluster_url=url, auth_credentials=weaviate.auth.AuthApiKey(key))
print([c.name for c in client.collections.list_all()])  # should list your collections
client.close()
