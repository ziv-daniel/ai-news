'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getArticles, updateArticle, Article } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { ArticlePreview } from '@/components/article-preview';
import { cn } from '@/lib/utils';

interface SectionBadgeProps {
  tier: 'urgent' | 'high' | 'more';
  label: string;
}

function SectionBadge({ tier, label }: SectionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-md',
        'text-xs font-semibold uppercase tracking-wide',
        tier === 'urgent' && 'bg-[hsl(var(--tier-urgent-bg))] text-[hsl(var(--tier-urgent))]',
        tier === 'high' && 'bg-[hsl(var(--tier-high-bg))] text-[hsl(var(--tier-high))]',
        tier === 'more' && 'bg-muted text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          tier === 'urgent' && 'bg-[hsl(var(--tier-urgent))]',
          tier === 'high' && 'bg-[hsl(var(--tier-high))]',
          tier === 'more' && 'bg-muted-foreground'
        )}
      />
      {label}
    </span>
  );
}

interface SectionHeaderProps {
  tier: 'urgent' | 'high' | 'more';
  label: string;
  count: number;
}

function SectionHeader({ tier, label, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <SectionBadge tier={tier} label={label} />
      <span className="text-[13px] text-muted-foreground/60">
        {count} {count === 1 ? 'article' : 'articles'}
      </span>
    </div>
  );
}

interface StatProps {
  value: number;
  label: string;
  dot?: 'urgent' | 'high' | 'medium';
}

function Stat({ value, label, dot }: StatProps) {
  return (
    <div className="flex items-center gap-2">
      {dot && (
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            dot === 'urgent' && 'bg-[hsl(var(--tier-urgent))]',
            dot === 'high' && 'bg-[hsl(var(--tier-high))]',
            dot === 'medium' && 'bg-[hsl(var(--tier-medium))]'
          )}
        />
      )}
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StatsBar({
  total,
  urgent,
  high,
  medium,
}: {
  total: number;
  urgent: number;
  high: number;
  medium: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 p-4 px-5 bg-card rounded-xl shadow-sm mb-8">
      <Stat value={total} label="articles today" />
      {urgent > 0 && <Stat value={urgent} label="urgent" dot="urgent" />}
      {high > 0 && <Stat value={high} label="high priority" dot="high" />}
      {medium > 0 && <Stat value={medium} label="medium" dot="medium" />}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-xl p-5 shadow-sm"
        >
          <div className="skeleton h-5 w-3/4 mb-3 rounded" />
          <div className="skeleton h-4 w-full mb-2 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-6 bg-card rounded-xl shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-content text-2xl">
        📰
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No articles yet</h3>
      <p className="text-sm text-muted-foreground">
        Check back later for AI news updates
      </p>
    </div>
  );
}

export default function Home() {
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: articles, isLoading, mutate } = useSWR<Article[]>(
    'articles',
    () => getArticles({ archived: false })
  );

  const handleMarkRead = async (id: string) => {
    await updateArticle(id, { read: true });
    mutate();
  };

  const handlePreview = (article: Article) => {
    setPreviewArticle(article);
    setPreviewOpen(true);
  };

  // Group articles by tier
  const urgent = articles?.filter((a) => a.tier === 'urgent') || [];
  const high = articles?.filter((a) => a.tier === 'high') || [];
  const medium = articles?.filter((a) => a.tier === 'medium') || [];
  const low = articles?.filter((a) => a.tier === 'low') || [];
  const moreArticles = [...medium, ...low];

  const total = articles?.length || 0;

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1000px] px-6 py-8 pb-12">
        {/* Stats Bar */}
        {!isLoading && total > 0 && (
          <StatsBar
            total={total}
            urgent={urgent.length}
            high={high.length}
            medium={medium.length}
          />
        )}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Urgent Section */}
        {urgent.length > 0 && (
          <section className="mb-10">
            <SectionHeader tier="urgent" label="Urgent" count={urgent.length} />
            <div className="flex flex-col gap-4">
              {urgent.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="list"
                  onMarkRead={handleMarkRead}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </section>
        )}

        {/* High Priority Section */}
        {high.length > 0 && (
          <section className="mb-10">
            <SectionHeader tier="high" label="High Priority" count={high.length} />
            <div className="flex flex-col gap-4">
              {high.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="list"
                  onMarkRead={handleMarkRead}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </section>
        )}

        {/* More Articles (Medium + Low) - Grid Layout */}
        {moreArticles.length > 0 && (
          <section className="mb-10">
            <SectionHeader tier="more" label="More Articles" count={moreArticles.length} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="grid"
                  onMarkRead={handleMarkRead}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && total === 0 && <EmptyState />}
      </div>

      {/* Article Preview Sheet */}
      <ArticlePreview
        article={previewArticle}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
}
