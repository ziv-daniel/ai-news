# AI News RAG v2 - Project Overview

## What is this project?

An automated AI news aggregation and summarization system that:
1. Collects AI-related news from 24 RSS feeds every 6 hours
2. Generates embeddings using Google Gemini API
3. Stores articles in Qdrant vector database for semantic deduplication
4. Creates a daily digest summary using Gemini
5. Publishes to MQTT for Home Assistant integration

## Workflow ID
`JRCaBo3mLsqGeKpk`

## Where it runs
- **Platform:** n8n (workflow automation)
- **Hosting:** Home Assistant add-on via [hass-n8n](https://github.com/Rbillon59/hass-n8n)
- **Access:** https://home.danielshaprvt.work/ -> Sidebar -> n8n

## Key Components

### Data Sources (24 RSS feeds)
- Reddit AI subreddits (ClaudeAI, OpenAI, LocalLLaMA, etc.)
- TechCrunch AI, Ars Technica AI, The Verge AI
- Official blogs: OpenAI, Anthropic, Google AI, DeepMind, Meta AI
- Research: arXiv CS.AI, BAIR, MIT News AI
- Thought leaders: Simon Willison, Andrej Karpathy

### External Services
- **Gemini API:** text-embedding-004 (embeddings), gemini-2.0-flash-exp (summarization)
- **Qdrant Cloud:** Vector database for storing articles with embeddings
- **MQTT:** Publishes to `homeassistant/daily/ai-news`

## Workflow Flow
```
Trigger (Schedule/Manual/Webhook)
    |
Initialize Variables (API keys, URLs)
    |
Feed Configuration -> Fetch All Feeds -> Parse All Feeds
    |
Filter & Extract Articles (keyword matching)
    |
Batch for Embeddings (SplitInBatches, 20 per batch)
    |
[LOOP] Build Gemini Request -> Gemini Embeddings -> Map Embeddings Back
    |
Semantic Deduplication (cosine similarity > 0.88)
    |
Check Articles Exist?
    |
YES: Qdrant Insert -> Track Metrics -> Query Recent -> Gemini Summarize -> MQTT
NO: No Articles Message -> MQTT
```

## Triggers
- **Schedule:** Every 6 hours (automatic)
- **Manual:** Click "Execute Workflow" in n8n UI
- **Webhook:** POST to `/webhook/ai-news-trigger` (may have issues with HA ingress)

## Success Criteria
- Workflow completes without errors
- At least 1 article collected and stored
- MQTT message published to `homeassistant/daily/ai-news`
