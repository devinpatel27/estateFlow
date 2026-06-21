'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { PropertyDashboard } from './PropertyDashboard';
import { getPropertyColumns } from './columns';
import { propertyService } from '../services/property.service';
import { Property, PropertyDashboardStats } from '../types/property.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS, PROPERTY_PURPOSES, PROPERTY_STATUSES } from '@/lib/constants';

export function PropertyTable() {
  const router = useRouter();
  const { hasPermission, isReady } = usePermissions();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyDashboardStats>();
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    purpose: '',
    status: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const canEdit = isReady && hasPermission(PERMISSIONS.PROPERTY_UPDATE);
  const canDelete = isReady && hasPermission(PERMISSIONS.PROPERTY_DELETE);
  const canPublish = isReady && hasPermission(PERMISSIONS.PROPERTY_PUBLISH);
  const canCreate = isReady && hasPermission(PERMISSIONS.PROPERTY_CREATE);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [listRes, dashRes] = await Promise.all([
        propertyService.list({
          page: params.page,
          limit: params.limit,
          search: params.search || undefined,
          purpose: (params.purpose as Property['purpose']) || undefined,
          status: (params.status as Property['status']) || undefined,
        }),
        propertyService.getDashboard(),
      ]);
      if (listRes.success) {
        setProperties(listRes.data || []);
        setTotalCount(listRes.pagination?.total || 0);
        setPageCount(listRes.pagination?.totalPages || 1);
      }
      if (dashRes.success) setStats(dashRes.data);
    } catch {
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.page, params.limit, params.search, params.purpose, params.status]);

  useEffect(() => {
    setParams((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await propertyService.delete(deleteTarget._id);
      toast.success('Property deleted');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Failed to delete property');
    }
  };

  const handleTogglePublish = async (property: Property) => {
    try {
      await propertyService.togglePublish(property._id);
      toast.success(property.publishOnWebsite ? 'Unpublished' : 'Published');
      fetchData();
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleToggleFeature = async (property: Property) => {
    try {
      await propertyService.toggleFeature(property._id);
      toast.success(property.isFeatured ? 'Removed from featured' : 'Marked as featured');
      fetchData();
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  const columns = getPropertyColumns({
    canEdit,
    canDelete,
    canPublish,
    onRefresh: fetchData,
    onDelete: setDeleteTarget,
    onTogglePublish: handleTogglePublish,
    onToggleFeature: handleToggleFeature,
  });

  return (
    <>
      <PropertyDashboard stats={stats} isLoading={isLoading && !stats} />
      <DataTable
        columns={columns}
        data={properties}
        isLoading={isLoading}
        pageCount={pageCount}
        totalCount={totalCount}
        pageIndex={params.page - 1}
        onPageChange={(page) => setParams((prev) => ({ ...prev, page: page + 1 }))}
        toolbar={
          <>
            <div className="relative min-w-[200px] flex-1 sm:max-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="crm-toolbar-input pl-9 text-sm"
              />
            </div>
            <Select
              value={params.purpose || 'all'}
              onValueChange={(v) =>
                setParams((prev) => ({ ...prev, purpose: v === 'all' ? '' : v, page: 1 }))
              }
            >
              <SelectTrigger className="crm-select-trigger w-[120px] text-sm">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose</SelectItem>
                {PROPERTY_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.status || 'all'}
              onValueChange={(v) =>
                setParams((prev) => ({ ...prev, status: v === 'all' ? '' : v, page: 1 }))
              }
            >
              <SelectTrigger className="crm-select-trigger w-[130px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {PROPERTY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreate && (
              <Button
                className="crm-btn-primary gap-2 rounded-xl"
                onClick={() => router.push('/properties/new')}
              >
                <Plus className="h-4 w-4" /> Add Property
              </Button>
            )}
          </>
        }
        emptyState={
          <EmptyState
            icon={Search}
            title="No properties found"
            description="Create your first property listing to get started."
          >
            {canCreate && (
              <Button className="crm-btn-primary mt-4" onClick={() => router.push('/properties/new')}>
                Add Property
              </Button>
            )}
          </EmptyState>
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Property"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
