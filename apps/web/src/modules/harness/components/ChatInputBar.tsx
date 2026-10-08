'use client';

import { useRef, type RefObject } from 'react';
import type { Attachment } from '../chat/types';

interface ChatInputBarProps {
  input: string;
  placeholder: string;
  isTyping: boolean;
  attachments: Attachment[];
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onFocusChange: (focused: boolean) => void;
  onAttachFiles: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
}

export default function ChatInputBar({
  input,
  placeholder,
  isTyping,
  attachments,
  inputRef,
  onInputChange,
  onSubmit,
  onFocusChange,
  onAttachFiles,
  onRemoveAttachment,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gradient-to-t from-surface via-surface to-transparent pt-12 pb-8 px-margin-desktop">
      <div className="max-w-[800px] mx-auto space-y-4">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2">
            {attachments.map((att) => (
              <span
                key={att.id}
                title={att.name}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-white border border-outline-variant shadow-sm text-[12px] text-on-surface max-w-[260px]"
              >
                <span className={`material-symbols-outlined text-[16px] text-secondary flex-shrink-0 ${att.uploading ? 'animate-spin' : ''}`}>
                  {att.uploading ? 'progress_activity' : 'description'}
                </span>
                <span className={`truncate ${att.uploading ? 'opacity-60' : ''}`}>{att.name}</span>
                {att.size && <span className="text-on-surface-variant flex-shrink-0">({att.size})</span>}
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  disabled={att.uploading}
                  aria-label={`Remover anexo ${att.name}`}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors flex-shrink-0 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex items-center gap-0 bg-white border border-outline-variant rounded-full shadow-lg glow-focus transition-all duration-300"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.csv,.txt,.md,.doc,.docx,image/*,audio/*,video/*"
            className="hidden"
            onChange={(e) => {
              onAttachFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Anexar documentos"
            title="Anexar documentos — a Anna usa as informações para preencher seus dados"
            className="flex-shrink-0 ml-2 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 duration-100 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent outline-none py-5 text-on-surface font-body-md text-body-md"
          />

          <button
            type="submit"
            disabled={isTyping}
            className="flex-shrink-0 mr-2 w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary-container transition-all active:scale-90 duration-100 shadow-md disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        </form>

        <p className="text-center font-body-sm text-[12px] text-outline-variant">
          Anna AI pode cometer erros. Verifique informações importantes no portal do aluno.
        </p>
      </div>
    </div>
  );
}
