"use client";

import { useCallback } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessOverview() {
  return useHarnessQuery(useCallback(() => harnessClient.overview(), []));
}
