'use client';

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { FilterTabs } from '@/components/common/FilterTabs';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { LEAD_STATUSES, LEAD_PRIORITIES, LEAD_CATEGORIES } from '@/lib/constants';
import { formatLeadStatus, formatLeadPriority, formatLeadCategoryShort } from '@/lib/utils';
import { LeadListParams } from '../types/lead.types';

const FOLLOW_UP_DUE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'today' as const, label: 'Today' },
  { value: 'tomorrow' as const, label: 'Tomorrow' },
  { value: 'overdue' as const, label: 'Due' },
];

interface LeadListToolbarProps {
  params: LeadListParams;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onParamsChange: (updates: Partial<LeadListParams>) => void;
}

export function LeadListToolbar({
  params,
  searchInput,
  onSearchChange,
  onParamsChange,
}: LeadListToolbarProps) {
  const statusLabel = params.status
    ? formatLeadStatus(params.status)
    : 'All Status';
  const priorityLabel = params.priority
    ? formatLeadPriority(params.priority)
    : 'All Priority';
  const categoryLabel = params.category
    ? formatLeadCategoryShort(params.category)
    : 'All Categories';

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(180px,1fr)_auto_auto] md:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, mobile, email, ID..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="crm-toolbar-input w-full pl-9 text-sm"
          />
        </div>
        <FilterTabs
          aria-label="Follow-up due filter"
          value={params.followUpDue || 'all'}
          onChange={(v) =>
            onParamsChange({
              followUpDue: v === 'all' ? undefined : v,
              page: 1,
            })
          }
          options={FOLLOW_UP_DUE_OPTIONS}
        />
        <DateRangePicker
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          onChange={(range) => onParamsChange({ ...range, page: 1 })}
          className="w-full md:w-auto"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          value={params.status || 'all'}
          onValueChange={(v) => onParamsChange({ status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full cursor-pointer text-sm">
            <Filter className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{statusLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.priority || 'all'}
          onValueChange={(v) => onParamsChange({ priority: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full cursor-pointer text-sm">
            <span className="truncate">{priorityLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {LEAD_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.category || 'all'}
          onValueChange={(v) => onParamsChange({ category: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full cursor-pointer text-sm">
            <span className="truncate">{categoryLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {LEAD_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
