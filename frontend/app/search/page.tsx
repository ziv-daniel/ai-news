'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Sparkles, Type } from 'lucide-react';
import { searchArticles, updateArticle, Article } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<'vector' | 'text'>('text');
  const [results, setResults] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const articles = await searchArticles(
        query,
        searchMode === 'vector',
        20
      );
      setResults(articles);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, searchMode]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleMarkRead = async (id: string) => {
    await updateArticle(id, { read: true });
    setResults(
      (prev) => prev?.map((a) => (a.id === id ? { ...a, read: true } : a)) || null
    );
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-10">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for AI news..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <Tabs
            value={searchMode}
            onValueChange={(v) => setSearchMode(v as 'vector' | 'text')}
          >
            <TabsList>
              <TabsTrigger value="vector" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Vector
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {searchMode === 'vector'
              ? 'Semantic search finds articles with similar meaning.'
              : 'Text search finds articles containing your exact keywords.'}
          </p>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <>
            <div className="mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </h2>
              <div className="mt-2 h-px bg-border" />
            </div>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="list"
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No articles found for "{query}"
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try different keywords or switch search mode.
                </p>
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!loading && !results && (
          <div className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              Enter a search query to find articles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[900px] px-6 py-10">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
