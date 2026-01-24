# Detail Levels Feature Implementation Plan

## Overview

Add support for three detail levels (Brief/Medium/Detailed) for AI-generated article summaries, allowing users to control the verbosity of the analysis.

## UI Pattern

Use **ToggleGroup/Segmented Control** pattern (similar to Gemini's approach):
- Brief (1 paragraph) - compact overview
- Medium (2 paragraphs) - balanced detail (default)
- Detailed (4+ paragraphs) - full analysis

## Phase 1: Frontend UI Component

### Files to Create/Modify

1. **New**: `frontend/components/detail-level-selector.tsx`
   - ToggleGroup with 3 options: Brief | Medium | Detailed
   - Icons: minimize, default, expand
   - Positioned in article preview modal header

2. **New**: `frontend/lib/hooks/use-detail-preference.ts`
   - Custom hook for localStorage persistence
   - Default: "medium"
   - Key: "ai-news-detail-preference"

3. **Modify**: `frontend/components/article-preview.tsx`
   - Add DetailLevelSelector component
   - Pass detail level to API call
   - Show loading state during level changes

### Implementation Details

```typescript
// detail-level-selector.tsx
type DetailLevel = 'brief' | 'medium' | 'detailed';

interface Props {
  value: DetailLevel;
  onChange: (level: DetailLevel) => void;
  disabled?: boolean;
}
```

## Phase 2: API Layer Updates

### Modify: `frontend/lib/api.ts`

1. Update `fetchLongSummary` to accept `detailLevel` parameter:
   ```typescript
   export async function fetchLongSummary(
     articleId: string,
     detailLevel: 'brief' | 'medium' | 'detailed' = 'medium'
   ): Promise<LongSummaryResponse>
   ```

2. Add new response fields:
   ```typescript
   export interface LongSummaryResponse {
     success: boolean;
     article_id: string;
     long_summary: string;
     detail_level: string;
     cached: boolean;
   }
   ```

## Phase 3: n8n Workflow Updates

### Webhook Node Changes
- Accept `detail_level` parameter (default: "medium")
- Validate: must be one of "brief", "medium", "detailed"

### Groq Prompt Templates

**Brief (1 paragraph)**:
```
Provide a single concise paragraph (3-4 sentences) summarizing the key point of this article.
```

**Medium (2 paragraphs)**:
```
Provide a balanced 2-paragraph analysis:
1. Key findings and main points
2. Implications and context
```

**Detailed (4+ paragraphs)**:
```
Provide a comprehensive analysis covering:
1. Executive summary
2. Key findings and technical details
3. Industry implications
4. Expert perspective and future outlook
```

### Caching Strategy
- Cache key: `{article_id}_{detail_level}`
- Check Supabase for existing summary at requested level
- Generate only if not cached

## Phase 4: Supabase Schema Updates

### Add Columns to `articles` Table

```sql
ALTER TABLE articles
ADD COLUMN brief_summary TEXT,
ADD COLUMN medium_summary TEXT,
ADD COLUMN detailed_summary TEXT;

-- Rename existing column for clarity
ALTER TABLE articles
RENAME COLUMN long_summary TO detailed_summary;
```

### Update n8n to Store by Level
- When generating summary, store in appropriate column
- Check appropriate column first before generating

## Phase 5: Testing & Verification

1. Unit tests for useDetailPreference hook
2. Integration test for API with different levels
3. Manual testing of n8n workflow with each level
4. Verify caching works correctly
5. Test localStorage persistence

## Success Criteria

- [ ] User can toggle between 3 detail levels
- [ ] Default is "medium" on first visit
- [ ] Preference persists across sessions
- [ ] Each level generates appropriate content length
- [ ] Summaries are cached per level
- [ ] Smooth loading states during transitions

## Dependencies

- shadcn/ui for ToggleGroup component (or custom implementation)
- No new npm packages required

## Estimated Complexity

- Frontend: Medium (new component + hook + integration)
- Backend (n8n): Low-Medium (parameter handling + prompt variants)
- Database: Low (column additions)
