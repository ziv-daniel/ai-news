'use client';

import { Article } from '@/lib/api';
import { useState } from 'react';

interface ArticleCardProps {
  article: Article;
  onSwipeRight?: (id: string) => void;
  onSwipeLeft?: (id: string) => void;
}

const tierColors = {
  urgent: 'bg-red-50 border-red-500 dark:bg-red-900/20',
  high: 'bg-amber-50 border-amber-500 dark:bg-amber-900/20',
  medium: 'bg-blue-50 border-blue-500 dark:bg-blue-900/20',
  low: 'bg-gray-50 border-gray-500 dark:bg-gray-900/20',
};

const tierBadges = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  medium: 'bg-blue-500 text-white',
  low: 'bg-gray-500 text-white',
};

export default function ArticleCard({ article, onSwipeRight, onSwipeLeft }: ArticleCardProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      // Swipe left - favorite
      onSwipeLeft?.(article.id);
    }

    if (touchEnd - touchStart > 100) {
      // Swipe right - mark as read
      onSwipeRight?.(article.id);
    }
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 transition-all ${
        tierColors[article.tier as keyof typeof tierColors]
      } ${article.read ? 'opacity-60' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              tierBadges[article.tier as keyof typeof tierBadges]
            }`}>
              {article.tier.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {article.category}
            </span>
          </div>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {article.title}
          </a>
        </div>
        <div className="flex gap-2 ml-3">
          {article.read && (
            <span className="text-xs text-green-600" title="Read">
              ✓
            </span>
          )}
          {article.favorited && (
            <span className="text-xs text-yellow-500" title="Favorited">
              ★
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
        {article.summary}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{article.source_name}</span>
        <span>{new Date(article.collected_at).toLocaleDateString()}</span>
      </div>

      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Swipe → to mark read, ← to favorite
      </div>
    </div>
  );
}
