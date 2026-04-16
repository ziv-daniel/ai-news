import asyncpg
from app.config import get_settings

_pool: asyncpg.Pool = None

async def get_pool() -> asyncpg.Pool:
    return _pool

async def init_pool():
    global _pool
    settings = get_settings()
    _pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
