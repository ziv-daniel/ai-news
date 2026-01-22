# AI News RAG - Technical Architecture

## Technology Stack

### Workflow Automation
- **n8n** (v2.31.3) - Open-source workflow automation
- Hosted as Home Assistant add-on via hass-n8n
- 23 nodes in workflow

### AI/ML Services
- **Google Gemini API**
  - `text-embedding-004` - 768-dimension embeddings for articles
  - `gemini-2.0-flash-exp` - Fast summarization model
  - Both using batchEmbedContents and generateContent endpoints

### Vector Database
- **Qdrant Cloud**
  - Collection: `ai-news`
  - Vector dimensions: 768 (Gemini embedding size)
  - Used for semantic deduplication and article storage
  - EU-West-1 region

### Messaging
- **MQTT** (via Home Assistant)
  - Topic: `homeassistant/daily/ai-news`
  - QoS: 1 (at least once delivery)
  - Retain: true (last message persisted)

### Hosting
- **Home Assistant** - Main platform
- **hass-n8n add-on** - n8n hosting
- Accessible via ingress at home.danielshaprvt.work

---

## API Endpoints

### Gemini Embeddings
```
POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={API_KEY}

Body:
{
  "requests": [
    {
      "model": "models/text-embedding-004",
      "content": {"parts": [{"text": "article content"}]}
    }
  ]
}

Response:
{
  "embeddings": [{"values": [0.123, ...]}]  // 768 floats
}
```

### Gemini Summarization
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={API_KEY}

Body:
{
  "contents": [{"parts": [{"text": "prompt"}]}],
  "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
}
```

### Qdrant Insert
```
PUT {QDRANT_URL}/collections/ai-news/points

Headers:
  api-key: {QDRANT_API_KEY}
  Content-Type: application/json

Body:
{
  "points": [
    {
      "id": "article-uuid",
      "vector": [0.123, ...],  // 768 floats
      "payload": {title, link, description, source_name, ...}
    }
  ]
}
```

### Qdrant Query
```
POST {QDRANT_URL}/collections/ai-news/points/scroll

Body:
{
  "filter": {"must": [{"key": "collected_at", "range": {"gte": "ISO_DATE"}}]},
  "limit": 30,
  "with_payload": true,
  "with_vector": false
}
```

---

## Data Models

### Article (after extraction)
```typescript
{
  article_id: string,      // UUID based on link hash
  title: string,
  link: string,
  description: string,     // max 500 chars, HTML stripped
  content: string,         // title + description for embedding
  source_name: string,
  published_date: string,
  collected_at: string,    // ISO timestamp
  word_count: number
}
```

### Article with Embedding
```typescript
{
  ...Article,
  embedding: number[]      // 768 floats from Gemini
}
```

### MQTT Message
```typescript
{
  markdown_message: string,   // Full formatted digest
  plain_summary: string,      // Just the AI summary
  date: string,               // Human readable date
  timestamp: string,          // ISO timestamp
  article_count: number,
  metrics: {
    cycle_id: string,
    articles_collected: number,
    articles_inserted: number,
    dedup_rate_percent: number
  }
}
```

---

## Key Algorithms

### Semantic Deduplication
- Uses cosine similarity between embeddings
- Threshold: 0.88 (88% similar = duplicate)
- Processes articles sequentially, comparing each to seen articles

```javascript
function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0, norm1 = 0, norm2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

### Article ID Generation
- Simple hash function (no crypto needed)
- Generates UUID-like string from article link
- Ensures same article always gets same ID

### Relevance Filtering
- Keyword matching against title + description
- Keywords: ai, claude, anthropic, gpt, openai, llm, machine learning, etc.
- Case-insensitive matching

---

## Rate Limits & Quotas

| Service | Limit | Notes |
|---------|-------|-------|
| Gemini API | 1500 req/day (free) | Batch requests help |
| Qdrant Cloud | Varies by plan | Free tier available |
| RSS Feeds | No hard limit | 30s timeout per feed |

---

## Security Notes

- API keys currently hardcoded in workflow (Initialize Variables node)
- Gemini API key also hardcoded in Gemini Embeddings URL (required for pairedItem fix)
- Consider migrating to n8n credentials for better security
- MQTT credentials stored in n8n credential store
