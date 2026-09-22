"use client";

import { useMemo } from 'react';
import { isTauriRuntime } from '@/modules/dev/harness-client';

export function useIsTauri() {
  return useMemo(() => isTauriRuntime(), []);
}
