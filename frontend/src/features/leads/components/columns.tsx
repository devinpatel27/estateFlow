'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Lead } from '../types/lead.types';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { NextFollowUpCell } from './NextFollowUpCell';
import { LeadRowActions } from './LeadRowActions';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, formatLeadCategoryShort } from '@/lib/utils';

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

export function getLeadColumns(actions: ColumnActions): ColumnDef<Lead>[] {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'leadId',
      header: 'Lead ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-medium text-muted-foreground">{row.original.leadId}</span>
      ),
      size: 90,
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
          <div>
            <p className="text-sm font-medium">{lead.customerName || '—'}</p>
            <p className="text-xs text-muted-foreground">{lead.mobile}</p>
          </div>
        );
      },
      minSize: 160,
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-wide">
          {formatLeadCategoryShort(row.original.category)}
        </Badge>
      ),
      size: 72,
    },
    {
      id: 'propertyType',
      header: 'Property Type',
      cell: ({ row }) => <span className="text-xs capitalize">{getMasterName(row.original.propertyType)}</span>,
      size: 120,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <LeadPriorityBadge priority={row.original.priority} />,
      size: 90,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      size: 130,
    },
    {
      accessorKey: 'nextFollowUpDate',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">NFD</span>,
      cell: ({ row }) => <NextFollowUpCell date={row.original.nextFollowUpDate} />,
      size: 140,
    },
    {
      id: 'lastRemark',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">Last Discussed</span>,
      cell: ({ row }) => {
        const remark = row.original.lastFollowUpRemark;
        if (!remark) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <p className="max-w-[180px] truncate text-xs" title={remark}>
            {remark}
          </p>
        );
      },
      size: 180,
    },
    {
      id: 'assignment',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">Assignment</span>,
      cell: ({ row }) => {
        const assignee = row.original.assignedTo;
        if (!assignee) {
          return (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Unassigned
            </span>
          );
        }
        return (
          <div>
            <p className="text-xs font-medium">{assignee.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.assignedAt ? formatDateTime(row.original.assignedAt) : assignee.employeeId || '—'}
            </p>
          </div>
        );
      },
      size: 150,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <LeadRowActions
          lead={row.original}
          canEdit={actions.canEdit}
          canFollowUp={actions.canFollowUp}
          onRefresh={actions.onRefresh}
        />
      ),
      size: 180,
      enableHiding: false,
    },
  ];

  if (!actions.canViewAllLeads) {
    return columns.filter((column) => column.id !== 'assignment');
  }

  return columns;
}
