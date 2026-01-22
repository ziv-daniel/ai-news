from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.article import Article, ArticleUpdate
from app.database import get_supabase

router = APIRouter(prefix="/articles", tags=["articles"])

@router.get("/", response_model=List[Article])
async def get_articles(
    tier: Optional[str] = Query(None, description="Filter by tier: urgent, high, medium, low"),
    category: Optional[str] = Query(None, description="Filter by category"),
    read: Optional[bool] = Query(None, description="Filter by read status"),
    favorited: Optional[bool] = Query(None, description="Filter by favorited status"),
    archived: Optional[bool] = Query(None, description="Filter by archived status"),
    limit: int = Query(50, ge=1, le=200, description="Number of articles to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Get articles with optional filtering and pagination.
    Results are ordered by collected_at descending (newest first).
    """
    supabase = get_supabase()

    # Select all columns except embedding (too large for API response)
    query = supabase.table("articles").select("id,title,link,summary,source_name,category,tier,score,published_at,collected_at,read,favorited,archived")

    # Apply filters
    if tier:
        query = query.eq("tier", tier)
    if category:
        query = query.eq("category", category)
    if read is not None:
        query = query.eq("read", read)
    if favorited is not None:
        query = query.eq("favorited", favorited)
    if archived is not None:
        query = query.eq("archived", archived)

    # Order and paginate
    query = query.order("collected_at", desc=True).range(offset, offset + limit - 1)

    response = query.execute()
    return response.data

@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: str):
    """Get a single article by ID."""
    supabase = get_supabase()

    response = supabase.table("articles").select("id,title,link,summary,source_name,category,tier,score,published_at,collected_at,read,favorited,archived").eq("id", article_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Article not found")

    return response.data[0]

@router.patch("/{article_id}", response_model=Article)
async def update_article(article_id: str, update: ArticleUpdate):
    """Update article status (mark as read, favorited, or archived)."""
    supabase = get_supabase()

    # Build update dict from non-None fields
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = supabase.table("articles").update(update_data).eq("id", article_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Article not found")

    return response.data[0]
