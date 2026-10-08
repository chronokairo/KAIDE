'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GitHubNotificationItem, NotificationFilterState } from '../../../domain/entities/notification.entity';
import { INotificationUseCase, BatchTriageSummary } from '../../../domain/ports/primary/contracts';
import { LocalStorageNotificationRepository } from '../../secondary/repositories/LocalStorageNotificationRepository';
import { FetchGitHubApiClient } from '../../secondary/github-api/FetchGitHubApiClient';
import { RulesWorkflowDiagnosticEngine } from '../../secondary/diagnostics/RulesWorkflowDiagnosticEngine';
import { NotificationUseCases } from '../../../application/use-cases/NotificationUseCases';

// Composition root / Factory for Notification UseCase
function createNotificationUseCase(): INotificationUseCase {
  const diagnosticEngine = new RulesWorkflowDiagnosticEngine();
  const repository = new LocalStorageNotificationRepository();
  const apiClient = new FetchGitHubApiClient(diagnosticEngine);
  return new NotificationUseCases(repository, apiClient, diagnosticEngine);
}

const defaultUseCase = createNotificationUseCase();

export function useGitHubNotifications(useCase: INotificationUseCase = defaultUseCase) {
  const [notifications, setNotifications] = useState<GitHubNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [filters, setFilters] = useState<NotificationFilterState>({
    search: '',
    repo: 'all',
    status: 'all',
    reason: 'all',
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await useCase.getNotifications();
      setNotifications(list);
      setGithubToken(useCase.getSavedToken());
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredNotifications = useMemo(() => {
    return useCase.filterNotifications({ notifications, filters });
  }, [useCase, notifications, filters]);

  const availableRepos = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((n) => set.add(n.repo));
    return Array.from(set).sort();
  }, [notifications]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const failed = notifications.filter((n) => n.status === 'failed').length;
    const unread = notifications.filter((n) => n.unread).length;
    const repos = availableRepos.length;
    return { total, failed, unread, repos };
  }, [notifications, availableRepos]);

  const toggleUnread = useCallback(
    async (id: string) => {
      const updated = await useCase.toggleUnread({ id });
      setNotifications(updated);
    },
    [useCase]
  );

  const markAllRead = useCallback(async () => {
    const updated = await useCase.markAllAsRead();
    setNotifications(updated);
  }, [useCase]);

  const resetToInitial = useCallback(async () => {
    const initial = await useCase.resetToInitial();
    setNotifications(initial);
  }, [useCase]);

  const importRawText = useCallback(
    async (rawText: string) => {
      const res = await useCase.importRawText({ rawText });
      if (res.count > 0) {
        const fresh = await useCase.getNotifications();
        setNotifications(fresh);
      }
      return res;
    },
    [useCase]
  );

  const syncWithApi = useCallback(
    async (token: string) => {
      setSyncLoading(true);
      setSyncError(null);
      try {
        const res = await useCase.syncWithGitHubApi({ token });
        if (res.syncedCount > 0) {
          const fresh = await useCase.getNotifications();
          setNotifications(fresh);
        }
        setGithubToken(token);
        return res;
      } catch (err: any) {
        const msg = err.message || 'Erro ao sincronizar com GitHub';
        setSyncError(msg);
        throw err;
      } finally {
        setSyncLoading(false);
      }
    },
    [useCase]
  );

  const generateAiFixPrompt = useCallback(
    (notification: GitHubNotificationItem) => {
      return useCase.generateAiFixPrompt({ notification });
    },
    [useCase]
  );

  const getBatchTriageSummary = useCallback((): BatchTriageSummary => {
    return useCase.generateBatchTriageSummary(notifications);
  }, [useCase, notifications]);

  return {
    notifications,
    filteredNotifications,
    availableRepos,
    stats,
    filters,
    setFilters,
    loading,
    syncLoading,
    syncError,
    githubToken,
    toggleUnread,
    markAllRead,
    resetToInitial,
    importRawText,
    syncWithApi,
    generateAiFixPrompt,
    getBatchTriageSummary,
    refresh,
  };
}
