'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Attachment } from '../chat/types';

export function useAttachments(searchConversationId: string | null) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const loadAttachments = useCallback(async (cid: string | null) => {
    try {
      const res = await fetch(`/api/sources?conversationId=${encodeURIComponent(cid ?? 'session')}`);
      if (!res.ok) return;
      const data = (await res.json()) as Array<{ id: string; name: string; description: string | null }>;
      setAttachments(data.map((s) => ({ id: s.id, name: s.name, size: s.description ?? undefined })));
    } catch {}
  }, []);

  useEffect(() => {
    void loadAttachments(searchConversationId);
  }, [searchConversationId, loadAttachments]);

  const attachFiles = useCallback(async (files: FileList | null, conversationId: string | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setAttachments((prev) => [
        ...prev,
        { id: tempId, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, uploading: true },
      ]);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId ?? 'session');
        const res = await fetch('/api/sources', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { id: string };
        setAttachments((prev) =>
          prev.map((a) => (a.id === tempId ? { ...a, id: data.id, uploading: false } : a)),
        );
      } catch {
        setAttachments((prev) => prev.filter((a) => a.id !== tempId));
      }
    }
  }, []);

  const removeAttachment = useCallback(async (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/sources?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
  }, []);

  const clearAttachments = useCallback(() => setAttachments([]), []);

  return { attachments, attachFiles, removeAttachment, clearAttachments };
}
