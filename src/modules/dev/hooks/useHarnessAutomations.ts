"use client";

import { useCallback, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessAutomations(workspace?: string) {
  return useHarnessQuery(useCallback(() => harnessClient.automations(workspace), [workspace]));
}
