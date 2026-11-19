'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@scottcheung/ui/client';

/** Client-only providers for the manager (toasts need React state). */
export function ManagerProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
