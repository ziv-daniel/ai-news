'use client';

import { cn } from '@/lib/utils';
import type { DetailLevel } from '@/lib/hooks/use-detail-preference';
import { AlignLeft, AlignJustify, FileText } from 'lucide-react';

interface DetailLevelSelectorProps {
  value: DetailLevel;
  onChange: (level: DetailLevel) => void;
  disabled?: boolean;
}

const levels: { value: DetailLevel; label: string; icon: typeof AlignLeft }[] = [
  { value: 'brief', label: 'Brief', icon: AlignLeft },
  { value: 'medium', label: 'Medium', icon: AlignJustify },
  { value: 'detailed', label: 'Detailed', icon: FileText },
];

export function DetailLevelSelector({
  value,
  onChange,
  disabled = false,
}: DetailLevelSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1">
      {levels.map((level) => {
        const Icon = level.icon;
        const isActive = value === level.value;

        return (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
            aria-pressed={isActive}
            aria-label={`${level.label} detail level`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{level.label}</span>
          </button>
        );
      })}
    </div>
  );
}
