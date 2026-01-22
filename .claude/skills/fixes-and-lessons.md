# AI News RAG - Fixes and Lessons Learned

## Critical n8n Knowledge

### SplitInBatches Node Behavior
- **Output 0 (main[0]):** "done" - fires when ALL batches complete
- **Output 1 (main[1]):** "loop" - fires for EACH batch iteration
- Connect processing nodes to output 1 (loop), final nodes to output 0 (done)

### PairedItem Errors in Loops
**CRITICAL:** Inside SplitInBatches loops, NEVER use `$('NodeName')` expressions that reference nodes OUTSIDE the loop.

**Why it fails:** n8n tracks which output item came from which input item (pairedItem). When you reference a node outside the loop, n8n can't maintain this tracking.

**Example of broken code:**
```javascript
// In HTTP Request URL inside SplitInBatches loop
$('Initialize Variables').item.json.gemini_api_key
```

**Solutions:**
1. Hardcode the value directly (if it's a constant)
2. Pass the value through earlier nodes in the loop
3. Use `$input.first().json` or `$json` for immediate upstream data

---

## Issue #1: Template Literal Syntax Error

**Location:** Qdrant Insert node -> jsonBody

**Error:** n8n expressions don't support JavaScript template literals `` `${}` ``

**Broken:**
```javascript
`article_${idx}_${Date.now()}`
```

**Fixed:**
```javascript
'article_' + String(idx) + '_' + String(Date.now())
```

---

## Issue #2: Connection Flow Error

**Error:** "Node 'Build Gemini Request' hasn't been executed"

**Cause:** Spurious direct connection from `Batch for Embeddings` -> `Gemini Embeddings` caused execution order issues.

**Fix:**
- Remove: `Batch for Embeddings` -> `Gemini Embeddings`
- Keep: `Build Gemini Request` -> `Gemini Embeddings`

**Correct flow:**
```
Batch for Embeddings [output 1] -> Build Gemini Request -> Gemini Embeddings
```

---

## Issue #3: PairedItem Data Error

**Error:** "Paired item data for item from node 'Build Gemini Request' is unavailable"

**Cause:** Gemini Embeddings URL used `$('Initialize Variables').item.json.gemini_api_key` inside the SplitInBatches loop.

**Fix:** Hardcode the API key directly in the URL (since it's a constant value anyway).

**Before:**
```
=https://...?key={{ $('Initialize Variables').item.json.gemini_api_key }}
```

**After:**
```
https://...?key=AIzaSyD6YKtuYUtyl4-Te_pCu2aaF-lk1lgKtRI
```

---

## Debugging Commands (n8n MCP)

```bash
# List workflows
n8n_list_workflows

# Get full workflow details
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="full"

# Validate workflow
n8n_validate_workflow id="JRCaBo3mLsqGeKpk"

# Check recent executions
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=5

# Get execution error details
n8n_executions action="get" id="EXECUTION_ID" mode="error"

# Update node parameters
n8n_update_partial_workflow id="JRCaBo3mLsqGeKpk" operations=[
  {"type": "updateNode", "nodeId": "node-id", "updates": {"parameters": {...}}}
]
```

---

## Prevention Checklist

Before deploying workflow changes:
- [ ] No template literals in expressions
- [ ] Inside SplitInBatches: no `$('NodeName')` refs to nodes outside loop
- [ ] Correct connection from SplitInBatches (output 0 = done, output 1 = loop)
- [ ] Run `n8n_validate_workflow` to catch issues
- [ ] Test with Manual Trigger before relying on schedule
