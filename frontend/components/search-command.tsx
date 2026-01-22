'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { searchArticles, Article } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tierColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-neutral-500',
};

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const articles = await searchArticles(value, false, 5);
      setResults(articles);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (article: Article) => {
    onOpenChange(false);
    window.open(article.link, '_blank');
  };

  const handleFullSearch = () => {
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search articles..."
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Articles">
            {results.map((article) => (
              <CommandItem
                key={article.id}
                value={article.title}
                onSelect={() => handleSelect(article)}
                className="flex items-start gap-3 py-3"
              >
                <div
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    tierColors[article.tier] || tierColors.low
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {article.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {article.summary}
                  </p>
                </div>
              </CommandItem>
            ))}
            {query.length >= 2 && (
              <CommandItem onSelect={handleFullSearch} className="justify-center text-muted-foreground">
                <Search className="mr-2 h-4 w-4" />
                View all results
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
