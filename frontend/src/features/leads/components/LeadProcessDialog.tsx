'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, ExternalLink, Search, Target } from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/common/DatePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { FollowUpForm } from './FollowUpForm';
import { Lead, LeadActivity, LeadFollowUp } from '../types/lead.types';
import { leadService } from '../services/lead.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { formatDate, formatDateTime, formatLeadCategoryShort } from '@/lib/utils';
import { FollowUpFormValues } from '../schemas/lead.schema';
import { toast } from 'sonner';

interface LeadProcessDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

type ProcessRow = {
  id: string;
  kind: 'activity' | 'followup' | 'initial';
  date: string;
  type: string;
  remark?: string;
  nextFollowUp?: string;
  by?: string;
};

export function LeadProcessDialog({ lead, open, onOpenChange, onRefresh }: LeadProcessDialogProps) {
  const { hasPermission, isReady } = usePermissions();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [followUpOpen, setFollowUpOpen] = useState(false);

  const canFollowUp = isReady && hasPermission(PERMISSIONS.LEAD_FOLLOWUP_CREATE);

  useEffect(() => {
    if (!open || !lead?._id) return;
    setIsLoading(true);
    setSearch('');
    setFilterDate('');
    Promise.all([leadService.getActivities(lead._id), leadService.getFollowUps(lead._id)])
      .then(([act, fu]) => {
        if (act.success) setActivities(act.data || []);
        if (fu.success) setFollowUps(fu.data || []);
      })
      .catch((err: unknown) => {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 403) {
          toast.error('You no longer have access to this lead');
          onOpenChange(false);
          onRefresh?.();
          return;
        }
        toast.error('Failed to load lead progress');
      })
      .finally(() => setIsLoading(false));
  }, [open, lead?._id]);

  const rows = useMemo(() => {
    if (!lead) return [];
    const hasLeadCreatedActivity = activities.some((activity) => activity.type === 'LEAD_CREATED');
    const nonFollowUpActivities = activities.filter((a) => {
      if ((a as { metadata?: { followUpId?: string } }).metadata?.followUpId) return false;
      if (a.type === 'FOLLOW_UP_ADDED') return false;
      if (['CALL_DONE', 'REVISIT_COMPLETED', 'NEGOTIATION_STARTED'].includes(a.type)) return false;
      if (a.title?.startsWith('Follow-up:')) return false;
      return true;
    });

    const followUpItems = followUps.map((f) => {
      const parentName = typeof f.parentActivity === 'object' && f.parentActivity ? f.parentActivity.name : '';
      const childName = typeof f.childActivity === 'object' && f.childActivity ? f.childActivity.name : '';
      const activityLabel = childName || parentName || f.type.replace(/_/g, ' ');
      return {
        id: f._id,
        kind: 'followup' as const,
        date: f.createdAt || f.followUpDate,
        type: activityLabel,
        remark: f.remark,
        nextFollowUp: f.nextFollowUpDate,
        by: f.createdBy?.name,
      };
    });

    const items: ProcessRow[] = [
      ...(lead.initialRemark && !hasLeadCreatedActivity
        ? [{
            id: `${lead._id}-initial-remark`,
            kind: 'initial' as const,
            date: lead.createdAt,
            type: 'Lead Created',
            remark: lead.initialRemark,
            nextFollowUp: lead.nextFollowUpDate,
            by: lead.createdBy?.name,
          }]
        : []),
      ...nonFollowUpActivities.map((a) => ({
        id: a._id,
        kind: 'activity' as const,
        date: a.createdAt,
        type: a.title,
        remark: a.remark,
        by: a.performedBy?.name,
      })),
      ...followUpItems,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        [item.type, item.remark, item.by, item.nextFollowUp].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase())
        );
      const matchesDate = !filterDate || item.date.startsWith(filterDate);
      return matchesSearch && matchesDate;
    });
  }, [activities, followUps, search, filterDate, lead]);

  const handleFollowUp = async (data: FollowUpFormValues) => {
    if (!lead) return;
    try {
      await leadService.createFollowUp(lead._id, data);
      toast.success('Follow-up added');
      const [act, fu] = await Promise.all([
        leadService.getActivities(lead._id),
        leadService.getFollowUps(lead._id),
      ]);
      if (act.success) setActivities(act.data || []);
      if (fu.success) setFollowUps(fu.data || []);
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to add follow-up');
      throw err;
    }
  };

  if (!lead) return null;

  return (
    <>
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={lead.customerName}
        description={`Lead ${lead.leadId} · ${formatLeadCategoryShort(lead.category)} · ${lead.mobile}`}
        icon={Target}
        maxWidth="sm:max-w-4xl"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <LeadPriorityBadge priority={lead.priority} />
            <Badge variant="outline" className="text-[11px]">
              {formatLeadCategoryShort(lead.category)}
            </Badge>
            {lead.assignedTo && (
              <Badge variant="secondary" className="text-[11px]">
                {lead.assignedTo.name}
                {lead.assignedAt ? ` · ${formatDate(lead.assignedAt)}` : ''}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search remarks, type, user..."
                className="crm-toolbar-input h-9 pl-9 text-sm"
              />
            </div>
            <DatePicker
              value={filterDate}
              onChange={setFilterDate}
              placeholder="Filter date"
              compact
              className="w-[148px]"
            />
            {canFollowUp && (
              <Button
                size="sm"
                className="crm-btn-primary crm-btn-interactive h-9 gap-1.5 rounded-lg"
                onClick={() => setFollowUpOpen(true)}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Follow-Up
              </Button>
            )}
            <Button size="sm" variant="outline" className="crm-btn-interactive h-9 gap-1.5 rounded-lg" asChild>
              <Link href={`/leads/${lead._id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Full Page
              </Link>
            </Button>
          </div>

          <div className="crm-table-wrap min-h-[300px] flex-1 overflow-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-10 text-xs font-semibold uppercase">Date</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Type</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Remark / Discussion</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">Next Follow-up</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      {search || filterDate
                        ? 'No records match your filters.'
                        : 'No follow-ups or activities for your current assignment.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={`${row.kind}-${row.id}`} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap py-2.5 text-xs">
                        {formatDateTime(row.date)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={row.kind === 'followup' ? 'default' : 'secondary'}
                            className="text-[10px] capitalize"
                          >
                            {row.kind === 'followup' ? row.type : row.kind === 'initial' ? 'Initial' : 'Activity'}
                          </Badge>
                          {row.kind === 'activity' && (
                            <span className="max-w-[120px] truncate text-xs">{row.type}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[240px] py-2.5 text-xs">
                        <p className="line-clamp-2" title={row.remark}>
                          {row.remark || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-xs">
                        {row.nextFollowUp ? formatDate(row.nextFollowUp) : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                        {row.by || 'System'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Assigned</p>
              <p className="font-medium">{lead.assignedTo?.name || 'Unassigned'}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(lead.assignedAt)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Next Follow-up</p>
              <p className="font-medium">{formatDate(lead.nextFollowUpDate)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Follow-ups</p>
              <p className="font-medium">{followUps.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-muted-foreground">Activities</p>
              <p className="font-medium">{activities.length}</p>
            </div>
          </div>
        </div>
      </ModalShell>

      <FollowUpForm open={followUpOpen} onOpenChange={setFollowUpOpen} onSubmit={handleFollowUp} />
    </>
  );
}
