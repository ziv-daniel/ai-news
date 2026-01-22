# AI News RAG - Testing Guide

## How to Test the Workflow

### Method 1: Manual Trigger (Recommended)
1. Open n8n UI: https://home.danielshaprvt.work/ -> Sidebar -> n8n
2. Open workflow "AI News RAG v2 - Gemini Edition"
3. Click "Execute Workflow" button
4. Watch execution in real-time

### Method 2: Via API (MCP)
```bash
# Note: Webhook may fail due to HA ingress - use Manual Trigger instead
n8n_test_workflow workflowId="JRCaBo3mLsqGeKpk" triggerType="webhook" timeout=180000
```

### Method 3: Wait for Schedule
- Workflow runs automatically every 6 hours
- Check execution history to verify

---

## Verification Steps

### 1. Check Workflow Structure
```bash
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="structure"
```

Verify connections:
- `Batch for Embeddings` output[0] -> `Semantic Deduplication` (done)
- `Batch for Embeddings` output[1] -> `Build Gemini Request` (loop)
- `Build Gemini Request` -> `Gemini Embeddings`

### 2. Validate Before Running
```bash
n8n_validate_workflow id="JRCaBo3mLsqGeKpk"
```

Look for:
- No critical errors (warnings about typeVersion are OK)
- Valid connections
- No expression errors

### 3. Check Execution Results
```bash
# List recent executions
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=5

# Get details of specific execution
n8n_executions action="get" id="EXECUTION_ID" mode="summary"
```

### 4. Verify Success Criteria
A successful run should show:
- **Status:** success
- **All nodes executed:** ~23 nodes
- **Articles collected:** > 0
- **MQTT published:** Yes

---

## Expected Node Execution Path (Success)

1. Manual Trigger / Every 6 Hours
2. Initialize Variables
3. Feed Configuration (outputs 24 feeds)
4. Fetch All Feeds (fetches 24 RSS feeds)
5. Parse All Feeds (parses XML, outputs ~1000+ entries)
6. Filter & Extract Articles (filters by AI keywords, outputs ~100-1000 articles)
7. Batch for Embeddings (processes in batches of 20)
8. [LOOP for each batch]:
   - Build Gemini Request
   - Gemini Embeddings
   - Map Embeddings Back
9. Semantic Deduplication (removes similar articles)
10. Check Articles Exist (should be TRUE)
11. Qdrant Insert (stores articles with vectors)
12. Track Insertion Metrics
13. Query Recent Articles
14. Format for Gemini
15. Gemini Summarize
16. Extract Summary
17. Format MQTT Output
18. Publish to MQTT

---

## Common Failure Points

| Node | Possible Issue | Solution |
|------|----------------|----------|
| Fetch All Feeds | RSS feed timeout | Check network, some feeds may be down |
| Gemini Embeddings | 429 rate limit | Reduce batch size or add delay |
| Gemini Embeddings | pairedItem error | Check no `$('NodeName')` refs outside loop |
| Qdrant Insert | Connection refused | Check Qdrant URL/API key |
| Gemini Summarize | Empty response | Check API key, quota |
| Publish to MQTT | Connection failed | Check MQTT credentials |

---

## Debugging Failed Executions

```bash
# Get error details
n8n_executions action="get" id="EXECUTION_ID" mode="error"

# This shows:
# - Which node failed
# - Error message and stack trace
# - Input data that caused the error
# - Execution path leading to error
```

---

## Quick Health Check

```bash
# 1. Check n8n is connected
n8n_health_check mode="diagnostic"

# 2. Verify workflow is active
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="minimal"
# Should show: active: true

# 3. Check last execution
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=1
# Check status is "success"
```
