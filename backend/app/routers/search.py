from fastapi import APIRouter, HTTPException
from typing import List
from app.models.article import Article, SearchQuery
from app.database import get_pool

router = APIRouter(prefix="/search", tags=["search"])

COLS = "id,title,link,summary,source_name,category,tier,score,published_at,collected_at,read,favorited,archived"

@router.post("/", response_model=List[Article])
async def search_articles(search: SearchQuery):
    pool = await get_pool()
    query = f"%{search.query}%"
    sql = f"""
        SELECT {COLS} FROM articles
        WHERE title ILIKE $1 OR summary ILIKE $1
        ORDER BY collected_at DESC
        LIMIT $2
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, query, search.limit)
    return [dict(r) for r in rows]
