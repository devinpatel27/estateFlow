'use client';

import { cn } from '@/lib/utils';

export interface FilterTabOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface FilterTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterTabOption<T>[];
  className?: string;
  'aria-label'?: string;
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'crm-filter-tabs inline-flex shrink-0 items-center rounded-lg border border-input bg-background p-0.5 shadow-sm',
        className
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-full items-center gap-1 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
