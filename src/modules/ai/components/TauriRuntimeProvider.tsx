'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { createTauriChatAdapter, type TauriChatAdapterOptions } from '@/modules/dev/harness/tauri-chat-adapter';
import { useHarnessMode } from '@/providers/HarnessModeProvider';
import type { ApprovalRequest } from '@/modules/dev/harness-client';

interface TauriRuntimeContextValue {
  approvalRequest: ApprovalRequest | null;
  resolveApproval: (decision: 'allow_once' | 'allow_session' | 'deny') => void;
  approve: () => void;
  deny: () => void;
}

export const TauriRuntimeContext = React.createContext<TauriRuntimeContextValue | null>(null);

export function useTauriRuntimeContext() {
  return React.useContext(TauriRuntimeContext);
}

interface Props {
  children: React.ReactNode;
  workspace?: string;
  model?: string;
}

export function TauriRuntimeProvider({ children, workspace, model }: Props) {
  const { isHarnessMode } = useHarnessMode();
  const pathname = usePathname();
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [approvalResolver, setApprovalResolver] = useState<((decision: 'allow_once' | 'allow_session' | 'deny') => void) | null>(null);

  const handleApproval = useCallback((request: ApprovalRequest) => {
    setApprovalRequest(request);
  }, []);

  const resolveApproval = useCallback((decision: 'allow_once' | 'allow_session' | 'deny') => {
    approvalResolver?.(decision);
    setApprovalRequest(null);
    setApprovalResolver(null);
  }, [approvalResolver]);

  const approve = useCallback(() => resolveApproval('allow_once'), [resolveApproval]);
  const deny = useCallback(() => resolveApproval('deny'), [resolveApproval]);

  const adapterOptions: TauriChatAdapterOptions = useMemo(() => ({
    workspace,
    model,
    onApproval: handleApproval,
  }), [workspace, model, handleApproval]);

  const adapter: ChatModelAdapter = useMemo(() => createTauriChatAdapter(adapterOptions), [adapterOptions]);

  const runtime = useLocalRuntime(adapter);

  const contextValue: TauriRuntimeContextValue = useMemo(() => ({
    approvalRequest,
    resolveApproval,
    approve,
    deny,
  }), [approvalRequest, resolveApproval, approve, deny]);

  const isDevActive = isHarnessMode || (pathname != null && pathname.startsWith('/dev'));

  if (!isDevActive) {
    return <>{children}</>;
  }

  return (
    <TauriRuntimeContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </TauriRuntimeContext.Provider>
  );
}
