'use client';

import { CalendarDays, X } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common/DatePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatDate } from '@/lib/utils';

interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (range: { dateFrom?: string; dateTo?: string }) => void;
  className?: string;
}

function formatRangeLabel(from?: string, to?: string): string {
  if (from && to) return `${formatDate(from)} → ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Until ${formatDate(to)}`;
  return 'Date range';
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DateRangePicker({ dateFrom, dateTo, onChange, className }: DateRangePickerProps) {
  const hasRange = Boolean(dateFrom || dateTo);
  const fromDate = toDate(dateFrom);
  const toDateVal = toDate(dateTo);

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'crm-select-trigger gap-2 px-3 font-normal',
            !hasRange && 'text-muted-foreground',
            className
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate text-sm">{formatRangeLabel(dateFrom, dateTo)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-datepicker-popover
        className="pointer-events-auto z-[100] w-auto border-border/60 p-0 shadow-xl"
        align="start"
        sideOffset={8}
      >
        <div className="rounded-2xl bg-popover p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filter by created date
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="space-y-2">
              <p className="text-center text-xs font-medium text-muted-foreground">Start date</p>
              <DatePicker
                inline
                value={dateFrom}
                onChange={(v) => onChange({ dateFrom: v || undefined, dateTo })}
                maxDate={toDateVal}
              />
            </div>
            <div className="hidden w-px self-stretch bg-border/60 sm:block" />
            <div className="space-y-2">
              <p className="text-center text-xs font-medium text-muted-foreground">End date</p>
              <DatePicker
                inline
                value={dateTo}
                onChange={(v) => onChange({ dateFrom, dateTo: v || undefined })}
                minDate={fromDate}
              />
            </div>
          </div>
          {hasRange && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 h-8 w-full gap-1.5 text-muted-foreground"
              onClick={() => onChange({ dateFrom: undefined, dateTo: undefined })}
            >
              <X className="h-3.5 w-3.5" />
              Clear range
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
