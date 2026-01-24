# Translation Preference Feature Implementation Plan

## Overview

Add support for translating AI-generated analysis into user-preferred languages (English, Hebrew, German, French), allowing users to read summaries in their native language while keeping the rest of the UI in English.

## UI Pattern

Use **Dropdown Selector** pattern with language flags/codes:
- English (en) - default, no translation needed
- Hebrew (he) - requires RTL layout for content
- German (de)
- French (fr)

The selector appears alongside the existing DetailLevelSelector in the article preview modal.

---

## Phase 1: Frontend Hook - Language Preference Persistence

### Files to Create

**New: `frontend/lib/hooks/use-language-preference.ts`**

Similar pattern to `use-detail-preference.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'he' | 'de' | 'fr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
  de: 'Deutsch',
  fr: 'Français',
};

const STORAGE_KEY = 'ai-news-language-preference';
const DEFAULT_LANGUAGE: Language = 'en';

function getStoredPreference(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'he' || stored === 'de' || stored === 'fr') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_LANGUAGE;
}

function setStoredPreference(language: Language): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // localStorage not available
  }
}

export function useLanguagePreference(): [Language, (language: Language) => void] {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLanguage(getStoredPreference());
    setIsHydrated(true);
  }, []);

  const updateLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setStoredPreference(lang);
  }, []);

  // Return default during SSR, actual value after hydration
  return [isHydrated ? language : DEFAULT_LANGUAGE, updateLanguage];
}
```

### Implementation Notes

1. Use `'he'` (ISO 639-1) for Hebrew instead of `'heb'` (ISO 639-2) for consistency with web standards
2. Include native language names in labels for accessibility
3. Same SSR hydration pattern as detail preference to avoid React hydration mismatches

---

## Phase 2: Frontend Component - Language Selector

### Files to Create

**New: `frontend/components/language-selector.tsx`**

```typescript
'use client';

import { cn } from '@/lib/utils';
import type { Language, LANGUAGE_LABELS } from '@/lib/hooks/use-language-preference';
import { Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'he', label: 'עברית', flag: '🇮🇱' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  const currentLanguage = languages.find(l => l.value === value) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
          'border border-border bg-muted/50 transition-all',
          'hover:bg-background focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentLanguage.label}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => onChange(lang.value)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              value === lang.value && 'bg-accent'
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### UI/UX Considerations

1. Use dropdown instead of toggle group (4 options is too many for segmented control)
2. Show flag emoji for quick recognition
3. Display native language names for accessibility
4. Compact design to fit alongside DetailLevelSelector
5. Globe icon indicates translation/language feature

---

## Phase 3: API Layer Updates

### Files to Modify

**Modify: `frontend/lib/api.ts`**

1. Add Language type export (or import from hook):

```typescript
export type Language = 'en' | 'he' | 'de' | 'fr';
```

2. Update `LongSummaryResponse` interface:

```typescript
export interface LongSummaryResponse {
  success: boolean;
  article_id: string;
  long_summary: string;
  detail_level?: string;
  language?: string;        // Add: language used for response
  translated?: boolean;     // Add: whether translation was applied
  cached: boolean;
}
```

3. Update `fetchLongSummary` function:

```typescript
export async function fetchLongSummary(
  articleId: string,
  detailLevel: DetailLevel = 'medium',
  language: Language = 'en'        // Add language parameter
): Promise<LongSummaryResponse> {
  const response = await fetch(LONG_SUMMARY_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      article_id: articleId,
      detail_level: detailLevel,
      language: language,          // Add to request body
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch long summary: ${response.status}`);
  }

  return response.json();
}
```

---

## Phase 4: Article Preview Integration

### Files to Modify

**Modify: `frontend/components/article-preview.tsx`**

1. Import new hook and component:

```typescript
import { useLanguagePreference, Language } from '@/lib/hooks/use-language-preference';
import { LanguageSelector } from '@/components/language-selector';
```

2. Add language state (alongside detail level):

```typescript
const [detailLevel, setDetailLevel] = useDetailPreference();
const [language, setLanguage] = useLanguagePreference();
```

3. Update cache key to include language:

```typescript
function getCacheKey(articleId: string, detailLevel: DetailLevel, language: Language): string {
  return `${articleId}_${detailLevel}_${language}`;
}
```

4. Update useEffect dependencies and API call:

```typescript
useEffect(() => {
  if (!open || !article) {
    return;
  }

  const cacheKey = getCacheKey(article.id, detailLevel, language);

  // Check cache first
  const cached = longSummaryCache.get(cacheKey);
  if (cached) {
    setLongSummary(cached);
    return;
  }

  // Skip legacy cache check for non-English or non-medium
  if (detailLevel === 'medium' && language === 'en' && article.long_summary) {
    setLongSummary(article.long_summary);
    longSummaryCache.set(cacheKey, article.long_summary);
    return;
  }

  // Fetch from n8n webhook
  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const response = await fetchLongSummary(article.id, detailLevel, language);
      if (response.success && response.long_summary) {
        setLongSummary(response.long_summary);
        longSummaryCache.set(cacheKey, response.long_summary);
      } else {
        setSummaryError('Failed to generate detailed summary');
      }
    } catch (error) {
      setSummaryError('Unable to fetch detailed summary');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  fetchSummary();
}, [open, article, detailLevel, language]);  // Add language to deps
```

5. Add RTL support for Hebrew content:

```typescript
{!isLoadingSummary && longSummary && (
  <div
    className={cn(
      "text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap",
      language === 'he' && "text-right"
    )}
    dir={language === 'he' ? 'rtl' : 'ltr'}
  >
    {longSummary}
  </div>
)}
```

6. Add LanguageSelector to UI (next to DetailLevelSelector):

```typescript
<div className="flex items-center justify-between mb-3">
  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
    <Sparkles className="w-4 h-4" />
    AI Analysis
    {isLoadingSummary && (
      <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating...
      </span>
    )}
  </h3>
  <div className="flex items-center gap-2">
    <LanguageSelector
      value={language}
      onChange={setLanguage}
      disabled={isLoadingSummary}
    />
    <DetailLevelSelector
      value={detailLevel}
      onChange={setDetailLevel}
      disabled={isLoadingSummary}
    />
  </div>
</div>
```

7. Optional: Add language indicator badge when translation is active:

```typescript
{language !== 'en' && (
  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
    {LANGUAGE_LABELS[language]}
  </span>
)}
```

---

## Phase 5: n8n Workflow Updates

### Webhook Node Changes

Accept `language` parameter in request body:
- Default: `"en"` (English)
- Validate: must be one of `"en"`, `"he"`, `"de"`, `"fr"`

### New Node: Translation Decision (IF Node)

After generating the summary, check if translation is needed:

```javascript
// Condition: Language is not English
{{ $json.language !== 'en' }}
```

### New Node: Translate Summary (Groq HTTP Request)

Only execute when `language !== 'en'`:

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

**Headers:**
- Authorization: `Bearer {GROQ_API_KEY}`
- Content-Type: `application/json`

**Body:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {
      "role": "system",
      "content": "You are a professional translator. Translate the following text accurately into {{$json.target_language}}. Preserve the original meaning, tone, and formatting (including paragraphs). Only output the translation, no explanations."
    },
    {
      "role": "user",
      "content": "{{$json.summary_to_translate}}"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 4096
}
```

### Language Mapping for Prompts

```javascript
const languageNames = {
  'he': 'Hebrew',
  'de': 'German',
  'fr': 'French'
};
```

### Caching Strategy

**Cache key format:** `{article_id}_{detail_level}_{language}`

Example: `abc123_medium_he`

**Supabase columns to add:**
- `brief_summary_he`, `brief_summary_de`, `brief_summary_fr`
- `medium_summary_he`, `medium_summary_de`, `medium_summary_fr`
- `detailed_summary_he`, `detailed_summary_de`, `detailed_summary_fr`

**Alternative approach (recommended for maintainability):**
Create a separate `article_translations` table:

```sql
CREATE TABLE article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  detail_level TEXT NOT NULL CHECK (detail_level IN ('brief', 'medium', 'detailed')),
  language TEXT NOT NULL CHECK (language IN ('he', 'de', 'fr')),
  translated_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, detail_level, language)
);
```

### Workflow Node Flow

```
Webhook
  │
  ├─► Validate Input (Function)
  │     - Validate article_id, detail_level, language
  │     - Set defaults if missing
  │
  ├─► Check Cache (Supabase/Qdrant)
  │     - Key: article_id + detail_level + language
  │     │
  │     ├─► [Cached] Return cached summary
  │     │
  │     └─► [Not Cached] Continue
  │
  ├─► Generate Summary (existing flow)
  │     - Use Groq/Gemini for base English summary
  │
  ├─► IF: language !== 'en'
  │     │
  │     ├─► [True] Translate via Groq
  │     │     - Translate generated summary
  │     │
  │     └─► [False] Skip translation
  │
  ├─► Store in Cache
  │     - Save translated/original summary
  │
  └─► Return Response
        {
          success: true,
          article_id: "...",
          long_summary: "translated or original text",
          detail_level: "medium",
          language: "he",
          translated: true,
          cached: false
        }
```

---

## Phase 6: Error Handling

### Translation Failure Fallback

If translation fails:
1. Log the error
2. Return the English summary with a flag
3. Frontend can show a warning: "Translation unavailable, showing English version"

```typescript
// n8n Code node for error handling
try {
  const translated = await translateSummary(summary, language);
  return { summary: translated, translated: true };
} catch (error) {
  console.error('Translation failed:', error);
  return { summary: originalEnglishSummary, translated: false, translation_error: true };
}
```

### Frontend Error Display

```typescript
{response.translation_error && (
  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
    Translation unavailable. Showing English version.
  </p>
)}
```

---

## Phase 7: RTL Support Deep Dive

### CSS Considerations for Hebrew

1. **Text direction:**
   ```css
   [dir="rtl"] {
     text-align: right;
   }
   ```

2. **Paragraph spacing still works with RTL**

3. **Potential font considerations:**
   - System fonts generally support Hebrew
   - Consider adding Hebrew-optimized font if needed

### Component Updates

The RTL support in Phase 4 should be sufficient. The `dir="rtl"` attribute handles:
- Text alignment
- Punctuation placement
- Reading direction

---

## Phase 8: Testing & Verification

### Unit Tests

1. `useLanguagePreference` hook:
   - Default value is 'en'
   - Persists to localStorage
   - Updates state correctly

2. `LanguageSelector` component:
   - Renders all language options
   - Calls onChange with correct value
   - Disabled state works

### Integration Tests

1. API layer:
   - `fetchLongSummary` sends language parameter
   - Response includes language field

### Manual Testing Checklist

- [ ] Default language is English on first visit
- [ ] Language preference persists across page reloads
- [ ] Selecting Hebrew shows RTL text alignment
- [ ] Selecting German/French shows correct translation
- [ ] Cache works correctly (same article+level+language returns cached)
- [ ] Different languages fetch fresh translations
- [ ] Loading states work during translation
- [ ] Error fallback shows English with warning
- [ ] UI doesn't break with long translated text

### n8n Workflow Testing

```bash
# Test with Manual Trigger
# Set input:
{
  "article_id": "test-id-123",
  "detail_level": "medium",
  "language": "he"
}

# Verify response includes translated Hebrew text
```

---

## Success Criteria

- [ ] User can select from 4 languages (en/he/de/fr)
- [ ] Default is English on first visit
- [ ] Preference persists across sessions (localStorage)
- [ ] Only AI Analysis section is translated
- [ ] Hebrew content displays RTL correctly
- [ ] Translations are cached per article+level+language
- [ ] English requests skip translation step (performance)
- [ ] Translation errors fall back gracefully to English
- [ ] UI indicates when translation is active

---

## Dependencies

### New Dependencies
- None required (shadcn/ui dropdown already available)

### External Services
- Groq API for translation (already configured in n8n)

### Optional Enhancements
- Add more languages later (Spanish, Chinese, etc.)
- User-configurable translation model
- Quality feedback mechanism

---

## Estimated Complexity

| Component | Effort | Risk |
|-----------|--------|------|
| Frontend hook | Low | Low |
| Frontend component | Low | Low |
| API updates | Low | Low |
| Article preview integration | Medium | Low |
| n8n workflow updates | Medium | Medium |
| Caching/database | Medium | Low |
| RTL support | Low | Low |
| Error handling | Low | Low |

**Total Estimated Effort:** 1-2 days

---

## Known Pitfalls (from fixes-and-lessons.md)

1. **n8n SplitInBatches:** If translation is done in a batch loop, avoid referencing nodes outside the loop with `$('NodeName')` syntax.

2. **No template literals:** Use string concatenation in n8n expressions.

3. **Validate workflow:** Run `n8n_validate_workflow` before deploying changes.

4. **Test with Manual Trigger:** Webhook may fail through HA ingress; use manual trigger for testing.
