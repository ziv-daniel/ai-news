from fastapi import APIRouter, HTTPException
from typing import List
from app.models.article import Article, SearchQuery
from app.database import get_supabase
from app.config import get_settings
import httpx

router = APIRouter(prefix="/search", tags=["search"])

async def get_embedding(text: str) -> List[float]:
    """Get embedding for search query using Gemini API."""
    settings = get_settings()

    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.gemini_api_key}"

    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        return data["embedding"]["values"]

@router.post("/", response_model=List[Article])
async def search_articles(search: SearchQuery):
    """
    Search articles using full-text search and/or vector similarity.

    - Full-text search: searches title and summary
    - Vector search: uses semantic similarity with embeddings
    """
    supabase = get_supabase()

    if search.use_vector:
        # Get embedding for search query
        try:
            query_embedding = await get_embedding(search.query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

        # Vector similarity search using RPC function
        response = supabase.rpc(
            "match_articles",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": search.limit
            }
        ).execute()

        return response.data
    else:
        # Full-text search on title and summary
        query = supabase.table("articles").select("*")

        # Use ilike for case-insensitive pattern matching
        query = query.or_(f"title.ilike.%{search.query}%,summary.ilike.%{search.query}%")

        query = query.order("collected_at", desc=True).limit(search.limit)

        response = query.execute()
        return response.data
