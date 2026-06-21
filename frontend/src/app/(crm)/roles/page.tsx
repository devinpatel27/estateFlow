'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { RolesTable } from '@/features/roles/components/RolesTable';
import { AddRoleDialog } from '@/features/roles/components/AddRoleDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

export default function RolesPage() {
  const { hasPermission, isReady } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <PermissionGuard permission={PERMISSIONS.ROLE_READ} redirectTo="/dashboard">
      <div>
        <PageHeader
          title="Roles & Permissions"
          description="Define roles and control what each role can access in the system."
        >
          {isReady && hasPermission(PERMISSIONS.ROLE_CREATE) && (
            <Button className="crm-btn-primary gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Role
            </Button>
          )}
        </PageHeader>
        <RolesTable key={refreshKey} />
        <AddRoleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => setRefreshKey((value) => value + 1)}
        />
      </div>
    </PermissionGuard>
  );
}
