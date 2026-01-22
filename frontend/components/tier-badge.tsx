import { cn } from '@/lib/utils';

type Tier = 'urgent' | 'high' | 'medium' | 'low';

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

const tierStyles: Record<Tier, string> = {
  urgent:
    'bg-red-950 text-red-300 border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.2)]',
  high: 'bg-amber-950 text-amber-300 border-amber-800',
  medium: 'bg-blue-950 text-blue-300 border-blue-800',
  low: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        tierStyles[tier],
        className
      )}
    >
      {tier.toUpperCase()}
    </span>
  );
}
