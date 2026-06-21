'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LeadTable } from '@/features/leads/components/LeadTable';
import { AddLeadDialog } from '@/features/leads/components/AddLeadDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

export default function LeadsPage() {
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const canCreate = isReady && hasPermission(PERMISSIONS.LEAD_CREATE);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={
          isReady && !canViewAllLeads()
            ? 'View and manage leads assigned to you.'
            : 'Manage property leads and track follow-ups.'
        }
      >
        {canCreate && (
          <Button
            className="crm-btn-primary gap-2 rounded-xl px-5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </PageHeader>
      <LeadTable
        key={refreshKey}
        onCreateLead={canCreate ? () => setCreateOpen(true) : undefined}
      />
      <AddLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((value) => value + 1)}
      />
    </div>
  );
}
