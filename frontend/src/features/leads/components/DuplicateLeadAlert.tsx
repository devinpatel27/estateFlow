'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lead } from '../types/lead.types';
import { ROUTES } from '@/lib/constants';

interface DuplicateLeadAlertProps {
  activeLead: Lead;
  onDismiss?: () => void;
}

export function DuplicateLeadAlert({ activeLead, onDismiss }: DuplicateLeadAlertProps) {
  return (
    <div className="crm-card flex gap-3 border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">Lead already exists</p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
          An active lead ({activeLead.leadId} — {activeLead.customerName}) already exists for this mobile number.
        </p>
        <div className="mt-3 flex gap-2">
          <Link href={ROUTES.LEAD_DETAIL(activeLead._id)}>
            <Button size="sm" variant="outline" className="rounded-lg">
              Open Existing Lead
            </Button>
          </Link>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss} className="rounded-lg">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
