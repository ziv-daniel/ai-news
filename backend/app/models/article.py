from pydantic import BaseModel, field_serializer
from datetime import datetime
from typing import Optional, List, Any

class Article(BaseModel):
    id: str  # UUID from Supabase
    title: str
    link: str
    summary: str
    source_name: str
    category: str
    tier: str
    score: int
    published_at: Optional[str]
    collected_at: datetime
    read: bool = False
    favorited: bool = False
    archived: bool = False
    embedding: Optional[Any] = None  # Can be string or list from Supabase

    @field_serializer('embedding')
    def serialize_embedding(self, embedding: Any, _info):
        # Don't include embedding in API responses by default
        return None

    class Config:
        from_attributes = True

class ArticleUpdate(BaseModel):
    read: Optional[bool] = None
    favorited: Optional[bool] = None
    archived: Optional[bool] = None

class SearchQuery(BaseModel):
    query: str
    limit: int = 20
    use_vector: bool = True
