# AI News RAG - Frontend Redesign Plan

## Overview
Complete UI overhaul using shadcn/ui components with a modern dark-first tech aesthetic inspired by Linear, Vercel, and Raycast.

---

## Design System

### Color Palette (Dark Theme Default)

#### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#09090B` | Main background (Zinc-950) |
| `--bg-secondary` | `#18181B` | Cards, panels (Zinc-900) |
| `--bg-tertiary` | `#27272A` | Elevated elements (Zinc-800) |
| `--bg-hover` | `#3F3F46` | Hover states (Zinc-700) |

#### Tier Colors (with subtle glow)
| Tier | Background | Border | Text |
|------|------------|--------|------|
| Urgent | `#450A0A` | `#DC2626` | `#FCA5A5` |
| High | `#451A03` | `#F59E0B` | `#FCD34D` |
| Medium | `#172554` | `#3B82F6` | `#93C5FD` |
| Low | `#27272A` | `#52525B` | `#A1A1AA` |

#### Accent
- Primary: `#2563EB` (Electric Blue)
- Accent: `#22D3EE` (Cyan for highlights)

### Typography
- **Sans:** Geist Sans (headlines, UI)
- **Mono:** Geist Mono (timestamps, code, sources)

---

## Layout Structure

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  [Nav]              [Search Cmd+K]  [Theme] [User]  │
├────────────┬────────────────────────────────────────────────┤
│  SIDEBAR   │  [All] [Urgent] [High] [Medium] [Low]          │
│  (240px)   ├────────────────────────────────────────────────┤
│            │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ Categories │  │  Card 1  │ │  Card 2  │ │  Card 3  │        │
│ Sources    │  └──────────┘ └──────────┘ └──────────┘        │
│ Date       │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ Status     │  │  Card 4  │ │  Card 5  │ │  Card 6  │        │
│            │  └──────────┘ └──────────┘ └──────────┘        │
└────────────┴────────────────────────────────────────────────┘
```

### Mobile (< 768px)
- Collapsible header with hamburger menu
- Filter sheet (slide from bottom)
- Single column cards
- Sticky tier pills (horizontal scroll)

---

## Implementation Steps

### Phase 1: Foundation (shadcn Setup)
1. Initialize shadcn/ui in frontend
2. Configure MCP server for AI-assisted component generation
3. Install Geist fonts
4. Set up Tailwind color tokens
5. Configure dark mode with next-themes

### Phase 2: Core Components
Install these shadcn components:
- `button`, `badge`, `card`
- `command` (for Cmd+K search)
- `dropdown-menu`, `sheet`
- `select`, `checkbox`, `tabs`
- `skeleton`, `scroll-area`, `tooltip`

Build custom components:
- `TierBadge` - Custom badge variants per tier
- `ArticleCard` - Redesigned with hover effects
- `SearchCommand` - Global search dialog
- `FilterSidebar` - Desktop filter panel
- `FilterSheet` - Mobile filter drawer
- `Header` - With search, theme toggle, navigation

### Phase 3: Layout & Pages
1. Create new layout with sidebar
2. Redesign home page with grid layout
3. Redesign search page with inline results
4. Add keyboard shortcuts (Cmd+K search)

### Phase 4: Polish
1. Add Framer Motion animations
2. Implement skeleton loading states
3. Fine-tune hover/focus states
4. Add micro-interactions

---

## Component Specifications

### ArticleCard
```tsx
<Card className="group border-zinc-800 hover:border-zinc-600
                 hover:-translate-y-0.5 transition-all duration-200">
  <CardHeader>
    <div className="flex justify-between">
      <TierBadge tier="urgent" />
      <span className="text-xs text-zinc-500 font-mono">2h ago</span>
    </div>
    <CardTitle className="group-hover:text-blue-400 transition-colors">
      {title}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-zinc-400 line-clamp-2">{summary}</p>
    <div className="flex gap-2 mt-3">
      <Badge variant="outline">{category}</Badge>
      <span className="text-xs text-zinc-500">{source}</span>
    </div>
  </CardContent>
</Card>
```

### TierBadge Variants
```tsx
const tierVariants = {
  urgent: "bg-red-950 text-red-300 border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.2)]",
  high: "bg-amber-950 text-amber-300 border-amber-800",
  medium: "bg-blue-950 text-blue-300 border-blue-800",
  low: "bg-zinc-800 text-zinc-400 border-zinc-700",
}
```

---

## Files to Create/Modify

### New Files
- `components/ui/` - All shadcn components
- `components/article-card.tsx` - Redesigned card
- `components/tier-badge.tsx` - Custom tier badges
- `components/search-command.tsx` - Global search
- `components/filter-sidebar.tsx` - Desktop filters
- `components/filter-sheet.tsx` - Mobile filters
- `components/header.tsx` - New header
- `components/theme-provider.tsx` - Dark mode
- `components/mode-toggle.tsx` - Theme switch

### Modify
- `app/layout.tsx` - Add theme provider, new structure
- `app/page.tsx` - New layout with sidebar + grid
- `app/search/page.tsx` - Inline search experience
- `tailwind.config.ts` - Custom colors, fonts
- `app/globals.css` - CSS variables, animations

---

## Inspiration References
1. **Linear.app** - Card layouts, dark theme, typography
2. **Vercel Dashboard** - Status badges, search (cmdk)
3. **Raycast** - Command palette, keyboard-first UX
4. **GitHub** - Priority badges, filter sidebar
5. **The Verge** - News card layouts, categories

---

## Success Criteria
- [ ] Dark mode by default with theme toggle
- [ ] Responsive: mobile-first, works on all devices
- [ ] Keyboard accessible (Cmd+K search, navigation)
- [ ] Visual tier hierarchy is immediately clear
- [ ] Cards have smooth hover animations
- [ ] Loading states use skeleton shimmer
- [ ] Filters work on desktop (sidebar) and mobile (sheet)
- [ ] Typography is readable and modern (Geist)
