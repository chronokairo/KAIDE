'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompanyControlPlanePort, CompanyStateSnapshot } from '@/application/ports/company-control-plane-port';
import { httpCompanyMonitor } from '@/infrastructure/control-plane/http-company-monitor-adapter';
import { AgentEntity, JobEntity, CompanyTelemetry } from '@/domain/company';

export function useCompanyMonitor(port: CompanyControlPlanePort = httpCompanyMonitor) {
  const [snapshot, setSnapshot] = useState<CompanyStateSnapshot | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentEntity | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobEntity | null>(null);

  useEffect(() => {
    const unsubscribe = port.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      // Keep selected agent fresh if it updates
      if (selectedAgent) {
        const updated = nextSnapshot.agents.find((a) => a.id === selectedAgent.id);
        if (updated) setSelectedAgent(updated);
      }
    });
    return unsubscribe;
  }, [port, selectedAgent]);

  const approveGate = useCallback(
    async (approvalId: string, rationale?: string) => {
      await port.approveJob(approvalId, rationale);
    },
    [port]
  );

  const rejectGate = useCallback(
    async (approvalId: string, reason: string) => {
      await port.rejectJob(approvalId, reason);
    },
    [port]
  );

  return {
    agents: snapshot?.agents ?? [],
    jobs: snapshot?.jobs ?? [],
    telemetry: snapshot?.telemetry ?? {
      totalJobsCompleted: 0,
      totalCostUsd: 0,
      activeAgentsCount: 0,
      pendingApprovalsCount: 0,
      averageCycleTimeMinutes: 0,
      handoffsInFlight: 0,
    },
    selectedAgent,
    setSelectedAgent,
    selectedJob,
    setSelectedJob,
    approveGate,
    rejectGate,
  };
}
