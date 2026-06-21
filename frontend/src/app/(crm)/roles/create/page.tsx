'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function CreateRolePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.ROLES);
  }, [router]);

  return null;
}
