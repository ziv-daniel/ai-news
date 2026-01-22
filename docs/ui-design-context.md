# AI News RAG - UI Design Context

## Project Overview

AI News RAG is a personal AI news aggregator that collects articles from multiple sources (Hacker News, Reddit AI subreddits, arXiv, TechCrunch) and uses AI to score and tier them by relevance.

**Tech Stack:**
- Frontend: Next.js 15.5.9, React, TypeScript
- Backend: FastAPI (Python)
- Database: Supabase (PostgreSQL)
- Workflow: n8n for RSS ingestion and AI scoring

---

## Design Goals

1. **Dark-first aesthetic** - Inspired by Linear, Vercel, Raycast
2. **News reader style** - Clean, readable like Feedly
3. **Priority-based organization** - Articles grouped by AI-assigned tiers
4. **Minimal cognitive load** - Quick scanning of headlines

---

## Current Design Decisions

### Layout Structure

- **Hybrid layout**: List view for urgent/high priority, grid for medium/low
- **Single column** centered content (max-width 900px)
- **Sticky header** with logo, search button, theme toggle
- **Section headers** showing tier name and article count

### Tier System

| Tier | Purpose | Border Color | Hex |
|------|---------|--------------|-----|
| Urgent | Breaking/critical news | Red | `#ef4444` |
| High | Important, timely | Amber | `#f59e0b` |
| Medium | Interesting but not urgent | Blue | `#3b82f6` |
| Low | General/background | Gray | `#525252` |

### Color Palette (Dark Theme)

```
Page Background:  #09090b (near black)
Card Background:  #1f1f23 (dark gray)
Card Border:      #3a3a3f (subtle gray)
Title Text:       #ffffff (white)
Summary Text:     #a0a0a0 (muted gray)
Timestamp:        #666666 (dim gray)
Section Headers:  #71717a (zinc-400)
```

### Card Design

- **Left border**: 6px colored by tier (primary visual indicator)
- **Border radius**: 12px
- **Padding**: 20px
- **Shadow**: `0 4px 12px rgba(0,0,0,0.5)`
- **Content**: Title, summary snippet (2 lines max), timestamp
- **Interaction**: Click opens article in new tab, marks as read (opacity 0.5)

### Typography

- **Titles**: 16px (list) / 14px (grid), weight 600, white
- **Summaries**: 14px (list) / 12px (grid), line-height 1.5, gray
- **Timestamps**: 12px, right-aligned, dim gray

---

## Data Model

```typescript
interface Article {
  id: string;
  title: string;
  link: string;
  summary: string;        // May contain HTML from RSS
  tier: 'urgent' | 'high' | 'medium' | 'low';
  collected_at: string;   // ISO timestamp
  read: boolean;
  archived: boolean;
  source: string;         // 'hackernews', 'reddit', 'arxiv', 'techcrunch'
}
```

---

## Current Implementation

### File Structure

```
frontend/
  app/
    page.tsx          # Main page with tier sections
    layout.tsx        # Root layout with theme provider
    globals.css       # Tailwind + CSS variables
  components/
    article-card.tsx  # Card component with inline styles
    header.tsx        # Sticky header
    search-command.tsx # Cmd+K search dialog
  lib/
    api.ts            # API client functions
```

### Key Implementation Details

1. **Inline styles**: Using React `CSSProperties` objects instead of Tailwind classes (fixed CSS compilation issues)
2. **HTML stripping**: `stripHtml()` function removes HTML tags from RSS summaries
3. **Time formatting**: `timeAgo()` shows relative time (5m, 2h, 3d)
4. **SWR**: Data fetching with `useSWR` for caching and revalidation

---

## Known Issues / User Feedback

1. **Design initially not visible** - CSS compilation issues required switching to inline styles
2. **Raw HTML in summaries** - Fixed with regex stripping
3. **User wanted more visual distinction** - Current design may feel too subtle

---

## Potential Improvements to Consider

1. **Hover effects** - Lift/glow on card hover
2. **Skeleton loading** - Shimmer placeholders while loading
3. **Source badges** - Show article source (HN, Reddit, etc.)
4. **Urgent tier glow** - Pulsing/glowing effect for urgent articles
5. **Grid layout for all tiers** - More compact view
6. **Filtering/sorting** - Filter by source, tier, read status
7. **Keyboard navigation** - j/k to move between articles
8. **Better mobile responsive** - Current design optimized for desktop

---

## API Endpoints

```
GET /articles?archived=false    # Get active articles
PATCH /articles/{id}            # Update read/archived status
GET /articles/search?q=query    # Search articles
```

---

## Questions for Redesign

1. Is the left-border tier indicator effective or too subtle?
2. Should cards have more visual weight (stronger borders, backgrounds)?
3. Is the hybrid list/grid layout ideal or should everything be consistent?
4. How should sources be displayed?
5. What interactions would improve scanning efficiency?
6. Should there be more visual hierarchy beyond tier colors?
