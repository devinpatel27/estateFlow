'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/leads/${id}`);
  }, [id, router]);

  return null;
}
