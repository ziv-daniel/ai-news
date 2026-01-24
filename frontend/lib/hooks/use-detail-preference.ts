'use client';

import { useState, useEffect, useCallback } from 'react';

export type DetailLevel = 'brief' | 'medium' | 'detailed';

const STORAGE_KEY = 'ai-news-detail-preference';
const DEFAULT_LEVEL: DetailLevel = 'medium';

function getStoredPreference(): DetailLevel {
  if (typeof window === 'undefined') {
    return DEFAULT_LEVEL;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'brief' || stored === 'medium' || stored === 'detailed') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_LEVEL;
}

function setStoredPreference(level: DetailLevel): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // localStorage not available
  }
}

export function useDetailPreference(): [DetailLevel, (level: DetailLevel) => void] {
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(DEFAULT_LEVEL);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setDetailLevel(getStoredPreference());
    setIsHydrated(true);
  }, []);

  const updateDetailLevel = useCallback((level: DetailLevel) => {
    setDetailLevel(level);
    setStoredPreference(level);
  }, []);

  // Return default during SSR, actual value after hydration
  return [isHydrated ? detailLevel : DEFAULT_LEVEL, updateDetailLevel];
}
