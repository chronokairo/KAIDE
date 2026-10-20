// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AiChatPanel } from '../AiChatPanel';
afterEach(cleanup);
describe('AiChatPanel (agnostic UI)', () => {
  it('renders empty state with suggestions', () => {
    const onSend = vi.fn();
    render(
      <AiChatPanel
        messages={[]}
        suggestions={['O que você faz?']}
        onSendMessage={onSend}
      />
    );
    expect(screen.getByText('Como posso ajudar hoje?')).toBeInTheDocument();
    const btn = screen.getByText('O que você faz?');
    fireEvent.click(btn);
    expect(onSend).toHaveBeenCalledWith('O que você faz?');
  });

  it('renders messages and submits input', () => {
    const onSend = vi.fn();
    render(
      <AiChatPanel
        messages={[
          { role: 'user', content: 'Olá' },
          { role: 'assistant', content: 'Tudo bem!' },
        ]}
        onSendMessage={onSend}
      />
    );
    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(screen.getByText('Tudo bem!')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Peça qualquer coisa…');
    fireEvent.change(input, { target: { value: 'Nova pergunta' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Nova pergunta');
  });
});
