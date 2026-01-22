---
name: n8n-workflow-debugging
description: Complete guide for debugging and fixing AI News RAG v2 n8n workflow issues, including malformed JSON parsing, filtering, and data pipeline troubleshooting
---

# n8n Workflow Debugging Guide - AI News RAG v2

## Overview

This skill documents the complete debugging process and solutions for the AI News RAG v2 workflow (ID: `JRCaBo3mLsqGeKpk`), particularly focusing on LLM output parsing, filtering, and data quality issues.

## Critical Issues and Solutions

### Issue 1: Groq LLM Returns Malformed JSON

**Problem:**
Groq's llama-3.3-70b-versatile model returns JSON arrays where:
- First few items are properly quoted: `"No details available",`
- Subsequent items are unquoted multi-line strings: `The tax implications..., potentially disrupting traditional tax structures,`
- Last items may be properly quoted again

**Example Malformed Output:**
```json
[
"No details available",
"No details available",
"No details available",
The tax implications of AI employees could have significant consequences for businesses and governments, potentially disrupting traditional tax structures,
Hijacking AI coding assistants with prompt injection poses a major security risk to developers and companies relying on these tools,
Meta's acquisition of Manus may accelerate AI innovation for businesses, but also raises concerns about data privacy and potential monopolies,
"No details available",
The Responses API's ability to hide reasoning traces raises important questions about transparency and accountability in AI decision-making,
"No details available"
]
```

**Root Cause:**
Standard `JSON.parse()` fails because unquoted strings violate JSON spec.

**Solution:**
Implemented fallback parser in Extract Summary node that:
1. Tries `JSON.parse()` first
2. On failure, splits content by `, \n` pattern (line-ending comma)
3. Strips quotes from each part
4. Returns array of cleaned summaries

**Code Pattern:**
```javascript
try {
  summaries = JSON.parse(cleanJson);
} catch (e) {
  console.log('JSON parse failed, extracting from malformed array');

  let content = groqResponse.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
  const parts = content.split(/,\s*\n/);

  summaries = parts.map(part => {
    part = part.trim();
    if (part.startsWith('"') && part.endsWith('"')) {
      return part.slice(1, -1);
    } else if (part.startsWith('"')) {
      return part.slice(1);
    } else if (part.endsWith('"')) {
      return part.slice(0, -1);
    }
    return part;
  }).filter(s => s.length > 0);
}
```

**Key Insight:** The pattern `, \n` consistently separates items in Groq's malformed output.

---

### Issue 2: Filtering "No Details Available" Articles

**Requirement:**
Remove articles where LLM couldn't generate meaningful summaries from final output.

**Implementation:**
Filter in Extract Summary node after combining summaries with article metadata:

```javascript
const filteredArticles = articlesWithSummaries.filter(article => {
  const summary = article.summary.toLowerCase();
  return !summary.includes('no details available') && !summary.includes('no summary available');
});
```

**Important:** Check for BOTH phrases because:
- LLM may return "No details available" (as instructed)
- Code defaults to "No summary available" when summary missing

---

### Issue 3: Source Name Hyperlinks

**Requirement:**
Make source name itself clickable instead of having separate "Read more" link.

**Before:**
```markdown
**Source:** Reddit AI | [Read more](https://reddit.com/...)
```

**After:**
```markdown
**Source:** [Reddit AI](https://reddit.com/...)
```

**Implementation in Format MQTT Output:**
```javascript
articlesList += `**Source:** [${article.source_name}](${article.link})\n\n`;
```

---

### Issue 4: Source Names Show as "Unknown"

**Problem:**
All articles have `source_name: "Unknown"` instead of actual feed names like "Hacker News AI", "Reddit AI", etc.

**Investigation Path:**

1. **Feed Configuration node** defines feeds correctly:
   ```javascript
   { name: 'Reddit AI', url: 'https://...' }
   { name: 'Hacker News AI', url: 'https://...' }
   ```

2. **Parse All Feeds node** sets source_name correctly:
   ```javascript
   entries.push({
     title: title.trim(),
     link: link.trim(),
     description: desc.trim(),
     pubDate: pubDate.trim(),
     source_name: feedName  // ← Should be set here
   });
   ```

3. **Filter & Extract Articles node** reads source_name:
   ```javascript
   const sourceName = String(json.source_name || 'Unknown').trim();
   ```

**Root Cause:** Data not flowing correctly from Parse All Feeds → Filter & Extract Articles.

**Debug Steps:**
1. Check Parse All Feeds execution output for source_name field
2. Verify Filter & Extract Articles receives correct input structure
3. Check if any intermediate nodes modify the data structure

**Fix Location:** Parse All Feeds node - ensure source_name is correctly set for ALL feed types (RSS 2.0 AND Atom).

---

## Improving LLM Prompt for Valid JSON

**Current Prompt Issues:**
- LLM sometimes returns unquoted strings
- Multi-line strings cause parsing problems
- Inconsistent quote usage

**Improved Prompt Strategy:**

```javascript
let prompt = `You are an AI news analyst. For each article below, write a 1-2 sentence insight about WHY this matters or what's significant.

RULES:
- Focus on the "so what" - why should someone care?
- If content is thin, say "No details available" rather than rephrasing the title
- Be specific, not generic
- Don't start with "This article..." - be direct

CRITICAL: Return ONLY a valid JSON array. Each insight must be a properly quoted string.
Example format: ["Insight 1", "Insight 2", "Insight 3"]

Return your response as a valid JSON array with insights in order:
`;
```

**Additional Safeguards:**
1. Add explicit JSON formatting instruction
2. Provide example format
3. Emphasize "CRITICAL" and "ONLY"
4. Consider lowering temperature (currently 0.3)

---

## Testing Workflow Changes

### Via Playwright (Manual UI Trigger)
```javascript
// Navigate to n8n
await browser.navigate('https://home.danielshaprvt.work/')
await browser.click('n8n sidebar item')
await browser.click('AI News RAG v2 - Gemini Edition')
await browser.click('Manual Trigger node')
await browser.click('Execute workflow button')
```

### Via MCP Tool
```javascript
mcp__n8n-mcp__n8n_executions({
  action: 'list',
  workflowId: 'JRCaBo3mLsqGeKpk',
  limit: 1
})

// Get detailed execution with specific nodes
mcp__n8n-mcp__n8n_executions({
  action: 'get',
  id: 'EXECUTION_ID',
  mode: 'filtered',
  nodeNames: ['Extract Summary', 'Format MQTT Output', 'Groq Summarize']
})
```

### Verify Results Checklist
- [ ] Extract Summary console shows "Extracted X summaries, filtered to Y"
- [ ] Filtering removed articles with "No details available"
- [ ] Format MQTT Output has clickable source names: `[name](url)`
- [ ] Source names show actual feed names (not "Unknown")
- [ ] Summaries align correctly with article titles

---

## Common Debugging Patterns

### Pattern 1: Trace Data Flow
When data is "Unknown" or missing:
1. Start at the SOURCE (Feed Configuration)
2. Check each node's OUTPUT in sequence
3. Find where data is lost or transformed incorrectly
4. Fix at the EARLIEST point of failure

### Pattern 2: Malformed LLM Output
When LLM returns invalid format:
1. Log the RAW response from LLM
2. Identify the pattern (quotes, commas, newlines)
3. Write SPECIFIC parser for that pattern
4. Add fallback to handle variations

### Pattern 3: Filter Not Working
When filter doesn't remove items:
1. Check EXACT text in data vs. filter condition
2. Use `.toLowerCase()` for case-insensitive matching
3. Check for multiple variations of text
4. Log before/after counts to verify

---

## Workflow Node Reference

### Key Nodes in AI News RAG v2

| Node Name | Purpose | Common Issues |
|-----------|---------|---------------|
| Feed Configuration | Define RSS feed sources | None |
| Parse All Feeds | Convert XML to JSON | source_name not set correctly |
| Filter & Extract Articles | Dedupe, filter by keywords | Defaults missing fields to "Unknown" |
| Enrich Articles | Fetch full content for short descriptions | Rate limiting, scraping blocks |
| Format for Gemini | Build LLM prompt with articles | Prompt quality affects LLM output |
| Groq Summarize | Generate summaries via LLM | Returns malformed JSON |
| Extract Summary | Parse LLM response, filter articles | JSON parsing failures |
| Format MQTT Output | Build final markdown message | Formatting issues |

### Node Update Commands

```javascript
// Update single node
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: 'JRCaBo3mLsqGeKpk',
  operations: [{
    type: 'updateNode',
    nodeId: 'extract-summary',
    updates: {
      parameters: {
        jsCode: '...'
      }
    }
  }]
})
```

---

## Lessons Learned

1. **Never trust LLM output format** - Always have fallback parsers
2. **Split patterns matter** - Use actual separators in data (`, \n` not just `,`)
3. **Filter variations** - Check multiple text variations ("no details" vs "no summary")
4. **Trace data flow** - Don't assume data passes through unchanged
5. **Test incrementally** - Verify each fix individually before combining

---

## Session Summary (2025-12-29)

**Completed:**
- ✅ Malformed JSON parsing fix (Extract Summary)
- ✅ Filter "No details available" articles
- ✅ Clickable source name hyperlinks

**Remaining:**
- ⏳ Fix source_name showing "Unknown"
- ⏳ Improve LLM prompt for valid JSON
- ⏳ Test all fixes end-to-end

**Test Results:**
- Execution #139: 15 articles → 12 filtered (3 removed)
- Hyperlinks: Working correctly
- Parsing: Improved but LLM quality varies
