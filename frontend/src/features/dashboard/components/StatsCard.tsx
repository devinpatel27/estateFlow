import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'rose';
  isLoading?: boolean;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue',
  isLoading,
}: StatsCardProps) {
  const colors = colorMap[color];

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </Card>
    );
  }

  return (
    <Card className={cn('crm-card p-5 border-0 shadow-sm', colors.bg)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.iconBg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </Card>
  );
}
