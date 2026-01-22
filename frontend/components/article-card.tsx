'use client';

import { Article } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  variant?: 'list' | 'grid';
  onMarkRead?: (id: string) => void;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getSourceFromLink(link: string): 'hn' | 'reddit' | 'rss' {
  if (link.includes('news.ycombinator.com') || link.includes('hacker-news')) {
    return 'hn';
  }
  if (link.includes('reddit.com')) {
    return 'reddit';
  }
  return 'rss';
}

const tierBorderColors: Record<string, string> = {
  urgent: 'border-l-[hsl(var(--tier-urgent))]',
  high: 'border-l-[hsl(var(--tier-high))]',
  medium: 'border-l-[hsl(var(--tier-medium))]',
  low: 'border-l-muted-foreground',
};

const sourceBadgeStyles: Record<string, string> = {
  hn: 'bg-[hsl(var(--source-hn-bg))] text-[hsl(var(--source-hn))]',
  reddit: 'bg-[hsl(var(--source-reddit-bg))] text-[hsl(var(--source-reddit))]',
  rss: 'bg-[hsl(var(--source-rss-bg))] text-[hsl(var(--source-rss))]',
};

const sourceLabels: Record<string, string> = {
  hn: 'HN',
  reddit: 'Reddit',
  rss: 'RSS',
};

export function ArticleCard({
  article,
  variant = 'list',
  onMarkRead,
}: ArticleCardProps) {
  const cleanSummary = stripHtml(article.summary || '');
  const source = getSourceFromLink(article.link);
  const isUnread = !article.read;
  const isUrgent = article.tier === 'urgent';
  const isHigh = article.tier === 'high';
  const isFeatured = isUrgent;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onMarkRead?.(article.id)}
      className={cn(
        // Base styles
        'block bg-card rounded-xl text-card-foreground no-underline',
        'shadow-sm border border-transparent',
        'transition-all duration-200 ease-out',
        // Hover effects
        'hover:shadow-md hover:border-border hover:-translate-y-0.5',
        // Focus state for accessibility
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        // Unread state - left border
        isUnread && 'border-l-[3px]',
        isUnread && tierBorderColors[article.tier],
        // Read state
        article.read && 'opacity-70 hover:opacity-85',
        // Featured (urgent) cards have gradient bg
        isFeatured && 'bg-gradient-to-br from-[hsl(var(--tier-urgent-bg))] to-card',
        isFeatured && 'border border-[hsl(var(--tier-urgent)/0.15)]',
        isFeatured && 'hover:border-[hsl(var(--tier-urgent)/0.3)]',
        // Variant-specific padding
        variant === 'grid' ? 'p-4' : 'p-5'
      )}
    >
      {/* Top row: Title + Source badge */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3
          className={cn(
            'text-foreground leading-snug',
            'line-clamp-2',
            // Font weight based on read state
            isUnread ? 'font-semibold' : 'font-medium',
            // Size based on variant and featured state
            isFeatured && 'text-lg',
            !isFeatured && variant === 'list' && 'text-[17px]',
            !isFeatured && variant === 'grid' && 'text-[15px]'
          )}
        >
          {article.title}
        </h3>

        {/* Source badge */}
        <span
          className={cn(
            'flex-shrink-0 inline-flex items-center gap-1',
            'px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide',
            sourceBadgeStyles[source]
          )}
        >
          {sourceLabels[source]}
        </span>
      </div>

      {/* Summary */}
      <p
        className={cn(
          'text-muted-foreground leading-relaxed mb-3',
          variant === 'grid' ? 'text-[13px] line-clamp-3' : 'text-sm line-clamp-2',
          isFeatured && 'text-[15px] line-clamp-3'
        )}
      >
        {cleanSummary || 'No summary available'}
      </p>

      {/* Meta row */}
      <div
        className={cn(
          'flex items-center text-muted-foreground',
          variant === 'grid' ? 'text-xs gap-3' : 'text-[13px] gap-4'
        )}
      >
        {/* Points (if available from HN/Reddit) */}
        {article.score && article.score > 0 && (
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 opacity-60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
            {article.score >= 1000
              ? `${(article.score / 1000).toFixed(1)}k`
              : article.score}
          </span>
        )}

        {/* Time ago - pushed to right */}
        <span className="ml-auto text-xs text-muted-foreground/70">
          {timeAgo(article.collected_at)}
        </span>
      </div>
    </a>
  );
}
