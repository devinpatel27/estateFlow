'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function CreateLeadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.LEADS);
  }, [router]);

  return null;
}
