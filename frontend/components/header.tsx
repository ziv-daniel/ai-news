'use client';

import { useState, useEffect } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SearchCommand } from '@/components/search-command';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur bg-card/95 border-b border-border">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-6">
          {/* Logo */}
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            AI News RAG
          </h1>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors bg-background border border-border text-muted-foreground hover:border-primary hover:text-foreground shadow-sm"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-2 hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline bg-muted text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg p-2 transition-colors bg-transparent border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
