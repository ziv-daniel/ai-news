---
name: debugging-ai-news-rag
description: Use when debugging or modifying the AI News RAG v2 n8n workflow, analyzing execution failures, investigating data flow issues, or testing workflow changes
---

# Debugging AI News RAG Workflow

## Overview

Quick reference for debugging the AI News RAG v2 - Gemini Edition n8n workflow. Covers workflow structure, common issues, testing procedures, and n8n MCP tools.

**Core principle:** Always verify changes with execution data before claiming success.

## When to Use

Use this skill when:
- Debugging workflow execution failures
- Investigating unexpected MQTT message output
- Testing workflow modifications
- Analyzing data flow between nodes
- Understanding workflow behavior

## Workflow Quick Reference

**Workflow ID:** `JRCaBo3mLsqGeKpk`
**Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
**n8n Access:** https://home.danielshaprvt.work/ → Sidebar → n8n

### Node Flow
```
Trigger (Manual/Webhook/Schedule)
  ↓
Initialize Variables
  ↓
Feed Configuration → Fetch All Feeds → Parse All Feeds
  ↓
Filter & Extract Articles
  ↓
Batch for Embeddings ⟲ (loop)
  ↓                  ↑
Build Gemini Request → Gemini Embeddings → Map Embeddings Back
  ↓
Semantic Deduplication
  ↓
Check Articles Exist (IF)
  ├─ TRUE → Enrich Articles → Format for Gemini → Groq Summarize → Extract Summary → Format MQTT → Publish to MQTT
  └─ FALSE → No Articles Message → Publish to MQTT
```

### Critical Nodes

| Node | Purpose | Common Issues |
|------|---------|---------------|
| **Parse All Feeds** | Extract RSS items, strip CDATA | CDATA tags in titles, source_name detection |
| **Enrich Articles** | Add full content to short descriptions | fetch() not available in n8n |
| **Format for Gemini** | Build LLM prompt from articles | Wrong input pattern ($input.all() vs $input.first()) |
| **Extract Summary** | Parse LLM JSON response | JSON parsing errors, "No details available" |
| **Format MQTT** | Build markdown message | CDATA tags, missing clickable links |

## Common Issues and Fixes

### CDATA Tags in Output
**Symptom:** Message shows `<![CDATA[Article Title]]>`
**Root Cause:** RSS feeds wrap content in CDATA, not stripped during parsing
**Fix:** Add `stripCDATA()` helper in Parse All Feeds:
```javascript
function stripCDATA(text) {
  if (!text) return '';
  return text.replace(/^<!\[CDATA\[(.*?)\]\]>$/s, '$1').trim();
}
// Apply to: title, link, description
const title = titleMatch ? stripCDATA(titleMatch[1].trim()) : '';
```

### fetch() Not Available Error
**Symptom:** `fetch is not defined` in node execution
**Root Cause:** n8n Code nodes don't have fetch() API
**Fix:** Use RSS descriptions directly instead of fetching full articles
```javascript
// Don't try to fetch - just use RSS content
const enrichedContent = article.description || article.content || '';
```

### Format for Gemini Receives 0 Articles
**Symptom:** `article_count: 0`, LLM returns "No details available"
**Root Cause:** Wrong input pattern - using `$input.first().json.articles` when articles are individual items
**Fix:** Use `$input.all()` to get all items:
```javascript
const articles = $input.all().map(item => item.json);  // Gets all 300 items
```

### Article Titles Not Clickable
**Symptom:** Titles are plain text, links only in "Source:" line
**Root Cause:** Markdown format doesn't make title a link
**Fix:** Make title a clickable link in Format MQTT:
```javascript
articlesList += `### ${idx + 1}. [${article.title}](${article.link})\n`;
```

### Unknown Source Names
**Symptom:** Articles show `source_name: "Unknown"`
**Root Cause:** Feed detection in Parse All Feeds missing pattern or checking wrong field
**Fix:** Check both link and description for HN articles, add missing domain patterns

## Debugging Procedures

### 1. Check Latest Execution
```bash
# List recent executions
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=3

# Get specific execution (error mode for debugging)
n8n_executions action="get" id="EXEC_ID" mode="error"
```

### 2. Analyze Node Output
```bash
# Get specific nodes from execution
n8n_executions action="get" id="EXEC_ID" mode="filtered" \
  nodeNames=["Parse All Feeds", "Format MQTT"] itemsLimit=2
```

### 3. Extract Node Code
Use PowerShell to extract specific node code from workflow:
```powershell
# Get workflow data
$workflow = (n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="full" | ConvertFrom-Json).data
$node = $workflow.nodes | Where-Object { $_.name -eq "Node Name" }
Write-Host $node.parameters.jsCode
```

### 4. Validate Before Deploying
```bash
# Always validate after changes
n8n_validate_workflow id="JRCaBo3mLsqGeKpk"
```

### 5. Test Changes
**CRITICAL:** Webhook trigger fails due to HA ingress. Use Manual Trigger from n8n UI:
1. Home Assistant → n8n
2. Open "AI News RAG v2 - Gemini Edition"
3. Click "Test Workflow" button

## n8n MCP Tools Reference

### Get Workflow
```bash
# Structure only (fast)
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="structure"

# Full workflow with code (large)
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="full"
```

### Update Workflow
```bash
# Partial update (preferred)
n8n_update_partial_workflow id="JRCaBo3mLsqGeKpk" operations=[{
  "type": "updateNode",
  "nodeName": "Node Name",
  "updates": {"parameters": {"jsCode": "..."}}
}]

# Full update (requires complete nodes[] and connections{})
n8n_update_full_workflow id="JRCaBo3mLsqGeKpk" nodes=[...] connections={...}
```

### Get Executions
```bash
# List executions
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=5

# Get execution details
n8n_executions action="get" id="EXEC_ID" mode="summary"     # 2 items/node
n8n_executions action="get" id="EXEC_ID" mode="error"       # Error debugging
n8n_executions action="get" id="EXEC_ID" mode="filtered" \
  nodeNames=["Node1", "Node2"] itemsLimit=5
```

## Known n8n Limitations

| Limitation | Workaround |
|------------|------------|
| No fetch() in Code nodes | Use HTTP Request nodes or RSS descriptions |
| $('NodeName') fails in loops | Don't reference nodes outside SplitInBatches loop |
| Webhook fails via HA ingress | Use Manual Trigger from n8n UI |
| Large execution data (>25k tokens) | Use mode="filtered" with specific nodeNames |

## Data Flow Patterns

### SplitInBatches Loop
```javascript
// Inside loop: Can't use $('External Node')
// Use $input.all() for current batch data
const batchItems = $input.all();
```

### Code Node Input Patterns
```javascript
// Single item with properties
const data = $input.first().json;
const value = data.someProperty;

// Multiple individual items (common in this workflow)
const allItems = $input.all().map(item => item.json);
```

### Code Node Output
```javascript
// Return array of items
return items.map(item => ({ json: item }));

// Return single item
return [{ json: { result: "value" } }];
```

## Red Flags - Investigate Immediately

If you see these, stop and investigate:
- `enriched_content: ""` - Enrichment failed
- `article_count: 0` - Data flow broken
- `source_name: "Unknown"` - Feed detection failing
- CDATA tags in final output - Parsing incomplete
- Execution shows nodes didn't run - Connection issue
- "No details available" from LLM - No content provided

## Real-World Fixes Applied

| Issue | Session | Fix |
|-------|---------|-----|
| CDATA in titles | 2025-12-30 | Added stripCDATA() in Parse All Feeds |
| fetch() errors | 2025-12-30 | Removed fetch, use RSS descriptions |
| 0 articles to LLM | 2025-12-30 | Changed $input.first() to $input.all() |
| Titles not clickable | 2025-12-30 | Made titles markdown links in Format MQTT |

## Testing Checklist

Before claiming workflow is fixed:
- [ ] Validate workflow: `n8n_validate_workflow`
- [ ] Check latest execution for errors
- [ ] Verify node outputs match expectations
- [ ] Test manually if possible (or wait for schedule)
- [ ] Confirm MQTT message format is correct
- [ ] Check no CDATA tags in output
- [ ] Verify article titles are clickable links

## Bottom Line

**Never assume a fix worked without checking execution data.**

Changes applied ≠ changes working. Always verify with actual execution output.
