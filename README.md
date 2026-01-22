# AI News RAG v3 - Complete System

End-to-end AI news aggregation system with semantic search, ranking, and PWA interface.

## System Architecture

### Phase 1: Database (Supabase + pgvector) ✅
- **Schema**: `articles` table with vector embeddings (768 dimensions)
- **Features**: Unique link constraint, tier/category indexing, vector similarity search
- **Function**: `match_articles()` for semantic search
- **Status**: 298 articles collected and indexed

### Phase 2: Data Collection (n8n) ✅
- **Workflow ID**: `Dj7riZ1XDqQ3mGGp`
- **Sources**: 24 RSS feeds (OpenAI, Anthropic, HN, TechCrunch, etc.)
- **Processing**:
  - RSS parsing & deduplication
  - Gemini text-embedding-004 (batch processing)
  - Semantic deduplication (cosine similarity 0.88 threshold)
  - 4-tier ranking system (urgent/high/medium/low)
  - 4-category classification (announcement/breakthrough/tool/analysis)
- **Schedule**: Every 6 hours (configurable)

### Phase 3: API Backend (FastAPI) ✅
**Location**: `backend/`

**Endpoints**:
- `GET /articles` - List articles with filtering (tier, category, read status, pagination)
- `GET /articles/{id}` - Get single article
- `PATCH /articles/{id}` - Update article (mark read/favorited/archived)
- `POST /search` - Full-text and vector semantic search

**Tech Stack**:
- FastAPI + Uvicorn
- Supabase Python client
- Pydantic models
- CORS enabled for frontend

**Run**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Phase 4: PWA Frontend (Next.js) 🚧
**Location**: `frontend/`

**Features** (Planned):
- Tier-based article grouping (urgent → low)
- Swipe actions (right=read, left=favorite)
- Full-text + semantic search
- Offline support (service worker)
- Push notifications for urgent articles
- Dark mode

**Tech Stack**:
- Next.js 15 + TypeScript
- Tailwind CSS
- PWA configuration

## Quick Start

### 1. Database Setup
Already configured via Supabase MCP. Schema and functions are deployed.

### 2. Start n8n Workflow
Workflow `Dj7riZ1XDqQ3mGGp` collects articles automatically every 6 hours.

### 3. Run API Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Run PWA Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## API Examples

**Get urgent articles**:
```bash
curl "http://localhost:8000/articles?tier=urgent&limit=10"
```

**Semantic search**:
```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Claude 3.5 Sonnet improvements", "limit": 5, "use_vector": true}'
```

**Mark article as read**:
```bash
curl -X PATCH "http://localhost:8000/articles/123" \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

## Project Structure

```
ai-news-rag/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py    # FastAPI app
│   │   ├── config.py  # Settings
│   │   ├── database.py # Supabase client
│   │   ├── models/    # Pydantic models
│   │   └── routers/   # API endpoints
│   ├── .env           # Environment variables
│   └── requirements.txt
│
├── frontend/          # Next.js PWA
│   ├── app/           # Next.js 15 app directory
│   ├── components/    # React components
│   ├── lib/           # Utilities
│   └── public/        # Static assets
│
└── docs/              # Documentation

```

## Configuration

### Backend (.env)
```
SUPABASE_URL=https://chhryzblsnqjqrrqmwdx.supabase.co
SUPABASE_KEY=your_publishable_key
GEMINI_API_KEY=your_gemini_key
```

### n8n Workflow
Access via: https://home.danielshaprvt.work/ → n8n

## Article Ranking System

**Tiers** (priority):
1. **Urgent**: Major announcements/tools from top sources (OpenAI, Anthropic, etc.)
2. **High**: Important research breakthroughs, high-authority sources
3. **Medium**: General AI news, analysis
4. **Low**: Community discussions, minor updates

**Categories**:
- **Announcement**: Product launches, releases
- **Breakthrough**: Research papers, benchmarks, SOTA results
- **Tool**: Libraries, SDKs, integrations
- **Analysis**: Commentary, tutorials, discussions

## Development Status

- ✅ Phase 1: Supabase schema + migrations
- ✅ Phase 2: n8n workflow (298 articles)
- ✅ Phase 3: FastAPI backend
- 🚧 Phase 4: Next.js PWA
- ⏳ Phase 5: E2E testing

## Next Steps

1. Complete PWA frontend UI
2. Add swipe gesture library
3. Configure service worker for offline
4. Set up push notifications
5. Deploy to production
