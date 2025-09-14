import os, re, pathlib
from typing import List, Dict, Iterable
from pypdf import PdfReader
from openai import OpenAI
import weaviate
from weaviate.classes.config import Property, DataType, Configure
from dotenv import load_dotenv

load_dotenv()
OAI = OpenAI()

COLLECTION = os.getenv("DOC_COLLECTION", "JarvisDocs")

def connect_weaviate():
    url = os.getenv("WEAVIATE_URL")
    api_key = os.getenv("WEAVIATE_API_KEY")
    if not url:
        raise RuntimeError("WEAVIATE_URL missing")
    if not url.startswith("http"):
        url = "https://" + url
    if api_key:
        return weaviate.connect_to_wcs(
            cluster_url=url, auth_credentials=weaviate.auth.AuthApiKey(api_key)
        )
    return weaviate.connect_to_local(host=url)  # e.g., http://localhost:8080

def ensure_collection(client: weaviate.WeaviateClient):
    names = [c.name for c in client.collections.list_all()]
    if COLLECTION in names:
        return client.collections.get(COLLECTION)
    return client.collections.create(
        name=COLLECTION,
        vectorizer_config=Configure.Vectorizer.none(),  # BYO vectors
        properties=[
            Property(name="text",        data_type=DataType.TEXT),
            Property(name="source_path", data_type=DataType.TEXT),
            Property(name="page",        data_type=DataType.INT),
        ],
    )

def chunk_text(text: str, size: int = 1000, overlap: int = 200) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    chunks, i = [], 0
    while i < len(text):
        end = min(len(text), i + size)
        chunks.append(text[i:end])
        i = max(0, end - overlap)
    return chunks

def read_markdown(path: str) -> str:
    return pathlib.Path(path).read_text(encoding="utf-8", errors="ignore")

def read_pdf(path: str) -> List[Dict]:
    reader = PdfReader(path)
    out = []
    for idx, page in enumerate(reader.pages, start=1):
        txt = page.extract_text() or ""
        if txt.strip():
            out.append({"text": txt, "page": idx})
    return out

def embed_texts(texts: List[str]) -> List[List[float]]:
    vecs: List[List[float]] = []
    B = 64
    for i in range(0, len(texts), B):
        batch = texts[i:i+B]
        res = OAI.embeddings.create(model="text-embedding-3-large", input=batch)
        vecs.extend([d.embedding for d in res.data])
    return vecs

def ingest_paths(paths: Iterable[str]) -> int:
    """Ingest .md and .pdf into Weaviate with OpenAI embeddings."""
    count = 0
    with connect_weaviate() as client:
        col = ensure_collection(client)
        to_insert: List[Dict] = []

        for raw in paths:
            p = pathlib.Path(raw)
            if p.is_dir():
                for sub in p.rglob("*"):
                    if sub.suffix.lower() in [".md", ".pdf"]:
                        count += _prepare_file(sub, to_insert)
            else:
                count += _prepare_file(p, to_insert)

        if to_insert:
            embeds = embed_texts([item["text"] for item in to_insert])
            B = 128
            for i in range(0, len(to_insert), B):
                batch_objs = to_insert[i:i+B]
                batch_vecs = embeds[i:i+B]
                props = []
                for obj in batch_objs:
                    d = {"text": obj["text"], "source_path": obj["source_path"]}
                    if "page" in obj and obj["page"] is not None:
                        d["page"] = obj["page"]
                    props.append(d)
                col.data.insert_many(properties=props, vectors=batch_vecs)
    return count

def _prepare_file(p: pathlib.Path, out_objs: List[Dict]) -> int:
    added = 0
    if p.suffix.lower() == ".md":
        text = read_markdown(str(p))
        for ch in chunk_text(text):
            out_objs.append({"text": ch, "source_path": str(p)})
            added += 1
    elif p.suffix.lower() == ".pdf":
        pages = read_pdf(str(p))
        for pg in pages:
            for ch in chunk_text(pg["text"]):
                out_objs.append({"text": ch, "source_path": str(p), "page": pg["page"]})
                added += 1
    return added

def search(query: str, top_k: int = 6) -> List[Dict]:
    """Return [{text, source_path, page}] most similar to the query."""
    q_vec = embed_texts([query])[0]
    with connect_weaviate() as client:
        try:
            col = client.collections.get(COLLECTION)
        except Exception:
            return []
        res = col.query.near_vector(
            near_vector=q_vec, limit=top_k, return_properties=["text", "source_path", "page"]
        )
        hits: List[Dict] = []
        for o in (res.objects or []):
            p = o.properties
            hits.append({"text": p.get("text", ""), "source_path": p.get("source_path"), "page": p.get("page")})
        return hits
