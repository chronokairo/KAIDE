"use client";

import React, { useState, useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language.trim() || 'text';

  return (
    <div className="my-3.5 rounded-xl border border-outline-variant/40 bg-zinc-950 text-zinc-100 overflow-hidden shadow-sm font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 select-none">
        <span className="font-semibold uppercase tracking-wider text-zinc-300">
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors text-[11px]"
          title="Copiar código"
          aria-label="Copiar código"
        >
          <span className="material-symbols-outlined text-[13px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-zinc-200 selection:bg-secondary/30 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Tokenize inline elements: `code`, **bold**, *italic*, ~~strikethrough~~, [links](url)
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 font-mono text-[12px] text-secondary font-medium"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline font-medium inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
          <span className="material-symbols-outlined text-[12px] opacity-70">open_in_new</span>
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 3. Bold + Italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      tokens.push(
        <strong key={key++} className="font-bold italic text-on-surface">
          {renderInlineFormatting(boldItalicMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 4. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} className="font-bold text-on-surface">
          {renderInlineFormatting(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 5. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={key++} className="italic">
          {renderInlineFormatting(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 6. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      tokens.push(
        <del key={key++} className="line-through opacity-70">
          {renderInlineFormatting(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 7. Regular plain character / string until next special char
    const nextSpecial = remaining.search(/[`*~_\[]/);
    if (nextSpecial === -1) {
      tokens.push(<span key={key++}>{remaining}</span>);
      break;
    } else if (nextSpecial > 0) {
      tokens.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
      remaining = remaining.slice(nextSpecial);
    } else {
      // Single orphan special character
      tokens.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  className = '',
}) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let nodeKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code Blocks: ```lang ... ```
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        nodes.push(
          <CodeBlock
            key={nodeKey++}
            language={lang}
            code={codeLines.join('\n')}
          />
        );
        continue;
      }

      // 2. Headings: # H1, ## H2, ### H3, #### H4, ##### H5, ###### H6
      const h6Match = line.match(/^######\s+(.+)$/);
      if (h6Match) {
        nodes.push(
          <h6 key={nodeKey++} className="text-xs font-bold text-on-surface uppercase tracking-wider mt-3 mb-1">
            {renderInlineFormatting(h6Match[1])}
          </h6>
        );
        i++;
        continue;
      }

      const h5Match = line.match(/^#####\s+(.+)$/);
      if (h5Match) {
        nodes.push(
          <h5 key={nodeKey++} className="text-xs font-bold text-on-surface mt-3.5 mb-1.5">
            {renderInlineFormatting(h5Match[1])}
          </h5>
        );
        i++;
        continue;
      }

      const h4Match = line.match(/^####\s+(.+)$/);
      if (h4Match) {
        nodes.push(
          <h4 key={nodeKey++} className="text-sm font-bold text-on-surface mt-4 mb-1.5">
            {renderInlineFormatting(h4Match[1])}
          </h4>
        );
        i++;
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        nodes.push(
          <h3 key={nodeKey++} className="text-base font-bold text-primary mt-4 mb-2 flex items-center gap-1.5">
            {renderInlineFormatting(h3Match[1])}
          </h3>
        );
        i++;
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        nodes.push(
          <h2 key={nodeKey++} className="text-lg font-bold text-primary mt-5 mb-2.5 pb-1 border-b border-outline-variant/30">
            {renderInlineFormatting(h2Match[1])}
          </h2>
        );
        i++;
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        nodes.push(
          <h1 key={nodeKey++} className="text-xl font-bold text-primary mt-6 mb-3 pb-1.5 border-b border-outline-variant/40">
            {renderInlineFormatting(h1Match[1])}
          </h1>
        );
        i++;
        continue;
      }

      // 3. Horizontal Rule: --- or *** or ___
      if (/^(\*\*\*|---|___)\s*$/.test(line.trim())) {
        nodes.push(<hr key={nodeKey++} className="my-4 border-outline-variant/40" />);
        i++;
        continue;
      }

      // 4. Blockquotes: > quote
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        nodes.push(
          <blockquote
            key={nodeKey++}
            className="my-3 pl-3.5 py-1 border-l-3 border-secondary/60 bg-surface-container-low/40 rounded-r-lg text-on-surface-variant text-xs md:text-sm italic"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx}>{renderInlineFormatting(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 5. Tables: | Header | Header | ...
      if (line.trim().startsWith('|') && line.includes('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        const parseRow = (rowStr: string) => {
          return rowStr
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());
        };

        if (tableLines.length >= 2) {
          const headerRow = parseRow(tableLines[0]);
          const bodyRows = tableLines.slice(1).filter((r) => !r.match(/^\|?\s*[-:\s|]+\s*\|?$/)).map(parseRow);

          nodes.push(
            <div key={nodeKey++} className="my-3.5 overflow-x-auto rounded-xl border border-outline-variant/40 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/40">
                    {headerRow.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold text-on-surface uppercase tracking-wider text-[11px]">
                        {renderInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 bg-surface">
                  {bodyRows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-surface-container-low/50 transition-colors">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-on-surface leading-snug">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 6. Checkbox / Task lists: - [ ] or - [x]
      const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
      if (taskMatch) {
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        nodes.push(
          <div key={nodeKey++} className="flex items-start gap-2 my-1 text-xs md:text-sm">
            <span
              className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                isChecked ? 'text-secondary font-bold' : 'text-on-surface-variant/60'
              }`}
            >
              {isChecked ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span className={isChecked ? 'line-through text-on-surface-variant' : 'text-on-surface'}>
              {renderInlineFormatting(taskMatch[3])}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // 7. Unordered Lists: - item, * item, + item
      if (/^\s*[-*+]\s+/.test(line)) {
        const listItems: { indent: number; text: string }[] = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          const match = lines[i].match(/^(\s*)[-*+]\s+(.+)$/);
          if (match) {
            listItems.push({
              indent: match[1].length,
              text: match[2],
            });
          }
          i++;
        }
        nodes.push(
          <ul key={nodeKey++} className="my-2 pl-4 list-disc space-y-1 text-xs md:text-sm text-on-surface marker:text-secondary">
            {listItems.map((item, idx) => (
              <li key={idx} style={{ marginLeft: `${item.indent * 12}px` }}>
                {renderInlineFormatting(item.text)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 8. Ordered Lists: 1. item, 2. item
      if (/^\s*\d+\.\s+/.test(line)) {
        const listItems: { num: string; text: string }[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          const match = lines[i].match(/^\s*(\d+)\.\s+(.+)$/);
          if (match) {
            listItems.push({ num: match[1], text: match[2] });
          }
          i++;
        }
        nodes.push(
          <ol key={nodeKey++} className="my-2 pl-4 list-decimal space-y-1 text-xs md:text-sm text-on-surface marker:text-secondary font-medium">
            {listItems.map((item, idx) => (
              <li key={idx}>
                <span className="font-normal text-on-surface">{renderInlineFormatting(item.text)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 9. Blank line / Paragraph separator
      if (!line.trim()) {
        i++;
        continue;
      }

      // 10. Normal Paragraph
      const paraLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].trim().startsWith('|') &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^(\*\*\*|---|___)\s*$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i]);
        i++;
      }

      nodes.push(
        <p key={nodeKey++} className="my-2 text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
          {renderInlineFormatting(paraLines.join('\n'))}
        </p>
      );
    }

    return nodes;
  }, [content]);

  return (
    <div className={`prose-container w-full max-w-none break-words ${className}`}>
      {renderedElements}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-secondary animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
};
