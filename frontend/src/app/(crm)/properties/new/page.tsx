'use client';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { PropertyForm } from '@/features/properties/components/PropertyForm';
import { PERMISSIONS } from '@/lib/constants';

export default function NewPropertyPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_CREATE} redirectTo="/properties">
      <PageHeader title="Add Property" description="Create a new property listing." />
      <PropertyForm />
    </PermissionGuard>
  );
}
