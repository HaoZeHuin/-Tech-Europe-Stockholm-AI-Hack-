# Stores per-category summaries in Weaviate and uses them for future sweeps
import os
from typing import List, Dict
from dotenv import load_dotenv
from openai import OpenAI
import weaviate

load_dotenv()
OAI = OpenAI()

CATEGORIES = ["relationships", "preferences", "working_style", "diet", "hobbies", "career", "custom"]
DOC_COLLECTION  = os.getenv("DOC_COLLECTION",  "JarvisDocs")     # doc chunks
BANK_COLLECTION = os.getenv("BANK_COLLECTION", "MemoryBanks")    # memory summaries

def _connect():
    url = os.getenv("WEAVIATE_URL")
    api_key = os.getenv("WEAVIATE_API_KEY")
    if not url:
        raise RuntimeError("WEAVIATE_URL is missing")
    if not url.startswith("http"):
        url = "https://" + url
    if api_key:
        return weaviate.connect_to_wcs(
            cluster_url=url, auth_credentials=weaviate.auth.AuthApiKey(api_key)
        )
    return weaviate.connect_to_local(host=url)

def _ensure_bank_collection(client: weaviate.WeaviateClient):
    from weaviate.classes.config import Property, DataType, Configure
    names = [c.name for c in client.collections.list_all()]
    if BANK_COLLECTION in names:
        return client.collections.get(BANK_COLLECTION)
    return client.collections.create(
        name=BANK_COLLECTION,
        vectorizer_config=Configure.Vectorizer.none(),
        properties=[
            Property(name="text",        data_type=DataType.TEXT),
            Property(name="category",    data_type=DataType.TEXT),
            Property(name="updated_at",  data_type=DataType.DATE),
            Property(name="source_path", data_type=DataType.TEXT),
            Property(name="page",        data_type=DataType.INT),
        ],
    )

def _embed(texts: List[str]) -> List[List[float]]:
    res = OAI.embeddings.create(model="text-embedding-3-large", input=texts)
    return [d.embedding for d in res.data]

def _search_semantic(query: str, top_k_each: int = 12) -> List[Dict]:
    qv = _embed([query])[0]
    out: List[Dict] = []
    with _connect() as client:
        # docs
        try:
            docs = client.collections.get(DOC_COLLECTION)
            r = docs.query.near_vector(
                near_vector=qv, limit=top_k_each, return_properties=["text", "source_path", "page"]
            )
            for o in (r.objects or []):
                p = o.properties
                out.append({"text": p.get("text", ""), "source_path": p.get("source_path"), "page": p.get("page")})
        except Exception:
            pass
        # bank
        try:
            banks = _ensure_bank_collection(client)
            r2 = banks.query.near_vector(
                near_vector=qv, limit=top_k_each, return_properties=["text", "category", "updated_at", "source_path", "page"]
            )
            for o in (r2.objects or []):
                p = o.properties
                out.append({
                    "text": p.get("text", ""),
                    "source_path": p.get("source_path") or f"memory://{p.get('category','bank')}",
                    "page": p.get("page"),
                })
        except Exception:
            pass
    return out

def _summarize(category: str, chunks: List[Dict]) -> str:
    ctx = "\n\n".join(
        f"Source: {c.get('source_path')} (p.{c.get('page')})\n{c.get('text')}"
        for c in chunks if c.get("text")
    )[:12000]
    prompt = f"""You are Jarvis. Based on the context, write a concise summary of the user's **{category}**.
Use short bullets (≤ 12 words), group logically, avoid speculation/duplicates. If nothing relevant, output one line: (No {category} info found).

Context:
{ctx if ctx else "(none)"}"""
    resp = OAI.chat.completions.create(
        model="gpt-5",
        messages=[{"role":"system","content":"Be crisp and factual."},
                  {"role":"user","content":prompt}],
        temperature=0.2,
    )
    return (resp.choices[0].message.content or "").strip()

def list_categories() -> List[str]:
    return CATEGORIES

def update_memory(category: str, top_k: int = 24) -> Dict:
    """Sweep docs + prior bank summaries semantically, store & return a fresh summary for `category`."""
    cat = (category or "custom").strip().lower()
    if cat not in CATEGORIES:
        cat = "custom"

    hits = _search_semantic(cat, top_k_each=max(6, top_k // 2))
    summary = _summarize(cat, hits)

    # write summary back into BANK collection
    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()
    vec = _embed([summary])[0]
    with _connect() as client:
        banks = _ensure_bank_collection(client)
        banks.data.insert(
            properties={
                "text": summary,
                "category": cat,
                "updated_at": now_iso,
                "source_path": f"memory://{cat}",
                "page": None,
            },
            vector=vec,
        )

    return {"category": cat, "hits": len(hits), "summary": summary}

if __name__ == "__main__":
    import sys
    cat = sys.argv[1] if len(sys.argv) > 1 else "preferences"
    out = update_memory(cat)
    print(f"\n=== {out['category'].upper()} (hits={out['hits']}) ===\n{out['summary']}\n")
