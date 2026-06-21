'use client';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { PropertyTable } from '@/features/properties/components/PropertyTable';
import { PERMISSIONS } from '@/lib/constants';

export default function PropertiesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_READ} redirectTo="/dashboard">
      <PageHeader
        title="Properties"
        description="Manage property listings, website visibility, and inquiries."
      />
      <PropertyTable />
    </PermissionGuard>
  );
}
