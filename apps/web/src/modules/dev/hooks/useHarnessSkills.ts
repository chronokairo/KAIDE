"use client";

import { useCallback } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessSkills(workspace?: string) {
  return useHarnessQuery(useCallback(() => harnessClient.skills(workspace), [workspace]));
}
