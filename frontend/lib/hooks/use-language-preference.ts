'use client';

import { useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'he' | 'de' | 'fr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
  de: 'Deutsch',
  fr: 'Français',
};

const STORAGE_KEY = 'ai-news-language-preference';
const DEFAULT_LANGUAGE: Language = 'en';

function getStoredPreference(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'he' || stored === 'de' || stored === 'fr') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  return DEFAULT_LANGUAGE;
}

function setStoredPreference(language: Language): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // localStorage not available
  }
}

export function useLanguagePreference(): [Language, (language: Language) => void] {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLanguage(getStoredPreference());
    setIsHydrated(true);
  }, []);

  const updateLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setStoredPreference(lang);
  }, []);

  // Return default during SSR, actual value after hydration
  return [isHydrated ? language : DEFAULT_LANGUAGE, updateLanguage];
}
