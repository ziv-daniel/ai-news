# AI News RAG - Content Enrichment Design

**Date:** 2025-12-29
**Status:** Approved
**Workflow ID:** `JRCaBo3mLsqGeKpk`

## Problem Statement

The AI news summaries are essentially rephrased titles with no real value. Example output:

```
1. How to stop Claude Code from littering your codebase: Stop Claude Code from littering codebases
2. Altman offers $555k for AI role: Altman offers $555k for AI role
3. AI Trainer kicks himself: No summary available
```

**Root cause:** The summarizer only receives `title + description (max 300 chars)` from RSS feeds. Many feeds have empty or minimal descriptions, so the LLM can only rephrase the title.

## Solution: Hybrid Content Enrichment

Fetch full article content only when the RSS description is too short (<100 chars).

### Architecture

```
Query Recent Articles
        ↓
   [NEW] Enrich Articles ← fetch content if description < 100 chars
        ↓
   Format for Gemini (updated prompt)
        ↓
   Groq Summarize
```

## Implementation Details

### 1. New "Enrich Articles" Code Node

**Position:** After "Query Recent Articles", before "Format for Gemini"
**Type:** Code node (JavaScript)
**Mode:** Run Once for All Items

```javascript
// Enrich Articles - fetch full content for articles with short descriptions
const DESCRIPTION_THRESHOLD = 100;  // chars
const CONTENT_LIMIT = 1000;         // chars to extract
const FETCH_TIMEOUT = 5000;         // ms
const DELAY_BETWEEN_REQUESTS = 500; // ms

const articles = $input.all();
const enrichedArticles = [];

// Helper: extract main content from HTML
function extractContent(html) {
  // Remove scripts, styles, nav, header, footer
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Try to find main content area
  const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (articleMatch) clean = articleMatch[1];
  else if (mainMatch) clean = mainMatch[1];

  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // Clean whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean.substring(0, CONTENT_LIMIT);
}

// Helper: delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Process each article
for (let i = 0; i < articles.length; i++) {
  const article = articles[i].json;
  const description = article.description || '';

  let enriched_content = description;
  let enrichment_source = 'original';

  // Only fetch if description is too short
  if (description.length < DESCRIPTION_THRESHOLD && article.link) {
    try {
      // Add delay between requests (except first)
      if (i > 0) await delay(DELAY_BETWEEN_REQUESTS);

      const response = await fetch(article.link, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AINewsBot/1.0)',
          'Accept': 'text/html'
        },
        redirect: 'follow',
        timeout: FETCH_TIMEOUT
      });

      if (response.ok) {
        const html = await response.text();
        const extracted = extractContent(html);

        if (extracted.length > 50) {
          enriched_content = extracted;
          enrichment_source = 'fetched';
        }
      }
    } catch (error) {
      console.log(`Failed to enrich ${article.link}: ${error.message}`);
      // Keep original description as fallback
    }
  }

  enrichedArticles.push({
    json: {
      ...article,
      enriched_content,
      enrichment_source
    }
  });
}

console.log(`Enriched ${enrichedArticles.filter(a => a.json.enrichment_source === 'fetched').length}/${enrichedArticles.length} articles`);

return enrichedArticles;
```

### 2. Updated "Format for Gemini" Code Node

```javascript
// Select top 15 articles by recency
const allArticles = $input.all();
const TOP_N = 15;

const topArticles = allArticles.slice(0, TOP_N);

if (topArticles.length === 0) {
  return [{ json: { prompt: '', articles: [], article_count: 0 } }];
}

// Build prompt with better instructions
let prompt = `You are an AI news analyst. For each article below, write a 1-2 sentence insight about WHY this matters or what's significant.

RULES:
- Focus on the "so what" - why should someone care?
- If content is thin, say "No details available" rather than rephrasing the title
- Be specific, not generic
- Don't start with "This article..." - be direct

Return ONLY a JSON array with insights in order:
["Insight 1", "Insight 2", ...]

---
ARTICLES:
`;

topArticles.forEach((item, idx) => {
  const a = item.json;
  // Use enriched_content if available, fall back to description
  const content = a.enriched_content || a.description || '';
  prompt += `\n${idx + 1}. ${a.title}\nSource: ${a.source_name}\nContent: ${content.substring(0, 800)}\n`;
});

console.log(`Prepared ${topArticles.length} articles for summarization`);

return [{
  json: {
    prompt,
    articles: topArticles.map(item => ({
      title: item.json.title,
      link: item.json.link,
      source_name: item.json.source_name,
      description: item.json.description,
      enriched_content: item.json.enriched_content,
      enrichment_source: item.json.enrichment_source
    })),
    article_count: topArticles.length
  }
}];
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| HTTP timeout (>5s) | Skip enrichment, use original description |
| 403/401 (paywalled) | Use original description |
| Redirect loops | Follow up to default limit, then skip |
| Non-HTML response | Use original description |
| Empty body after extraction | Use original description |
| Total time exceeded | Process what we can, skip remaining |

## Expected Impact

- **Quality:** Real insights instead of rephrased titles
- **Performance:** +5-10 seconds (15 articles × 500ms delay)
- **Coverage:** ~50-70% of articles expected to need enrichment
- **Fallback:** Original description ensures no breakage

## Nodes to Modify

1. **Add:** "Enrich Articles" (new Code node)
2. **Update:** "Format for Gemini" (updated prompt)
3. **Wire:** Query Recent Articles → Enrich Articles → Format for Gemini

## Rollback Plan

If enrichment causes issues:
1. Delete "Enrich Articles" node
2. Reconnect Query Recent Articles → Format for Gemini
3. Revert "Format for Gemini" to original code

The `enriched_content` field fallback ensures graceful degradation.
