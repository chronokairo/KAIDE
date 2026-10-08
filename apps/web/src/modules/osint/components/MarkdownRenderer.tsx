import React, { useState } from 'react';
import { Copy, Check, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split into code blocks vs general markdown blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed font-sans text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code Block with Header and Copy Button
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = !firstLine.includes(' ') && firstLine.length < 15 && firstLine.length > 0;
          const language = hasLang ? firstLine : 'text';
          const codeText = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return <CodeBlock key={index} language={language} code={codeText} />;
        }

        // Regular Markdown Paragraphs & Structural Blocks
        const blocks = part.split(/\n\n+/);
        return (
          <React.Fragment key={index}>
            {blocks.map((block, bIdx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              // Horizontal Rule (--- or *** or ___)
              if (/^([-*_]){3,}$/.test(trimmed)) {
                return <hr key={bIdx} className="my-3 border-slate-800" />;
              }

              // Header 1
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={bIdx} className="text-sm font-black text-cyan-300 mt-3 mb-1 border-b border-slate-800 pb-1">
                    {renderFormattedInline(trimmed.slice(2))}
                  </h1>
                );
              }
              // Header 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={bIdx} className="text-xs font-extrabold text-cyan-400 mt-3 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    {renderFormattedInline(trimmed.slice(3))}
                  </h2>
                );
              }
              // Header 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={bIdx} className="text-xs font-bold text-slate-200 mt-2 mb-1">
                    {renderFormattedInline(trimmed.slice(4))}
                  </h3>
                );
              }
              // Header 4
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={bIdx} className="text-[11px] font-bold text-slate-300 mt-2 mb-1 uppercase tracking-wide">
                    {renderFormattedInline(trimmed.slice(5))}
                  </h4>
                );
              }

              // Markdown Table Detection
              if (isMarkdownTable(trimmed)) {
                return <MarkdownTable key={bIdx} rawTable={trimmed} />;
              }

              // Blockquote
              if (trimmed.startsWith('> ')) {
                const quoteText = trimmed.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n');
                return (
                  <blockquote key={bIdx} className="border-l-2 border-cyan-500 pl-3 py-1 bg-slate-900/60 rounded-r-lg text-slate-300 italic my-2 space-y-1">
                    {renderFormattedInline(quoteText)}
                  </blockquote>
                );
              }

              // Task List / Checklist Block (- [ ] or - [x])
              if (trimmed.split('\n').some((l) => /^[-*]\s+\[[ xX]\]/.test(l.trim()))) {
                const lines = trimmed.split('\n');
                return (
                  <div key={bIdx} className="space-y-1.5 my-2">
                    {lines.map((line, lIdx) => {
                      const lineTrimmed = line.trim();
                      const isTask = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(lineTrimmed);
                      if (isTask) {
                        const checked = isTask[1].toLowerCase() === 'x';
                        const text = isTask[2];
                        return (
                          <div key={lIdx} className="flex items-center gap-2 text-slate-200">
                            {checked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className={checked ? 'line-through text-slate-400' : ''}>
                              {renderFormattedInline(text)}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} className="leading-relaxed">
                          {renderFormattedInline(lineTrimmed)}
                        </p>
                      );
                    })}
                  </div>
                );
              }

              // Bullet List Block
              if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
                const items = trimmed.split('\n');
                return (
                  <ul key={bIdx} className="space-y-1 my-1.5 pl-1">
                    {items.map((item, itemIdx) => {
                      const cleanItem = item.trim().replace(/^[-*]\s+/, '');
                      return (
                        <li key={itemIdx} className="flex items-start gap-2 text-slate-200">
                          <span className="text-cyan-400 font-bold select-none shrink-0">•</span>
                          <span>{renderFormattedInline(cleanItem)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Numbered List Block
              if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
                const items = trimmed.split('\n');
                return (
                  <ol key={bIdx} className="space-y-1 my-1.5 pl-1">
                    {items.map((item, itemIdx) => {
                      const cleanItem = item.trim().replace(/^\d+\.\s+/, '');
                      return (
                        <li key={itemIdx} className="flex items-start gap-2 text-slate-200">
                          <span className="text-cyan-400 font-mono text-[11px] select-none shrink-0 font-bold">{itemIdx + 1}.</span>
                          <span>{renderFormattedInline(cleanItem)}</span>
                        </li>
                      );
                    })}
                  </ol>
                );
              }

              // Mixed Lines inside Paragraph (e.g. lists mixed with text)
              const lines = trimmed.split('\n');
              if (lines.length > 1) {
                return (
                  <div key={bIdx} className="space-y-1 my-1">
                    {lines.map((line, lIdx) => {
                      const lineTrimmed = line.trim();
                      if (lineTrimmed.startsWith('- ') || lineTrimmed.startsWith('* ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2 text-slate-200 pl-1">
                            <span className="text-cyan-400 font-bold select-none shrink-0">•</span>
                            <span>{renderFormattedInline(lineTrimmed.replace(/^[-*]\s+/, ''))}</span>
                          </div>
                        );
                      }
                      if (/^\d+\.\s+/.test(lineTrimmed)) {
                        const num = lineTrimmed.match(/^\d+/)?.[0] || '1';
                        return (
                          <div key={lIdx} className="flex items-start gap-2 text-slate-200 pl-1">
                            <span className="text-cyan-400 font-mono text-[11px] select-none shrink-0 font-bold">{num}.</span>
                            <span>{renderFormattedInline(lineTrimmed.replace(/^\d+\.\s+/, ''))}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} className="leading-relaxed">
                          {renderFormattedInline(lineTrimmed)}
                        </p>
                      );
                    })}
                  </div>
                );
              }

              // Display Math ($$...$$)
              if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
                return (
                  <div key={bIdx} className="my-2 p-2.5 rounded-xl bg-slate-950 border border-cyan-900/50 text-cyan-300 font-mono text-center overflow-x-auto">
                    {trimmed.slice(2, -2).trim()}
                  </div>
                );
              }

              // Standard Paragraph
              return (
                <p key={bIdx} className="leading-relaxed">
                  {renderFormattedInline(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Sub-component for Code Block with Copy Button
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px] shadow-lg">
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[10px] font-sans"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-slate-200 whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Markdown Table Parser and Renderer
function isMarkdownTable(text: string): boolean {
  const lines = text.split('\n').map((l) => l.trim());
  if (lines.length < 2) return false;
  return lines[0].includes('|') && lines[1].includes('|') && /^[:\-\s|]+$/.test(lines[1]);
}

const MarkdownTable: React.FC<{ rawTable: string }> = ({ rawTable }) => {
  const lines = rawTable.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const headerCells = lines[0]
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

  const dataRows = lines.slice(2).map((rowLine) =>
    rowLine
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-900/90 border-b border-slate-800 text-cyan-300 font-bold uppercase tracking-wider text-[10px]">
            {headerCells.map((header, idx) => (
              <th key={idx} className="px-3.5 py-2 border-r border-slate-800/80 last:border-r-0 whitespace-nowrap">
                {renderFormattedInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-sans">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 border-r border-slate-800/40 last:border-r-0 text-slate-200">
                  {renderFormattedInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline Markdown Tokenizer: bold, italic, strikethrough, inline code, links, inline math
function renderFormattedInline(text: string): React.ReactNode {
  // Tokens regex for inline code `code`, strikethrough ~~text~~, bold **text**, italic *text*, links [text](url), inline math $math$
  const tokenRegex = /(`[^`]+`|~~[^~]+~~|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\$[^$]+\$)/g;
  const tokens = text.split(tokenRegex);

  return tokens.map((token, i) => {
    // Inline Code `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    // Strikethrough ~~text~~
    if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
      return (
        <del key={i} className="line-through text-slate-500">
          {token.slice(2, -2)}
        </del>
      );
    }
    // Bold + Italic ***text***
    if (token.startsWith('***') && token.endsWith('***') && token.length > 6) {
      return (
        <strong key={i} className="font-extrabold italic text-cyan-200">
          {token.slice(3, -3)}
        </strong>
      );
    }
    // Bold **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic *text*
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={i} className="italic text-cyan-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Inline Link [text](url)
    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const match = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-0.5"
          >
            {match[1]} <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        );
      }
    }
    // Inline TeX Math $math$
    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      return (
        <span key={i} className="px-1 py-0.5 rounded bg-slate-900 border border-cyan-900/40 text-cyan-300 font-mono text-[11px]">
          {token.slice(1, -1)}
        </span>
      );
    }
    return token;
  });
}
