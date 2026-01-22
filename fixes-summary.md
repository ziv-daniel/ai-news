# AI News RAG v2 - Gemini Edition: Workflow Fixes Summary

**Date:** 2025-12-29 (updated)
**Workflow ID:** `JRCaBo3mLsqGeKpk`
**Status:** Fixed - pairedItem error resolved

## Overview

The n8n workflow "AI News RAG v2 - Gemini Edition" was failing during execution. Three issues were identified and fixed.

## Access Information

- **n8n is hosted as a Home Assistant add-on** via [hass-n8n](https://github.com/Rbillon59/hass-n8n)
- **Access path:** https://home.danielshaprvt.work/ → Sidebar → n8n
- **Direct ingress URL:** `https://home.danielshaprvt.work/3cfc8f0f_hass-n8n/ingress`

## Issues Fixed

### 1. Qdrant Insert - Template Literal Syntax Error

**Error:** n8n doesn't support JavaScript template literals (`${}`) in expressions

**Location:** `Qdrant Insert` node → `jsonBody` parameter

**Original code (broken):**
```javascript
`article_${idx}_${Date.now()}`
```

**Fixed code:**
```javascript
'article_' + String(idx) + '_' + String(Date.now())
```

**Full fixed jsonBody expression:**
```
={{ { points: $input.all().map((item, idx) => ({ id: item.json.article_id || ('article_' + String(idx) + '_' + String(Date.now())), vector: item.json.embedding, payload: { title: item.json.title, link: item.json.link, description: item.json.description, source_name: item.json.source_name, published_date: item.json.published_date, collected_at: item.json.collected_at, word_count: item.json.word_count } })) } }}
```

### 2. Gemini Embeddings - Connection Flow Error

**Error:** "Node 'Build Gemini Request' hasn't been executed"

**Root Cause:** There was a direct connection from `Batch for Embeddings` → `Gemini Embeddings` that caused `Gemini Embeddings` to execute before `Build Gemini Request` completed.

**Fix Applied:**
1. Removed the spurious connection: `Batch for Embeddings` → `Gemini Embeddings`
2. Added proper connection: `Build Gemini Request` → `Gemini Embeddings`

**Correct flow:**
```
Batch for Embeddings → Build Gemini Request → Gemini Embeddings → Map Embeddings Back
```

### 3. Gemini Embeddings - Paired Item Data Error (NEW)

**Error:** "Paired item data for item from node 'Build Gemini Request' is unavailable"

**Root Cause:** Inside the SplitInBatches loop, the Gemini Embeddings node was using an expression `$('Initialize Variables').item.json.gemini_api_key` in the URL. When n8n evaluates expressions inside a SplitInBatches loop that reference nodes outside the loop, it loses paired item tracking.

**Fix Applied:**
1. Hardcoded the Gemini API key directly in the Gemini Embeddings URL (instead of using an expression)
2. Simplified Build Gemini Request code to remove unnecessary API key passthrough

**Original URL (broken):**
```
=https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={{ $('Initialize Variables').item.json.gemini_api_key }}
```

**Fixed URL:**
```
https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=AIzaSyD6YKtuYUtyl4-Te_pCu2aaF-lk1lgKtRI
```

**Key Lesson:** Inside SplitInBatches loops, avoid using `$('NodeName')` expressions that reference nodes outside the loop. Either:
- Hardcode values directly
- Pass values through the loop via earlier nodes in the flow
- Use `$input` or `$json` to reference data from the immediate upstream node

## Workflow Architecture

```
Schedule Trigger (Every 6 Hours)
    ↓
Initialize Variables (API keys for Qdrant, Gemini)
    ↓
Fetch RSS (5 parallel sources):
├── Reddit AI subreddits
├── TechCrunch AI
├── Hacker News AI topics
├── OpenAI News
└── Ars Technica AI
    ↓
Parse XML → Merge All Feeds → Filter & Extract Articles
    ↓
Batch for Embeddings (SplitInBatches)
    ↓
Build Gemini Request → Gemini Embeddings (batchEmbedContents API)
    ↓
Map Embeddings Back → Semantic Deduplication
    ↓
Check Articles Exist
├── TRUE: Qdrant Insert → Track Metrics → Query Recent → Gemini Summarize → MQTT
└── FALSE: No Articles Message → MQTT
```

## API Endpoints Used

- **Gemini Embeddings:** `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents`
- **Gemini Summarize:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **Qdrant:** Custom Qdrant instance (URL in Initialize Variables node)
- **MQTT Topic:** `homeassistant/daily/ai-news`

## Notes

- API keys are hardcoded in the "Initialize Variables" node (consider using n8n credentials)
- The Gemini Embeddings URL now has the API key hardcoded directly (required to avoid pairedItem errors in SplitInBatches loop)
- The workflow has 23 nodes total
- Some validator warnings remain about outdated `typeVersions` (non-critical)
- Webhook testing via API may fail due to Home Assistant ingress/proxy configuration; use Manual Trigger from n8n UI instead

## Commands Used for Debugging

```bash
# List workflows
n8n_list_workflows

# Get workflow details
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="full"

# Validate workflow
n8n_validate_workflow id="JRCaBo3mLsqGeKpk"

# Update node parameters
n8n_update_partial_workflow id="JRCaBo3mLsqGeKpk" operations=[...]

# Fix connections
n8n_update_partial_workflow id="JRCaBo3mLsqGeKpk" operations=[
  {"type": "removeConnection", "source": "Batch for Embeddings", "target": "Gemini Embeddings"},
  {"type": "addConnection", "source": "Build Gemini Request", "target": "Gemini Embeddings"}
]
```
