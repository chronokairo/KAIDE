'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

const components: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-primary">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 text-primary">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-primary">{children}</h3>,
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className={`${className ?? ''} text-xs`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono text-[0.85em]" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 rounded-xl bg-[#1e1e2e] text-[#cdd6f4] overflow-x-auto p-4 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="my-2 pl-5 space-y-1 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 pl-5 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-4 border-l-4 border-secondary/40 text-on-surface-variant italic">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-4 border-outline-variant" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-container">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-on-surface border border-outline-variant">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-on-surface border border-outline-variant">{children}</td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-secondary underline hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  ),
};

interface Props {
  content: string;
  className?: string;
}

function normalizeMath(text: string): string {
  return text
    .replace(/```(?:latex|math)\n([\s\S]*?)```/g, (_m, inner) => `$$\n${inner.trim()}\n$$`)
    .replace(/\\\[([^]*?)\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(([^]*?)\\\)/g, (_m, inner) => `$${inner}$`)
    .replace(/`([^`]*\\(?:frac|sqrt|pm|cdot|times|alpha|beta|theta|gamma|delta|sigma|omega|pi|mu|lambda|sum|int|lim|infty|partial|leq|geq|neq|approx|left|right|begin|end|text)[^`]*)`/g, (_m, inner) => `$${inner}$`)
    .replace(/\u202f/g, '\u00a0');
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {normalizeMath(content)}
      </ReactMarkdown>
    </div>
  );
}
