'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, Download, Target, X } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LeadListToolbar } from './LeadListToolbar';
import { useLeadList } from '../hooks/useLeads';
import { getLeadColumns } from './columns';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/lib/constants';
import { downloadCSV, formatDate, formatLeadPriority, formatLeadStatus, formatLeadCategoryShort } from '@/lib/utils';
import { Lead, LeadListParams } from '../types/lead.types';

interface LeadTableProps {
  onCreateLead?: () => void;
}

function buildLeadQueryString(params: Pick<LeadListParams, 'followUpDue' | 'status' | 'priority'>) {
  const q = new URLSearchParams();
  if (params.followUpDue) q.set('followUpDue', params.followUpDue);
  if (params.status) q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  return q.toString();
}

export function LeadTable({ onCreateLead }: LeadTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const initialFollowUpDue = searchParams.get('followUpDue') as 'today' | 'tomorrow' | 'overdue' | null;
  const initialStatus = searchParams.get('status') || undefined;
  const initialPriority = searchParams.get('priority') || undefined;
  const { leads, totalCount, pageCount, isLoading, params, updateParams, refetch } = useLeadList({
    followUpDue: initialFollowUpDue || undefined,
    status: initialStatus,
    priority: initialPriority,
  });
  const [searchInput, setSearchInput] = useState(params.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const syncUrl = useCallback(
    (next: Pick<LeadListParams, 'followUpDue' | 'status' | 'priority'>) => {
      const qs = buildLeadQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const applyFilters = useCallback(
    (updates: Partial<LeadListParams>) => {
      updateParams(updates);
      const next = {
        followUpDue: updates.followUpDue !== undefined ? updates.followUpDue : params.followUpDue,
        status: updates.status !== undefined ? updates.status : params.status,
        priority: updates.priority !== undefined ? updates.priority : params.priority,
      };
      if (
        updates.followUpDue !== undefined ||
        updates.status !== undefined ||
        updates.priority !== undefined
      ) {
        syncUrl(next);
      }
    },
    [updateParams, params.followUpDue, params.status, params.priority, syncUrl]
  );

  useEffect(() => {
    const followUpDue = searchParams.get('followUpDue') as 'today' | 'tomorrow' | 'overdue' | null;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;

    updateParams({
      followUpDue: followUpDue || undefined,
      status,
      priority,
      page: 1,
    });
  }, [searchParams, updateParams]);

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

  const clearFilters = () => {
    updateParams({
      followUpDue: undefined,
      status: undefined,
      priority: undefined,
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    });
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilter = Boolean(
    params.followUpDue ||
    params.status ||
    params.priority ||
    params.category ||
    params.dateFrom ||
    params.dateTo
  );

  const columns = getLeadColumns({
    canEdit,
    canFollowUp,
    canViewAllLeads: canViewAllLeads(),
    onRefresh: refetch,
  });

  const toolbar = (
    <LeadListToolbar
      params={params}
      searchInput={searchInput}
      onSearchChange={setSearchInput}
      onParamsChange={applyFilters}
    />
  );

  const toolbarActions = (
    <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 cursor-pointer gap-1.5 rounded-lg border-border/80 px-3">
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );

  return (
    <div className="space-y-3">
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active filters</span>
          {params.status && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Status: {formatLeadStatus(params.status)}
            </Badge>
          )}
          {params.priority && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Priority: {formatLeadPriority(params.priority)}
            </Badge>
          )}
          {params.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {formatLeadCategoryShort(params.category)}
            </Badge>
          )}
          {params.followUpDue && (
            <Badge variant="secondary" className="gap-1 capitalize">
              Schedule: {params.followUpDue === 'overdue' ? 'Due' : params.followUpDue}
            </Badge>
          )}
          {(params.dateFrom || params.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Created: {params.dateFrom ? formatDate(params.dateFrom) : '…'} → {params.dateTo ? formatDate(params.dateTo) : '…'}
            </Badge>
          )}
          <Badge variant="outline" className="tabular-nums">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 text-xs"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}

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
                : hasActiveFilter
                  ? 'No leads match the selected filters.'
                  : canViewAllLeads()
                    ? 'No leads have been created yet.'
                    : 'No leads are currently assigned to you.'
            }
          >
            {canCreate && !params.search && !hasActiveFilter && onCreateLead && (
              <Button size="sm" className="crm-btn-primary gap-1.5 rounded-lg" onClick={onCreateLead}>
                <Plus className="h-3.5 w-3.5" />
                Create First Lead
              </Button>
            )}
          </EmptyState>
        }
      />
    </div>
  );
}
