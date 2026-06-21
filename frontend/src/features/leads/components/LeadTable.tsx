'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Target } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { EmptyState } from '@/components/common/EmptyState';
import { useLeadList } from '../hooks/useLeads';
import { getLeadColumns } from './columns';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS, LEAD_STATUSES, LEAD_PRIORITIES, LEAD_CATEGORIES } from '@/lib/constants';
import { downloadCSV, formatDate, formatLeadPriority, formatLeadStatus, formatLeadCategoryShort } from '@/lib/utils';
import { Lead } from '../types/lead.types';

interface LeadTableProps {
  onCreateLead?: () => void;
}

export function LeadTable({ onCreateLead }: LeadTableProps) {
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const { leads, totalCount, pageCount, isLoading, params, updateParams, refetch } = useLeadList();
  const [searchInput, setSearchInput] = useState(params.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    const nextSearch = debouncedSearch || undefined;
    if (nextSearch === (params.search || undefined)) return;
    updateParams({ search: nextSearch, page: 1 });
  }, [debouncedSearch, params.search, updateParams]);

  const canEdit = isReady && hasPermission(PERMISSIONS.LEAD_UPDATE);
  const canCreate = isReady && hasPermission(PERMISSIONS.LEAD_CREATE);
  const canFollowUp = isReady && hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE);

  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Customer', 'Mobile', 'Category', 'Priority', 'Status', 'Next Follow-up', 'Assignment', 'Last Discussed'];
    const rows = leads.map((l: Lead) => {
      return [
        l.leadId,
        l.customerName,
        l.mobile,
        formatLeadCategoryShort(l.category),
        formatLeadPriority(l.priority),
        formatLeadStatus(l.status),
        formatDate(l.nextFollowUpDate),
        l.assignedTo?.name || 'Unassigned',
        l.lastFollowUpRemark || '',
      ];
    });
    downloadCSV([headers, ...rows].map((r) => r.join(',')).join('\n'), `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const columns = getLeadColumns({
    canEdit,
    canFollowUp,
    canViewAllLeads: canViewAllLeads(),
    onRefresh: refetch,
  });

  const toolbar = (
    <>
      <div className="relative min-w-[200px] flex-1 sm:max-w-[240px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, mobile, email, ID..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="crm-toolbar-input pl-9 text-sm"
        />
      </div>
      <Select value={params.status || 'all'} onValueChange={(v) => updateParams({ status: v === 'all' ? undefined : v, page: 1 })}>
        <SelectTrigger className="crm-select-trigger w-[132px] cursor-pointer text-sm">
          <Filter className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.priority || 'all'} onValueChange={(v) => updateParams({ priority: v === 'all' ? undefined : v, page: 1 })}>
        <SelectTrigger className="crm-select-trigger w-[128px] cursor-pointer text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          {LEAD_PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.category || 'all'} onValueChange={(v) => updateParams({ category: v === 'all' ? undefined : v, page: 1 })}>
        <SelectTrigger className="crm-select-trigger w-[136px] cursor-pointer text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {LEAD_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DateRangePicker
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
        onChange={(range) => updateParams({ ...range, page: 1 })}
        className="w-[148px]"
      />
    </>
  );

  const toolbarActions = (
    <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 cursor-pointer gap-1.5 rounded-lg border-border/80 px-3">
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );

  return (
    <DataTable
      columns={columns}
      data={leads}
      totalCount={totalCount}
      pageIndex={(params.page ?? 1) - 1}
      pageSize={params.limit ?? 10}
      pageCount={pageCount}
      onPageChange={(p) => updateParams({ page: p + 1 })}
      onPageSizeChange={(s) => updateParams({ limit: s, page: 1 })}
      onSortChange={(sortBy, sortOrder) => updateParams({ sortBy, sortOrder, page: 1 })}
      isLoading={isLoading}
      toolbar={toolbar}
      toolbarActions={toolbarActions}
      emptyState={
        <EmptyState
          icon={Target}
          title="No leads found"
          description={
            params.search
              ? `No results for "${params.search}".`
              : canViewAllLeads()
                ? 'No leads have been created yet.'
                : 'No leads are currently assigned to you.'
          }
        >
          {canCreate && !params.search && onCreateLead && (
            <Button size="sm" className="crm-btn-primary gap-1.5 rounded-lg" onClick={onCreateLead}>
              <Plus className="h-3.5 w-3.5" />
              Create First Lead
            </Button>
          )}
        </EmptyState>
      }
    />
  );
}
