'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

/** Rehydrate persisted Zustand stores after mount to avoid SSR/client HTML mismatches. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void Promise.all([
      useAuthStore.persist.rehydrate(),
      useUIStore.persist.rehydrate(),
    ]).then(() => {
      useAuthStore.getState().setHydrated();
    });
  }, []);

  return children;
}
