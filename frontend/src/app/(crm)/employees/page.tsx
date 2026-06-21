'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmployeeTable } from '@/features/employees/components/EmployeeTable';
import { AddEmployeeDialog } from '@/features/employees/components/AddEmployeeDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

export default function EmployeesPage() {
  const { hasPermission, isReady } = usePermissions();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your team members and their access."
      >
        {isReady && hasPermission(PERMISSIONS.EMPLOYEE_CREATE) && (
          <Button
            className="crm-btn-primary gap-2 rounded-xl px-5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </PageHeader>

      <EmployeeTable key={refreshKey} onAddClick={() => setAddOpen(true)} />

      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
