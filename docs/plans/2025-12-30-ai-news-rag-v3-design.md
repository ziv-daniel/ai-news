# AI News RAG v3 - Ranked Personal Dashboard Design

**Date:** 2025-12-30
**Status:** Ready for implementation
**Previous version:** AI News RAG v2 - Gemini Edition (workflow ID: `JRCaBo3mLsqGeKpk`)

---

## Problem Statement

**Current issues with v2:**
- **Information overload:** 14+ articles every 6 hours is too much
- **All-or-nothing consumption:** Either read everything (exhausting) or ignore completely
- **No prioritization:** Can't distinguish breaking news from general updates
- **Limited delivery:** MQTT → Telegram only, not convenient for mobile browsing
- **No history:** Can't search past articles or mark favorites

**User behavior:**
- Primary use: Personal knowledge (A) + Professional edge (B)
- Must-read content: Breaking announcements, Technical breakthroughs, Tool releases, Industry analysis
- Timing needs: ASAP for breaking news, but quality > speed for everything else

---

## Goals

### Immediate (v3)
1. **Intelligent ranking** - Classify articles into 4 tiers (Urgent/High/Medium/Low)
2. **Personal dashboard** - Mobile-first PWA installable to phone home screen
3. **Smart notifications** - Push alerts for urgent items only
4. **Searchable history** - Find past articles, mark favorites
5. **Better UX** - Swipe actions, pull-to-refresh, offline support

### Future (v4)
- Newsletter/feed for others to subscribe (business opportunity)
- User accounts and preferences
- Social features (sharing, commenting)

---

## Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────┐
│ n8n Workflow (CLONED from v2)               │
│  RSS → Filter → Embeddings → Dedup          │
│    ↓                                         │
│  NEW: Rank & Classify                       │
│    ↓                                         │
│  Store in Supabase                           │
│    ↓                                         │
│  Check for Urgent → Push Notification       │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Supabase (replaces Qdrant + PostgreSQL)     │
│  • PostgreSQL + pgvector (embeddings)        │
│  • Real-time subscriptions                   │
│  • Built-in auth (for future)                │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ API Backend (Python FastAPI or Node.js)     │
│  • GET /articles (ranked, filtered)          │
│  • POST /articles/:id/favorite               │
│  • GET /search (semantic + keyword)          │
│  • Real-time updates via Supabase            │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ PWA Frontend (Next.js + Tailwind)           │
│  • Mobile-first responsive design            │
│  • Installable to home screen                │
│  • Push notifications (urgent only)          │
│  • Offline mode with service worker          │
│  • Swipe actions (mark read, favorite)       │
└─────────────────────────────────────────────┘
```

---

## Ranking & Classification System

### Article Tiers

**🔥 Tier 1: URGENT** (Push notification immediately)
- Major model releases (GPT-5, Claude 4, Llama 4)
- Significant tool launches affecting tech stack
- Breaking industry shifts
- **Detection:** Keywords + source credibility
- **Action:** Push notification + top of feed

**⚡ Tier 2: HIGH** (Top of daily view)
- Technical breakthroughs (research papers, benchmarks)
- Important tool releases
- Strategic analysis from trusted sources
- **Detection:** Source authority + technical depth
- **Action:** Top section of PWA, badge count

**📰 Tier 3: MEDIUM** (Daily digest)
- Industry trends and analysis
- Incremental improvements
- Community discussions
- **Action:** Middle section, grouped by topic

**📋 Tier 4: LOW** (Archive, searchable)
- Everything else that passed filters
- **Action:** "More articles" section

### Categories

1. **announcement** - New releases, launches, product announcements
2. **breakthrough** - Research papers, benchmarks, capabilities
3. **tool** - Developer tools, libraries, integrations
4. **analysis** - Trends, expert opinions, industry direction

### Ranking Algorithm

```python
# Source authority scores (0-10)
source_scores = {
    'OpenAI': 10,
    'Anthropic': 10,
    'Google DeepMind': 10,
    'Hacker News AI': 8,
    'TechCrunch AI': 7,
    'Reddit AI': 6,
    'Unknown': 2
}

# Simple but effective scoring
score = (
    source_authority * 0.3 +      # OpenAI blog = 10, random blog = 2
    category_match * 0.25 +        # Matches priorities (A,B,D,F)
    recency_boost * 0.2 +          # < 6 hours = boost
    social_signals * 0.15 +        # HN points, Reddit upvotes
    semantic_novelty * 0.1         # How different from recent articles
)
```

---

## Database Schema (Supabase)

### Table: `articles`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  summary TEXT,
  source_name TEXT,
  category TEXT CHECK (category IN ('announcement', 'breakthrough', 'tool', 'analysis')),
  tier TEXT CHECK (tier IN ('urgent', 'high', 'medium', 'low')),
  score FLOAT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  favorited BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,

  -- Embeddings for semantic search (pgvector extension)
  embedding VECTOR(768),  -- Gemini embeddings

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(summary, ''))
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_tier_published ON articles(tier, published_at DESC);
CREATE INDEX idx_category ON articles(category);
CREATE INDEX idx_favorited ON articles(favorited) WHERE favorited = TRUE;
CREATE INDEX idx_search_vector ON articles USING GIN(search_vector);
CREATE INDEX idx_embedding ON articles USING ivfflat(embedding vector_cosine_ops);
```

### Table: `user_preferences` (future-ready)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_filters JSONB DEFAULT '[]',
  notification_tiers JSONB DEFAULT '["urgent", "high"]',
  display_prefs JSONB DEFAULT '{"darkMode": true, "compactView": false}'
);
```

### Retention Policy

- **Tier 1-2:** Keep forever (important historical record)
- **Tier 3-4:** Keep 90 days unless favorited
- **Favorited:** Keep forever regardless of tier

---

## n8n Workflow Modifications

### Clone Workflow
- **Original:** `AI News RAG v2 - Gemini Edition` (ID: `JRCaBo3mLsqGeKpk`)
- **New name:** `AI News RAG v3 - Supabase + Ranking`

### New Nodes to Add

**1. Rank & Classify Articles** (after Semantic Deduplication)

```javascript
// Code node: Rank & Classify
const articles = $input.all().map(item => item.json);

// Source authority scores
const sourceScores = {
  'OpenAI': 10, 'Anthropic': 10, 'Google DeepMind': 10,
  'Microsoft AI': 9, 'Meta AI': 9,
  'Hacker News AI': 8, 'TechCrunch AI': 7,
  'Reddit AI': 6, 'MarkTechPost': 5,
  'Unknown': 2
};

// Category detection
function detectCategory(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  // Announcements: releases, launches
  if (text.match(/released|launching|announcing|available now|introducing|unveils/))
    return 'announcement';

  // Breakthroughs: research, benchmarks
  if (text.match(/breakthrough|research|paper|benchmark|outperforms|achieves|sota/))
    return 'breakthrough';

  // Tools: libraries, dev tools
  if (text.match(/tool|library|sdk|api|integration|extension|plugin|framework|cli/))
    return 'tool';

  // Analysis: trends, opinions
  return 'analysis';
}

// Tier assignment
function assignTier(category, score, sourceName) {
  // URGENT: Major announcements from top sources
  if (category === 'announcement' && score >= 9) return 'urgent';
  if (category === 'tool' && score >= 9) return 'urgent';

  // HIGH: Everything from top sources + breakthroughs
  if (score >= 8) return 'high';
  if (category === 'breakthrough' && score >= 6) return 'high';

  // MEDIUM: Decent sources or analysis
  if (score >= 5 || category === 'analysis') return 'medium';

  // LOW: Everything else
  return 'low';
}

// Process articles
const rankedArticles = articles.map(article => {
  const sourceScore = sourceScores[article.source_name] || 2;
  const category = detectCategory(article.title, article.enriched_content || article.description);
  const tier = assignTier(category, sourceScore, article.source_name);

  return {
    title: article.title,
    link: article.link,
    summary: article.enriched_content || article.description,
    source_name: article.source_name,
    category,
    tier,
    score: sourceScore,
    published_at: article.published_date,
    collected_at: new Date().toISOString(),
    embedding: article.embedding,  // Pass through from earlier node
    read: false,
    favorited: false,
    archived: false
  };
});

console.log(`Ranked ${rankedArticles.length} articles`);
console.log(`  Urgent: ${rankedArticles.filter(a => a.tier === 'urgent').length}`);
console.log(`  High: ${rankedArticles.filter(a => a.tier === 'high').length}`);
console.log(`  Medium: ${rankedArticles.filter(a => a.tier === 'medium').length}`);
console.log(`  Low: ${rankedArticles.filter(a => a.tier === 'low').length}`);

return rankedArticles.map(a => ({ json: a }));
```

**2. Insert to Supabase** (HTTP Request node)

```javascript
// HTTP Request node settings
Method: POST
URL: https://YOUR_PROJECT.supabase.co/rest/v1/articles
Headers:
  - apikey: YOUR_SUPABASE_ANON_KEY
  - Authorization: Bearer YOUR_SUPABASE_ANON_KEY
  - Content-Type: application/json
  - Prefer: resolution=merge-duplicates

Body: ={{ $json }}

Options:
  - Batch Size: 1 (insert one at a time to handle duplicates)
  - Continue on Fail: true
```

**3. Check for Urgent Articles** (IF node)

```javascript
Conditions:
  - {{ $json.tier }} equals "urgent"

True output → Send Push Notification
False output → (workflow ends)
```

**4. Send Push Notification** (HTTP Request node - Web Push or Telegram)

```javascript
// For now, keep Telegram for urgent alerts
// Later: Replace with Web Push API for PWA notifications

Method: POST
URL: https://api.telegram.org/bot{{ $credentials.telegram_token }}/sendMessage
Body: {
  "chat_id": "YOUR_CHAT_ID",
  "text": "🔥 URGENT: {{ $json.title }}\n\n{{ $json.summary.substring(0, 200) }}...\n\n🔗 {{ $json.link }}",
  "parse_mode": "HTML"
}
```

### Updated Workflow Flow

```
Trigger (Manual/Webhook/Schedule 6h)
  ↓
Initialize Variables
  ↓
Feed Configuration → Fetch All Feeds → Parse All Feeds
  ↓
Filter & Extract Articles
  ↓
Batch for Embeddings ⟲
  ↓
Build Gemini Request → Gemini Embeddings → Map Embeddings Back
  ↓
Semantic Deduplication
  ↓
Rank & Classify Articles (NEW)
  ↓
Insert to Supabase (NEW)
  ↓
Check for Urgent Articles (NEW)
  ├─ TRUE → Send Push Notification (NEW)
  └─ FALSE → End
```

---

## Tech Stack

### Backend
- **Database:** Supabase (PostgreSQL + pgvector + real-time)
- **API:** Python FastAPI or Node.js Express
- **Hosting:** Railway, Render, or Vercel (for API)

### Frontend (PWA)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (optional, for nice mobile components)
- **PWA:** next-pwa plugin
- **Push Notifications:** Web Push API
- **Hosting:** Vercel

### Infrastructure
- **n8n:** Existing instance (workflow collection/processing)
- **Supabase:** Free tier (500MB database, 2GB bandwidth)
- **Domain:** Optional custom domain for PWA

---

## API Endpoints

### Core Endpoints

```typescript
// Get articles with filtering
GET /articles
Query params:
  - tier: urgent|high|medium|low
  - category: announcement|breakthrough|tool|analysis
  - limit: number (default 50)
  - offset: number (default 0)
  - unread_only: boolean
  - favorited_only: boolean

Response:
{
  "articles": [
    {
      "id": "uuid",
      "title": "string",
      "link": "url",
      "summary": "string",
      "source_name": "string",
      "category": "announcement",
      "tier": "urgent",
      "score": 10,
      "published_at": "timestamp",
      "read": false,
      "favorited": false
    }
  ],
  "total": 150,
  "has_more": true
}

// Mark article as read
PATCH /articles/:id/read
Body: { "read": true }

// Toggle favorite
POST /articles/:id/favorite
Body: { "favorited": true }

// Search (semantic + keyword)
GET /search
Query params:
  - q: search query
  - mode: semantic|keyword|hybrid (default: hybrid)
  - limit: number

Response:
{
  "results": [...],  // Same article schema
  "query": "string",
  "total": 25
}

// Get stats
GET /stats
Response:
{
  "total_articles": 1250,
  "unread_count": 45,
  "favorited_count": 12,
  "by_tier": {
    "urgent": 3,
    "high": 15,
    "medium": 22,
    "low": 5
  }
}
```

---

## PWA Features & UX

### Mobile-First Design

**Home Screen:**
```
┌─────────────────────────────┐
│ 🔥 Urgent (3)         [⚙️]  │
├─────────────────────────────┤
│ ⚡ Claude 4 Released        │
│ Anthropic • 2h ago          │
│ Swipe → [👁️] [⭐] [📂]      │
├─────────────────────────────┤
│ ⚡ New GPT-4.5 Benchmarks   │
│ OpenAI • 5h ago             │
├─────────────────────────────┤
│                             │
│ ⚡ High Priority (15)        │
│ [Expand ▼]                  │
│                             │
│ 📰 Medium (22)               │
│ [Expand ▼]                  │
│                             │
│ 📋 More Articles (5)         │
│ [Show All]                  │
└─────────────────────────────┘
```

**Article Card Actions (Swipe):**
- Swipe right → Mark as read (eye icon)
- Swipe left → Archive (folder icon)
- Tap star → Favorite
- Tap card → Open article in reader view

**Navigation:**
- Bottom tabs: Home | Favorites | Search | Settings
- Pull-to-refresh on all lists
- Infinite scroll with "Load more"

### PWA Capabilities

1. **Installable** - Add to home screen, full-screen mode
2. **Offline mode** - Cache recent articles (last 7 days)
3. **Push notifications** - Urgent tier only
4. **Background sync** - Check for new articles when online
5. **Share target** - Share articles to PWA from other apps

### Push Notification Strategy

**When to notify:**
- Only Tier 1 (urgent) articles
- Max 5 notifications per day (avoid spam)
- Silent hours: 10pm - 8am (configurable)

**Notification format:**
```
🔥 Breaking: Claude 4 Released

Anthropic announces Claude 4 with 2M context window
and improved reasoning capabilities.

[Tap to read] [Mark as read]
```

---

## Implementation Tasks

### Phase 1: Infrastructure Setup
- [ ] Configure Supabase MCP server (user level)
- [ ] Remove Qdrant MCP server (user level)
- [ ] Create Supabase project
- [ ] Run database schema migrations
- [ ] Set up Supabase API keys

### Phase 2: n8n Workflow
- [ ] Clone existing workflow → "AI News RAG v3"
- [ ] Add "Rank & Classify" code node
- [ ] Add "Insert to Supabase" HTTP request node
- [ ] Add "Check for Urgent" IF node
- [ ] Update "Send Push Notification" node
- [ ] Test workflow end-to-end
- [ ] Disable old v2 workflow (keep as backup)

### Phase 3: API Backend
- [ ] Set up FastAPI or Express project
- [ ] Implement GET /articles endpoint
- [ ] Implement PATCH /articles/:id/read
- [ ] Implement POST /articles/:id/favorite
- [ ] Implement GET /search (keyword + semantic)
- [ ] Implement GET /stats
- [ ] Deploy to Railway/Render/Vercel
- [ ] Test all endpoints with Postman

### Phase 4: PWA Frontend
- [ ] Create Next.js project with TypeScript
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Build article list component (with tiers)
- [ ] Implement swipe actions
- [ ] Build article detail view
- [ ] Add favorites page
- [ ] Add search page
- [ ] Add settings page
- [ ] Configure next-pwa for offline support
- [ ] Implement push notification subscription
- [ ] Deploy to Vercel
- [ ] Test on mobile device

### Phase 5: Testing & Polish
- [ ] End-to-end test: n8n → Supabase → API → PWA
- [ ] Test push notifications
- [ ] Test offline mode
- [ ] Performance optimization
- [ ] Add loading states and error handling
- [ ] PWA audit with Lighthouse
- [ ] Install to phone home screen and use for 1 week

### Phase 6: Future Enhancements
- [ ] User authentication (for sharing feature)
- [ ] Export to newsletter/RSS
- [ ] Custom notification rules
- [ ] Article recommendations based on favorites
- [ ] Weekly digest email

---

## Environment Variables

### n8n Workflow
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
TELEGRAM_BOT_TOKEN=your_token  # For urgent alerts
TELEGRAM_CHAT_ID=your_chat_id
```

### API Backend
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_key  # For admin operations
SUPABASE_ANON_KEY=your_anon_key
PORT=3000
```

### PWA Frontend
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key  # For push notifications
```

---

## Success Metrics

**After 1 week of use:**
- [ ] Check in daily without friction
- [ ] Read 80%+ of urgent/high tier articles
- [ ] Archive/ignore most medium/low tier articles
- [ ] Use favorites feature for interesting articles
- [ ] Feel informed without feeling overwhelmed

**After 1 month:**
- [ ] Have searchable knowledge base of AI developments
- [ ] Identify trends from historical data
- [ ] Share interesting articles with colleagues
- [ ] Consider business opportunities (newsletter, etc.)

---

## Notes & Decisions

- **Why Supabase over Qdrant + PostgreSQL?** Single service, built-in auth for future, real-time subscriptions, pgvector handles embeddings just fine
- **Why PWA over native app?** No app store hassle, works on all devices, single codebase, faster iteration
- **Why keep n8n?** Collection logic already works, familiar tool, easy to add more sources
- **Why 4 tiers?** Urgent = immediate action, High = read today, Medium = optional, Low = searchable archive

---

## Risks & Mitigations

**Risk:** Supabase free tier limits (500MB DB, 2GB bandwidth)
**Mitigation:** 90-day retention for tier 3-4, monitor usage, upgrade if needed

**Risk:** Push notifications don't work on all browsers
**Mitigation:** Fall back to Telegram for urgent alerts, document browser compatibility

**Risk:** Ranking algorithm needs tuning
**Mitigation:** Log tier distribution, adjust thresholds based on actual usage, add manual override

**Risk:** Time investment for PWA development
**Mitigation:** Start with MVP (article list + favorites), iterate based on usage

---

## References

- **Original workflow:** `JRCaBo3mLsqGeKpk`
- **Backup:** `backups/workflow-backup-2025-12-30.json`
- **Debugging skill:** `.claude/skills/debugging-ai-news-rag.md`
