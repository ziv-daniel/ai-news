from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.article import Article, ArticleUpdate
from app.database import get_pool

router = APIRouter(prefix="/articles", tags=["articles"])

COLS = "id,title,link,summary,source_name,category,tier,score,published_at,collected_at,read,favorited,archived"

@router.get("/", response_model=List[Article])
async def get_articles(
    tier: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    read: Optional[bool] = Query(None),
    favorited: Optional[bool] = Query(None),
    archived: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    pool = await get_pool()
    conditions = []
    params = []
    i = 1
    if tier:        conditions.append(f"tier = ${i}");      params.append(tier);      i+=1
    if category:    conditions.append(f"category = ${i}");  params.append(category);  i+=1
    if read is not None:      conditions.append(f"read = ${i}");      params.append(read);      i+=1
    if favorited is not None: conditions.append(f"favorited = ${i}"); params.append(favorited); i+=1
    if archived is not None:  conditions.append(f"archived = ${i}");  params.append(archived);  i+=1

    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    params += [limit, offset]
    sql = f"SELECT {COLS} FROM articles {where} ORDER BY collected_at DESC LIMIT ${i} OFFSET ${i+1}"

    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)
    return [dict(r) for r in rows]

@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(f"SELECT {COLS} FROM articles WHERE id = $1", article_id)
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return dict(row)

@router.patch("/{article_id}", response_model=Article)
async def update_article(article_id: str, update: ArticleUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    pool = await get_pool()
    sets = ", ".join(f"{k} = ${i+1}" for i, k in enumerate(update_data.keys()))
    vals = list(update_data.values()) + [article_id]
    sql = f"UPDATE articles SET {sets} WHERE id = ${len(vals)} RETURNING {COLS}"

    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *vals)
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return dict(row)
