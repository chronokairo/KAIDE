'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CompanyMonitorPort, CompanyStateSnapshot } from '@/application/ports/company-control-plane-port';
import type { AgentEntity, JobEntity } from '@/domain/company';

export function useCompanyMonitor(port: CompanyMonitorPort) {
  const [snapshot, setSnapshot] = useState<CompanyStateSnapshot | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => port.subscribe((next) => {
    setSnapshot(next);
    setError(null);
    setUpdatedAt(new Date());
  }, (failure) => setError(failure.message)), [port]);

  const selectedAgent = snapshot?.agents.find((agent) => agent.id === agentId) ?? null;
  const selectedJob = snapshot?.jobs.find((job) => job.id === jobId) ?? null;
  const setSelectedAgent = useCallback((agent: AgentEntity | null) => {
    setAgentId(agent?.id ?? null);
    setJobId(null);
  }, []);
  const setSelectedJob = useCallback((job: JobEntity | null) => setJobId(job?.id ?? null), []);
  const approveGate = useCallback((id: string, rationale?: string) => port.approveJob(id, rationale), [port]);
  const rejectGate = useCallback((id: string, reason: string) => port.rejectJob(id, reason), [port]);
  const dispatchJob = useCallback(async (jobName: string) => {
    if (!port.dispatchJob) {
      throw new Error('Este adaptador não suporta disparo de jobs.');
    }
    const job = await port.dispatchJob(jobName);
    setError(null);
    return job;
  }, [port]);

  return {
    agents: snapshot?.agents ?? [],
    jobs: snapshot?.jobs ?? [],
    telemetry: snapshot?.telemetry ?? null,
    isLoading: !snapshot && !error,
    error,
    updatedAt,
    selectedAgent,
    setSelectedAgent,
    selectedJob,
    setSelectedJob,
    approveGate,
    rejectGate,
    dispatchJob,
  };
}
