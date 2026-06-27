'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Star } from 'lucide-react';
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
import { FilterTabs } from '@/components/common/FilterTabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useVisitList } from '../hooks/useVisits';
import { getVisitColumns, visitRowClassName } from './columns';
import { VisitDetailDrawer } from './VisitDetailDrawer';
import { CreateVisitDialog } from './CreateVisitDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS, VISIT_TYPES, VISIT_STATUSES } from '@/lib/constants';
import { Visit } from '../types/visit.types';

export function VisitTable() {
  const { hasPermission, isReady } = usePermissions();
  const canViewAllVisits = isReady && hasPermission(PERMISSIONS.VISIT_READ);
  const { visits, totalCount, pageCount, isLoading, params, updateParams, refetch, patchVisit, toggleFavoriteOptimistic } = useVisitList();
  const [searchInput, setSearchInput] = useState(params.search || '');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);

  const canCreate = isReady && hasPermission(PERMISSIONS.VISIT_CREATE);
  const canUpdate = isReady && hasPermission(PERMISSIONS.VISIT_UPDATE);
  const canFavorite = isReady && hasPermission(PERMISSIONS.VISIT_FAVORITE);

  useEffect(() => {
    const nextSearch = debouncedSearch || undefined;
    if (nextSearch === (params.search || undefined)) return;
    updateParams({ search: nextSearch, page: 1 });
  }, [debouncedSearch, params.search, updateParams]);

  const handleToggleFavorite = async (visit: Visit) => {
    await toggleFavoriteOptimistic(visit);
    if (selectedVisit?._id === visit._id) {
      setSelectedVisit({ ...visit, isFavorite: !visit.isFavorite });
    }
  };

  const columns = getVisitColumns({
    canFavorite,
    onToggleFavorite: handleToggleFavorite,
    onView: (visit) => {
      setSelectedVisit(visit);
      setDetailOpen(true);
    },
  });

  const toolbar = (
    <div className="w-full min-w-0 space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(180px,1fr)_auto_auto_auto] md:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, mobile, lead ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="crm-toolbar-input w-full pl-9 text-sm"
          />
        </div>
        <Select
          value={params.type || 'all'}
          onValueChange={(v) => updateParams({ type: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full text-sm md:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VISIT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.status || 'all'}
          onValueChange={(v) => updateParams({ status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="crm-select-trigger w-full text-sm md:w-[132px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {VISIT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canFavorite && (
          <FilterTabs
            aria-label="Favorite filter"
            value={params.favorite === true ? 'true' : params.favorite === false ? 'false' : 'all'}
            onChange={(v) =>
              updateParams({
                favorite: v === 'true' ? true : v === 'false' ? false : undefined,
                page: 1,
              })
            }
            options={[
              { value: 'all', label: 'All' },
              { value: 'true', label: 'Favorites', icon: <Star className="h-3 w-3" /> },
              { value: 'false', label: 'Non-favorites' },
            ]}
          />
        )}
      </div>
      <DateRangePicker
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
        onChange={(range) => updateParams({ ...range, page: 1 })}
        className="w-full sm:w-auto"
      />
    </div>
  );

  const toolbarActions = canCreate ? (
    <Button
      size="sm"
      className="crm-btn-primary h-9 gap-1.5 rounded-lg px-3"
      onClick={() => setCreateOpen(true)}
    >
      <Plus className="h-3.5 w-3.5" />
      Schedule Visit
    </Button>
  ) : null;

  return (
    <>
      <DataTable
        columns={columns}
        data={visits}
        totalCount={totalCount}
        pageIndex={(params.page ?? 1) - 1}
        pageSize={params.limit ?? 10}
        pageCount={pageCount}
        onPageChange={(p) => updateParams({ page: p + 1 })}
        onPageSizeChange={(s) => updateParams({ limit: s, page: 1 })}
        isLoading={isLoading}
        toolbar={toolbar}
        toolbarActions={toolbarActions}
        getRowClassName={visitRowClassName}
        emptyState={
          <EmptyState
            icon={MapPin}
            title="No visits found"
            description={
              canViewAllVisits
                ? 'Schedule a visit or add a visit-type follow-up on a lead.'
                : 'No visits for your assigned leads yet.'
            }
          />
        }
      />

      <VisitDetailDrawer
        visit={selectedVisit}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefresh={refetch}
        onFavoriteToggle={(visitId, isFavorite) => {
          patchVisit(visitId, { isFavorite });
          if (selectedVisit?._id === visitId) {
            setSelectedVisit((prev) => (prev ? { ...prev, isFavorite } : prev));
          }
        }}
        canUpdate={canUpdate}
        canFavorite={canFavorite}
      />

      <CreateVisitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />
    </>
  );
}
