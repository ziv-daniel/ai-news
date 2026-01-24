'use client';

import { useState, useEffect } from 'react';
import { Article, fetchLongSummary } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, TrendingUp, Tag, Bookmark, Sparkles, Loader2 } from 'lucide-react';

interface ArticlePreviewProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: (id: string) => void;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  });
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

const tierStyles: Record<string, { bg: string; text: string; label: string }> = {
  urgent: {
    bg: 'bg-[hsl(var(--tier-urgent)/0.1)]',
    text: 'text-[hsl(var(--tier-urgent))]',
    label: 'Urgent'
  },
  high: {
    bg: 'bg-[hsl(var(--tier-high)/0.1)]',
    text: 'text-[hsl(var(--tier-high))]',
    label: 'High Priority'
  },
  medium: {
    bg: 'bg-[hsl(var(--tier-medium)/0.1)]',
    text: 'text-[hsl(var(--tier-medium))]',
    label: 'Medium'
  },
  low: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    label: 'Low'
  },
};

const sourceBadgeStyles: Record<string, string> = {
  hn: 'bg-[hsl(var(--source-hn-bg))] text-[hsl(var(--source-hn))]',
  reddit: 'bg-[hsl(var(--source-reddit-bg))] text-[hsl(var(--source-reddit))]',
  rss: 'bg-[hsl(var(--source-rss-bg))] text-[hsl(var(--source-rss))]',
};

const sourceLabels: Record<string, string> = {
  hn: 'Hacker News',
  reddit: 'Reddit',
  rss: 'RSS Feed',
};

const categoryLabels: Record<string, string> = {
  announcement: 'Announcement',
  breakthrough: 'Breakthrough',
  analysis: 'Analysis',
  tutorial: 'Tutorial',
  news: 'News',
  research: 'Research',
};

// Cache for long summaries to avoid re-fetching
const longSummaryCache = new Map<string, string>();

export function ArticlePreview({
  article,
  open,
  onOpenChange,
  onMarkRead,
}: ArticlePreviewProps) {
  const [longSummary, setLongSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch long summary when sheet opens
  useEffect(() => {
    if (!open || !article) {
      return;
    }

    // Check cache first
    const cached = longSummaryCache.get(article.id);
    if (cached) {
      setLongSummary(cached);
      return;
    }

    // Check if article already has long_summary
    if (article.long_summary) {
      setLongSummary(article.long_summary);
      longSummaryCache.set(article.id, article.long_summary);
      return;
    }

    // Fetch from n8n webhook
    const fetchSummary = async () => {
      setIsLoadingSummary(true);
      setSummaryError(null);

      try {
        const response = await fetchLongSummary(article.id);
        if (response.success && response.long_summary) {
          setLongSummary(response.long_summary);
          longSummaryCache.set(article.id, response.long_summary);
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
  }, [open, article]);

  // Reset state when article changes
  useEffect(() => {
    if (!article) {
      setLongSummary(null);
      setSummaryError(null);
    }
  }, [article?.id]);

  if (!article) return null;

  const cleanSummary = stripHtml(article.summary || '');
  const source = getSourceFromLink(article.link);
  const tierStyle = tierStyles[article.tier] || tierStyles.low;

  const handleOpenOriginal = () => {
    if (onMarkRead) {
      onMarkRead(article.id);
    }
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader className="text-left pr-8">
          {/* Tier and Category badges */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold',
                tierStyle.bg,
                tierStyle.text
              )}
            >
              {tierStyle.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
              <Tag className="w-3 h-3" />
              {categoryLabels[article.category] || article.category}
            </span>
          </div>

          {/* Title */}
          <SheetTitle className="text-xl leading-tight">
            {article.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Article preview with summary and link to original
          </SheetDescription>
        </SheetHeader>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
          {/* Source */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold',
              sourceBadgeStyles[source]
            )}
          >
            {sourceLabels[source]}
          </span>

          {/* Time */}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(article.collected_at)}
          </span>

          {/* Score */}
          {article.score > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {article.score} points
            </span>
          )}
        </div>

        {/* Source name */}
        <p className="mt-3 text-sm text-muted-foreground">
          via <span className="font-medium text-foreground">{article.source_name}</span>
        </p>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Quick Summary section */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Quick Summary
          </h3>
          <p className="text-[15px] leading-relaxed text-foreground/90">
            {cleanSummary || 'No summary available for this article.'}
          </p>
        </div>

        {/* Detailed Summary section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Detailed Analysis
            {isLoadingSummary && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI is analyzing...
              </span>
            )}
          </h3>

          {isLoadingSummary && (
            <div className="space-y-3">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-11/12 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded mt-4" />
              <div className="skeleton h-4 w-5/6 rounded" />
            </div>
          )}

          {!isLoadingSummary && summaryError && (
            <p className="text-sm text-muted-foreground italic">
              {summaryError}. Read the original article for more details.
            </p>
          )}

          {!isLoadingSummary && longSummary && (
            <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {longSummary}
            </div>
          )}

          {!isLoadingSummary && !longSummary && !summaryError && (
            <p className="text-sm text-muted-foreground italic">
              Click an article to generate a detailed AI analysis.
            </p>
          )}
        </div>

        {/* Status indicators */}
        {(article.read || article.favorited) && (
          <div className="mt-6 flex items-center gap-3">
            {article.read && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Already read
              </span>
            )}
            {article.favorited && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Favorited
              </span>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="mt-8">
          <Button
            onClick={handleOpenOriginal}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Read Original Article
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
