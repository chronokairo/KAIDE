"use client";

import { useCallback } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessNodeIdentity() {
  return useHarnessQuery(useCallback(() => harnessClient.nodeIdentity(), []));
}

export function useHarnessSyncStatus() {
  return useHarnessQuery(useCallback(() => harnessClient.syncStatus(), []));
}

export function useHarnessQuorum() {
  return useHarnessQuery(useCallback(() => harnessClient.quorum(), []));
}

export function useHarnessQuorumOpenCount() {
  return useHarnessQuery(useCallback(() => harnessClient.quorumOpenCount(), []));
}

export function useOfflineMutationQueue(tenantId: string) {
  const query = useHarnessQuery(
    useCallback(() => (tenantId ? harnessClient.getPendingOfflineMutations(tenantId) : Promise.resolve({ data: [], available: false })), [tenantId])
  );

  const enqueue = useCallback(
    async (mutation: import('@/modules/dev/harness-client').OfflineMutation) => {
      const res = await harnessClient.enqueueOfflineMutation(mutation);
      query.refresh();
      return res;
    },
    [query]
  );

  const updateStatus = useCallback(
    async (id: string, status: string, error?: string) => {
      const res = await harnessClient.updateOfflineMutationStatus(id, status, error);
      query.refresh();
      return res;
    },
    [query]
  );

  return {
    ...query,
    enqueue,
    updateStatus,
  };
}

export function useCachedErpEntities(tenantId: string, entityType: string) {
  const query = useHarnessQuery(
    useCallback(
      () =>
        tenantId && entityType
          ? harnessClient.getCachedErpEntities(tenantId, entityType)
          : Promise.resolve({ data: [], available: false }),
      [tenantId, entityType]
    )
  );

  const cacheEntities = useCallback(
    async (entities: import('@/modules/dev/harness-client').CachedEntity[]) => {
      const res = await harnessClient.cacheErpEntities(entities);
      query.refresh();
      return res;
    },
    [query]
  );

  return {
    ...query,
    cacheEntities,
  };
}
