from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import articles, search

app = FastAPI(
    title="AI News RAG API",
    description="Backend API for AI News RAG system with semantic search",
    version="3.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3005"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(articles.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return {
        "message": "AI News RAG API v3",
        "docs": "/docs",
        "endpoints": {
            "articles": "/articles",
            "search": "/search"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
