from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import weaviate
import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
# Import shared contracts
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from contracts import ToolExecutionRequest, RagSearchParams, RagSearchResult, RagChunk

load_dotenv()

app = FastAPI(
    title="Jarvis RAG Service",
    description="Python microservice for Weaviate vector database and RAG functionality",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Weaviate client
weaviate_client = weaviate.Client(
    url=os.getenv("WEAVIATE_URL", "http://localhost:8080"),
    auth_client_secret=weaviate.AuthApiKey(api_key=os.getenv("WEAVIATE_API_KEY")) if os.getenv("WEAVIATE_API_KEY") else None,
    additional_headers={
        "X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")
    } if os.getenv("OPENAI_API_KEY") else None
)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Test Weaviate connection
        weaviate_client.schema.get()
        weaviate_status = "connected"
    except Exception as e:
        weaviate_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "rag-service",
        "version": "1.0.0",
        "weaviate_status": weaviate_status
    }

@app.post("/tools/rag_search")
async def rag_search(request: ToolExecutionRequest):
    """Execute RAG search using Weaviate"""
    try:
        params = request.parameters
        query = params.get("query", "")
        top_k = params.get("top_k", 5)
        filter_paths = params.get("filter_paths", [])
        
        if not query:
            raise HTTPException(status_code=400, detail="Query parameter is required")
        
        # Build Weaviate query
        where_filter = None
        if filter_paths:
            # Create filter for specific paths
            where_filter = {
                "operator": "Or",
                "operands": [
                    {
                        "path": ["path"],
                        "operator": "Like",
                        "valueText": f"*{path}*"
                    } for path in filter_paths
                ]
            }
        
        # Execute semantic search
        result = (
            weaviate_client.query
            .get("RagChunk", ["text", "path", "anchor", "metadata"])
            .with_near_text({"concepts": [query]})
            .with_limit(top_k)
            .with_additional(["certainty", "distance"])
        )
        
        if where_filter:
            result = result.with_where(where_filter)
        
        response = result.do()
        
        # Process results
        chunks = []
        if "data" in response and "Get" in response["data"] and "RagChunk" in response["data"]["Get"]:
            for item in response["data"]["Get"]["RagChunk"]:
                # Calculate score from certainty (Weaviate's similarity measure)
                certainty = item.get("_additional", {}).get("certainty", 0)
                score = float(certainty) if certainty else 0.0
                
                chunks.append({
                    "text": item.get("text", ""),
                    "path": item.get("path", ""),
                    "anchor": item.get("anchor"),
                    "score": score,
                    "metadata": item.get("metadata", {})
                })
        
        return {
            "success": True,
            "chunks": chunks,
            "total_found": len(chunks),
            "query_time_ms": 0,  # TODO: Add timing
            "query": query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")

@app.post("/index/document")
async def index_document(request: Dict[str, Any]):
    """Index a document into Weaviate"""
    try:
        path = request.get("path")
        text = request.get("text")
        metadata = request.get("metadata", {})
        
        if not path or not text:
            raise HTTPException(status_code=400, detail="Path and text are required")
        
        # Create document object
        document_obj = {
            "text": text,
            "path": path,
            "anchor": metadata.get("anchor"),
            "metadata": metadata
        }
        
        # Add to Weaviate
        result = weaviate_client.data_object.create(
            data_object=document_obj,
            class_name="RagChunk"
        )
        
        return {
            "success": True,
            "document_id": result,
            "message": f"Document indexed: {path}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document indexing failed: {str(e)}")

@app.get("/index/stats")
async def get_index_stats():
    """Get statistics about the indexed documents"""
    try:
        # Get total count
        result = (
            weaviate_client.query
            .aggregate("RagChunk")
            .with_meta_count()
            .do()
        )
        
        total_count = 0
        if "data" in result and "Aggregate" in result["data"] and "RagChunk" in result["data"]["Aggregate"]:
            meta = result["data"]["Aggregate"]["RagChunk"][0].get("meta", {})
            total_count = meta.get("count", 0)
        
        return {
            "success": True,
            "total_documents": total_count,
            "index_version": "1.0.0",
            "embedding_model": "text-embedding-ada-002"  # Default OpenAI model
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.post("/index/create_schema")
async def create_schema():
    """Create the RagChunk schema in Weaviate"""
    try:
        schema = {
            "class": "RagChunk",
            "description": "A chunk of text from indexed documents",
            "vectorizer": "text2vec-openai",
            "moduleConfig": {
                "text2vec-openai": {
                    "model": "ada",
                    "modelVersion": "002",
                    "type": "text"
                }
            },
            "properties": [
                {
                    "name": "text",
                    "dataType": ["text"],
                    "description": "The content of the chunk",
                    "moduleConfig": {
                        "text2vec-openai": {
                            "skip": False,
                            "vectorizePropertyName": False
                        }
                    }
                },
                {
                    "name": "path",
                    "dataType": ["string"],
                    "description": "File path or source URL",
                    "moduleConfig": {
                        "text2vec-openai": {
                            "skip": True,
                            "vectorizePropertyName": False
                        }
                    }
                },
                {
                    "name": "anchor",
                    "dataType": ["string"],
                    "description": "Section header or anchor within the document",
                    "moduleConfig": {
                        "text2vec-openai": {
                            "skip": True,
                            "vectorizePropertyName": False
                        }
                    }
                },
                {
                    "name": "metadata",
                    "dataType": ["object"],
                    "description": "Additional metadata about the chunk",
                    "moduleConfig": {
                        "text2vec-openai": {
                            "skip": True,
                            "vectorizePropertyName": False
                        }
                    }
                }
            ]
        }
        
        # Check if schema already exists
        existing_schema = weaviate_client.schema.get()
        existing_classes = [cls["class"] for cls in existing_schema.get("classes", [])]
        
        if "RagChunk" not in existing_classes:
            weaviate_client.schema.create_class(schema)
            return {
                "success": True,
                "message": "RagChunk schema created successfully"
            }
        else:
            return {
                "success": True,
                "message": "RagChunk schema already exists"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema creation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
