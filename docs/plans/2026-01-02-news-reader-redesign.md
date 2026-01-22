# AI News RAG - News Reader Redesign

## Design Decisions

| Aspect | Choice |
|--------|--------|
| Aesthetic | News Reader - clean, content-first like Feedly/Inoreader |
| Layout | Hybrid - list for urgent/high, grid for medium/low |
| Card content | Tier + Title + Summary snippet |
| Tier indicator | Colored left border (4px) |
| Density | 80% comfortable, 20% balanced |

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  AI News RAG                    [Search] [Theme]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  URGENT · 2 articles                                    │
│  ─────────────────────                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │▌ Full-width list card with red left border      │   │
│  │▌ Summary text here...                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  HIGH PRIORITY · 5 articles                             │
│  ─────────────────────                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │▌ Full-width list card with amber left border    │   │
│  │▌ Summary text here...                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  MORE ARTICLES · 23 articles                            │
│  ─────────────────────                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │▌ Grid card   │  │▌ Grid card   │  │▌ Grid card   │  │
│  │▌ Summary...  │  │▌ Summary...  │  │▌ Summary...  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Card Design

### List Card (Urgent/High)
- Full width
- 4px colored left border
- Title: 18px, weight 500
- Summary: 14px, muted, 2 lines max
- Timestamp: 12px, right-aligned, tertiary color
- Padding: 24px

### Grid Card (Medium/Low)
- 3-column grid
- 4px colored left border
- Title: 16px, weight 500
- Summary: 13px, muted, 2 lines max
- Timestamp: 12px, compact
- Padding: 24px

## Colors

### Dark Theme
```
Background:     #0A0A0B
Card surface:   #141416
Text primary:   #FAFAFA
Text secondary: #888888
Text tertiary:  #555555
Card borders:   #222222
```

### Tier Borders
```
Urgent:   #DC2626 (red)
High:     #F59E0B (amber)
Medium:   #3B82F6 (blue)
Low:      #404040 (dark gray)
```

## Typography

```
Font family:    Geist Sans
Title (list):   18px, weight 500, line-height 1.4
Title (grid):   16px, weight 500, line-height 1.4
Summary:        14px, weight 400, line-height 1.5
Timestamp:      12px, weight 400
Section label:  11px, weight 600, uppercase, letter-spacing 0.05em
```

## Spacing

```
Card padding:       24px
List card gap:      16px
Grid card gap:      20px
Section gap:        48px
Page max-width:     900px (centered)
```

## Interactions

- **Hover**: Subtle 2px lift, border brightens
- **Click**: Opens article in new tab, marks as read
- **Read state**: 50% opacity
- **Actions**: Hidden (right-click/long-press for mark read, favorite, archive)

## Header

- Logo/name only (no navigation)
- Search button (Cmd+K)
- Theme toggle (icon only)
