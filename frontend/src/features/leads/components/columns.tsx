'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../types/lead.types';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { NextFollowUpCell } from './NextFollowUpCell';
import { LeadRowActions } from './LeadRowActions';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ColumnActions {
  canEdit: boolean;
  canFollowUp: boolean;
  canViewAllLeads: boolean;
  onRefresh?: () => void;
}

function getMasterName(item: Lead['propertyType']): string {
  if (!item) return '—';
  return typeof item === 'string' ? item : item.name;
}

function LastDiscussedCell({ lead }: { lead: Lead }) {
  const remark = lead.lastFollowUpRemark;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0 max-w-[340px] py-0.5">
      <div className="flex items-center gap-2">
        <NextFollowUpCell date={lead.nextFollowUpDate} />
      </div>
      {remark ? (
        <div className="flex items-start gap-1.5 group min-w-0">
          <div
            className="flex-1 min-w-0 rounded-md border-l-2 border-primary/40 bg-muted/40 hover:bg-muted/70 px-2.5 py-1.5 cursor-pointer transition-colors"
            title="Click to view full remark"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <p className="text-xs text-foreground/90 font-normal leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] line-clamp-3">
              {remark}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="shrink-0 text-muted-foreground/50 hover:text-primary p-1 rounded transition-colors mt-0.5 cursor-pointer"
            title="Open in modal"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">No remark yet</span>
      )}

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Latest Follow-Up Discussion
              </DialogTitle>
              <DialogDescription className="text-xs">
                {lead.customerName} ({lead.leadId})
              </DialogDescription>
            </DialogHeader>
            <div className="my-2 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-h-[300px] overflow-y-auto">
              {remark}
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function getLeadColumns(actions: ColumnActions): ColumnDef<Lead>[] {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'leadId',
      header: 'Lead / Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-mono font-semibold text-foreground">{row.original.leadId}</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
        </div>
      ),
      size: 110,
      minSize: 110,
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 cursor-pointer text-xs font-semibold"
          onClick={(event) => {
            event.stopPropagation();
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Customer
          <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="min-w-0 pr-1">
            <p className="text-sm font-semibold text-foreground truncate">{lead.customerName || '—'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{lead.mobile}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(lead.mobile);
                  toast.success(`Copied: ${lead.mobile}`);
                }}
                className="p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy mobile number"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      },
      minSize: 150,
      size: 160,
    },
    {
      id: 'propertyType',
      header: 'Property Type',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium capitalize">{getMasterName(row.original.propertyType)}</span>
          {row.original.propertyConfiguration && (
            <span className="text-[11px] text-muted-foreground">{row.original.propertyConfiguration}</span>
          )}
        </div>
      ),
      size: 120,
      minSize: 110,
    },
    {
      id: 'priorityAndStatus',
      header: 'Priority & Status',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <LeadPriorityBadge priority={row.original.priority} />
          <LeadStatusBadge status={row.original.status} />
        </div>
      ),
      size: 130,
      minSize: 120,
    },
    {
      id: 'nextFollowUpAndRemark',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">NFD & Last Discussed</span>,
      cell: ({ row }) => <LastDiscussedCell lead={row.original} />,
      minSize: 260,
      size: 340,
      maxSize: 380,
    },
    {
      id: 'assignment',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">Assignment</span>,
      cell: ({ row }) => {
        const assignee = row.original.assignedTo;
        if (!assignee) {
          return (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              Unassigned
            </span>
          );
        }
        return (
          <div className="min-w-0 pr-1">
            <p className="text-xs font-semibold text-foreground whitespace-nowrap truncate">{assignee.name}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">
              {row.original.assignedAt ? formatDateTime(row.original.assignedAt) : assignee.employeeId || '—'}
            </p>
          </div>
        );
      },
      size: 160,
      minSize: 150,
    },
    {
      id: 'actions',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-right block w-full pr-2">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end w-full pr-1">
          <LeadRowActions
            lead={row.original}
            canEdit={actions.canEdit}
            canFollowUp={actions.canFollowUp}
            onRefresh={actions.onRefresh}
          />
        </div>
      ),
      size: 185,
      minSize: 185,
      enableHiding: false,
    },
  ];

  if (!actions.canViewAllLeads) {
    return columns.filter((column) => column.id !== 'assignment');
  }

  return columns;
}
