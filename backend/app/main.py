from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import articles, search
from app.database import init_pool, close_pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()

app = FastAPI(
    title="AI News RAG API",
    description="Backend API for AI News RAG system",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return {"message": "AI News RAG API v3", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
