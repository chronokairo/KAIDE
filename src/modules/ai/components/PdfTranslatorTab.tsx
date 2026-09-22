"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface OllamaModel {
  name: string;
  size?: number;
  digest?: string;
}

interface ParagraphBlock {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  text: string;
  translation: string;
  isTranslating?: boolean;
}

export const PdfTranslatorTab: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Overlay Settings
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.95);
  const [pageParagraphs, setPageParagraphs] = useState<Record<number, ParagraphBlock[]>>({});

  // Ollama & Translation State
  const [models, setModels] = useState<string[]>(['qwen3.5:2b', 'qwen2.5:7b', 'llama3.2', 'gemma4:e2b']);
  const [selectedModel, setSelectedModel] = useState<string>('qwen3.5:2b');
  const [selectedGpu, setSelectedGpu] = useState<string>('0');
  const [targetLang, setTargetLang] = useState<string>('Português (Brasil)');
  const [pageTranslations, setPageTranslations] = useState<Record<number, string>>({});
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Pronto');
  const [statusType, setStatusType] = useState<'idle' | 'busy' | 'error' | 'success'>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache helper functions
  const getCacheKey = useCallback((pageNum: number, blockId = 'full') => {
    const filename = (pdfName || 'doc').trim();
    return `desktop_trans_cache::${filename}::p${pageNum}::${blockId}::${targetLang}`;
  }, [pdfName, targetLang]);

  const saveToCache = useCallback((pageNum: number, blockId: string, text: string) => {
    try {
      if (!text || text.trim().length === 0) return;
      localStorage.setItem(getCacheKey(pageNum, blockId), text);
    } catch (e) {
      console.warn('Cache save warning:', e);
    }
  }, [getCacheKey]);

  const getFromCache = useCallback((pageNum: number, blockId = 'full'): string | null => {
    try {
      return localStorage.getItem(getCacheKey(pageNum, blockId));
    } catch {
      return null;
    }
  }, [getCacheKey]);

  const clearPageCache = useCallback((pageNum: number) => {
    try {
      const prefix = `desktop_trans_cache::${(pdfName || 'doc').trim()}::p${pageNum}::`;
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix)) localStorage.removeItem(k);
      });
    } catch (e) {
      console.warn('Cache clear warning:', e);
    }
  }, [pdfName]);

  // Load PDF.js dynamically in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if ((window as any).pdfjsLib) {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Fetch Ollama models
  const fetchOllamaModels = useCallback(async () => {
    try {
      setStatusMessage('Buscando modelos no Ollama...');
      setStatusType('busy');
      const res = await fetch('http://localhost:11434/api/tags');
      if (!res.ok) throw new Error('Ollama indisponível');
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        const modelNames = data.models.map((m: OllamaModel) => m.name);
        setModels(modelNames);
        const preferred = modelNames.find((n: string) => n.includes('qwen') || n.includes('llama') || n.includes('gemma'));
        if (preferred) setSelectedModel(preferred);
        else setSelectedModel(modelNames[0]);
        setStatusMessage('Ollama Conectado');
        setStatusType('success');
      }
    } catch {
      setStatusMessage('Ollama offline (localhost:11434)');
      setStatusType('error');
    }
  }, []);

  useEffect(() => {
    fetchOllamaModels();
  }, [fetchOllamaModels]);

  // Extract paragraphs with accurate bounding boxes for in-place text overlay
  const extractParagraphs = async (pageNum: number, viewport: any): Promise<ParagraphBlock[]> => {
    if (!pdfDocRef.current) return [];
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rawItems = textContent.items.map((item: any) => {
        const tx = item.transform[4];
        const ty = item.transform[5];
        const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || 12;

        const [x1, y1] = viewport.convertToViewportPoint(tx, ty + fontHeight);
        const [x2, y2] = viewport.convertToViewportPoint(tx + (item.width || 40), ty);

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.max(10, Math.abs(x2 - x1));
        const height = Math.max(10, Math.abs(y2 - y1));

        return {
          str: item.str,
          left,
          top,
          width,
          height,
        };
      }).filter((item: any) => item.str.trim().length > 0);

      if (rawItems.length === 0) return [];

      const clusters: any[] = [];
      let currentCluster: any = null;

      for (const item of rawItems) {
        if (!currentCluster) {
          currentCluster = {
            left: item.left,
            top: item.top,
            width: item.width,
            height: item.height,
            text: item.str,
          };
          continue;
        }

        const verticalDist = item.top - (currentCluster.top + currentCluster.height);
        const isSameOrNextLine = verticalDist >= -10 && verticalDist <= (18 * scale);

        if (isSameOrNextLine) {
          currentCluster.left = Math.min(currentCluster.left, item.left);
          currentCluster.top = Math.min(currentCluster.top, item.top);
          currentCluster.width = Math.max(currentCluster.width, (item.left + item.width) - currentCluster.left);
          currentCluster.height = (item.top + item.height) - currentCluster.top;
          currentCluster.text += (currentCluster.text.endsWith('-') ? '' : ' ') + item.str;
        } else {
          clusters.push(currentCluster);
          currentCluster = {
            left: item.left,
            top: item.top,
            width: item.width,
            height: item.height,
            text: item.str,
          };
        }
      }

      if (currentCluster) clusters.push(currentCluster);

      return clusters.map((c, i) => {
        const blockId = `p-${pageNum}-${i}`;
        const cached = getFromCache(pageNum, blockId);
        return {
          id: blockId,
          left: Math.max(0, c.left),
          top: Math.max(0, c.top),
          width: Math.max(80, c.width),
          height: Math.max(20, c.height),
          text: c.text.trim(),
          translation: cached || '',
        };
      });
    } catch {
      return [];
    }
  };

  // Render Page on Canvas
  const renderPdfPage = useCallback(async (pageNum: number, currentScale: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Extract paragraph bounding boxes and restore cached translations
      const blocks = await extractParagraphs(pageNum, viewport);
      setPageParagraphs(prev => ({
        ...prev,
        [pageNum]: blocks,
      }));

      // Check full page cache
      const cachedFull = getFromCache(pageNum, 'full');
      if (cachedFull) {
        setPageTranslations(prev => ({ ...prev, [pageNum]: cachedFull }));
        setStatusMessage('Tradução restaurada do Cache 💾');
        setStatusType('success');
      }
    } catch (err) {
      console.error('Falha ao renderizar página:', err);
    }
  }, [scale, extractParagraphs, getFromCache]);

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPdfPage(currentPage, scale);
    }
  }, [currentPage, scale, renderPdfPage]);

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setPdfName(file.name);
    setPageTranslations({});
    setPageParagraphs({});
    setIsLoadingPdf(true);
    setStatusMessage('Carregando PDF...');
    setStatusType('busy');

    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result as ArrayBuffer);
      try {
        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) throw new Error('PDF.js ainda não carregado');

        const loadedPdf = await pdfjs.getDocument(typedArray).promise;
        pdfDocRef.current = loadedPdf;
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        setIsLoadingPdf(false);
        setStatusMessage('PDF carregado com sucesso');
        setStatusType('success');
        renderPdfPage(1, scale);
      } catch (err: any) {
        console.error(err);
        setIsLoadingPdf(false);
        setStatusMessage(`Erro ao abrir PDF: ${err.message}`);
        setStatusType('error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Streaming function with Vercel / Ollama stream protocol
  const streamTranslate = async (text: string, onChunk: (text: string) => void): Promise<string> => {
    abortControllerRef.current = new AbortController();

    const systemPrompt = `Você é um tradutor técnico e acadêmico profissional e rigoroso.
Traduza o texto fornecido diretamente para o idioma: "${targetLang}".
Regras:
1. Retorne APENAS o conteúdo traduzido em Markdown.
2. NÃO adicione introduções, explicações, cumprimentos ou notas.
3. Mantenha equações LaTeX, fórmulas e termos técnicos intactos.`;

    const prompt = `Traduza o seguinte texto:\n\n"""\n${text}\n"""`;

    const options: Record<string, any> = {};
    if (selectedGpu === 'cpu') {
      options.num_gpu = 0;
    } else if (selectedGpu === 'auto') {
      options.num_gpu = 99;
    } else {
      options.num_gpu = 99;
      options.main_gpu = parseInt(selectedGpu, 10);
    }

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        system: systemPrompt,
        prompt,
        options,
        stream: true,
      }),
      signal: abortControllerRef.current.signal,
    });

    if (!res.ok) {
      throw new Error(`Erro Ollama: ${res.status} ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Falha ao obter stream');

    const decoder = new TextDecoder('utf-8');
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim().length > 0);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            full += json.response;
            onChunk(full);
          }
        } catch {
          // ignore partial json
        }
      }
    }

    return full;
  };

  // Translate a single block in-place (Checks Cache)
  const handleTranslateSingleBlock = async (block: ParagraphBlock, force = false) => {
    if (isTranslating || !block.text) return;

    if (!force) {
      const cached = getFromCache(currentPage, block.id);
      if (cached) {
        block.translation = cached;
        setPageParagraphs(prev => ({ ...prev }));
        setStatusMessage('Bloco restaurado do Cache 💾');
        setStatusType('success');
        return;
      }
    }

    try {
      setIsTranslating(true);
      setStatusMessage(`Traduzindo bloco selecionado...`);
      setStatusType('busy');

      const translation = await streamTranslate(block.text, (streamed) => {
        setPageParagraphs(prev => {
          const currentList = prev[currentPage] || [];
          return {
            ...prev,
            [currentPage]: currentList.map(b => b.id === block.id ? { ...b, translation: streamed, isTranslating: true } : b),
          };
        });
      });

      saveToCache(currentPage, block.id, translation);

      setPageParagraphs(prev => {
        const currentList = prev[currentPage] || [];
        return {
          ...prev,
          [currentPage]: currentList.map(b => b.id === block.id ? { ...b, translation, isTranslating: false } : b),
        };
      });

      setStatusMessage('Bloco traduzido e salvo no Cache 💾');
      setStatusType('success');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Erro: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Translate entire current page (Checks Cache)
  const handleTranslateCurrentPage = async (force = false) => {
    if (!pdfDocRef.current || isTranslating) return;

    const blocks = pageParagraphs[currentPage] || [];
    if (blocks.length === 0) {
      alert('Nenhum texto detectado nesta página.');
      return;
    }

    // Check full page cache
    const cachedFull = getFromCache(currentPage, 'full');
    if (!force && cachedFull && blocks.every(b => b.translation && b.translation.length > 0)) {
      setPageTranslations(prev => ({ ...prev, [currentPage]: cachedFull }));
      setStatusMessage('Página carregada do Cache 💾');
      setStatusType('success');
      return;
    }

    try {
      setIsTranslating(true);
      let pageFullTranslation = '';

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        let translation = !force ? (b.translation || getFromCache(currentPage, b.id)) : null;

        if (!translation) {
          setStatusMessage(`Traduzindo bloco ${i + 1}/${blocks.length} (Pág. ${currentPage})...`);
          setStatusType('busy');

          translation = await streamTranslate(b.text, (streamed) => {
            setPageParagraphs(prev => {
              const list = prev[currentPage] || [];
              return {
                ...prev,
                [currentPage]: list.map(item => item.id === b.id ? { ...item, translation: streamed, isTranslating: true } : item),
              };
            });
          });

          saveToCache(currentPage, b.id, translation);
        }

        pageFullTranslation += `### Parágrafo ${i + 1}\n\n${translation}\n\n`;
        setPageTranslations(prev => ({ ...prev, [currentPage]: pageFullTranslation }));

        setPageParagraphs(prev => {
          const list = prev[currentPage] || [];
          return {
            ...prev,
            [currentPage]: list.map(item => item.id === b.id ? { ...item, translation: translation!, isTranslating: false } : item),
          };
        });
      }

      saveToCache(currentPage, 'full', pageFullTranslation);
      setStatusMessage('Página traduzida e salva no Cache 💾');
      setStatusType('success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatusMessage('Tradução cancelada');
        setStatusType('idle');
      } else {
        setStatusMessage(`Erro: ${err.message}`);
        setStatusType('error');
      }
    } finally {
      setIsTranslating(false);
      abortControllerRef.current = null;
    }
  };

  // Translate all pages (Skips cached pages)
  const handleTranslateAllPages = async () => {
    if (!pdfDocRef.current || isTranslating) return;

    setIsTranslating(true);
    const total = totalPages;

    for (let p = 1; p <= total; p++) {
      setCurrentPage(p);
      setProgressPercent(Math.round(((p - 1) / total) * 100));

      const cached = getFromCache(p, 'full');
      if (cached) {
        setPageTranslations(prev => ({ ...prev, [p]: cached }));
        continue;
      }

      await handleTranslateCurrentPage(false);
    }

    setProgressPercent(100);
    setTimeout(() => setProgressPercent(0), 1500);
    setIsTranslating(false);
    setStatusMessage('Todas as páginas processadas (Cache atualizado)!');
    setStatusType('success');
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    const pages = Object.keys(pageTranslations).map(Number).sort((a, b) => a - b);
    if (pages.length === 0) {
      alert('Nenhuma tradução disponível para exportar.');
      return;
    }

    let fullDoc = `# Tradução: ${pdfName || 'Documento'}\n\n`;
    pages.forEach(p => {
      fullDoc += `## Página ${p}\n\n${pageTranslations[p]}\n\n---\n\n`;
    });

    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfName.replace(/\.pdf$/i, '') || 'documento'}_traduzido.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentBlocks = pageParagraphs[currentPage] || [];
  const currentTranslationText = pageTranslations[currentPage] || '';

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0f12] text-zinc-200 overflow-hidden select-none font-sans">
      {/* Top Toolbar */}
      <header className="h-14 px-4 bg-[#13161c] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide">Tradutor de PDF & OCR</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                In-Place Overlay
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-xs">{pdfName || 'Nenhum PDF selecionado'}</p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-zinc-400">memory</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#1b1f27] text-xs text-zinc-200 rounded-lg px-2.5 py-1 border border-white/10 focus:outline-none focus:border-indigo-500"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={fetchOllamaModels}
              title="Atualizar modelos do Ollama"
              className="p-1 hover:text-indigo-400 text-zinc-400 text-xs rounded hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          </div>

          {/* Hardware / GPU Selector */}
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-1.5" title="Aceleração de Hardware / GPU">
            <span className="material-symbols-outlined text-[16px] text-amber-400">bolt</span>
            <select
              value={selectedGpu}
              onChange={(e) => setSelectedGpu(e.target.value)}
              className="bg-[#1b1f27] text-xs text-zinc-200 rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-indigo-500"
            >
              <option value="0">⚡ NVIDIA GTX 1650 (CUDA / Dedicada)</option>
              <option value="auto">⚡ Automático (Melhor GPU)</option>
              <option value="cpu">🖥️ Apenas CPU (Sem VRAM)</option>
              <option value="1">⚡ Intel UHD (Integrada)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-white/10"></div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-zinc-400">translate</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-[#1b1f27] text-xs text-zinc-200 rounded-lg px-2.5 py-1 border border-white/10 focus:outline-none focus:border-indigo-500"
            >
              <option value="Português (Brasil)">Português (BR)</option>
              <option value="English">Inglês</option>
              <option value="Español">Espanhol</option>
              <option value="Français">Francês</option>
              <option value="Deutsch">Alemão</option>
            </select>
          </div>

          <button
            onClick={handleTranslateCurrentPage}
            disabled={!pdfDocRef.current || isTranslating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
          >
            <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
            <span>Traduzir Página</span>
          </button>

          <button
            onClick={handleTranslateAllPages}
            disabled={!pdfDocRef.current || isTranslating}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-40 text-zinc-200 text-xs font-medium px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">fast_forward</span>
            <span>Todas</span>
          </button>
        </div>

        {/* Right: Upload & Export */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Abrir PDF</span>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportMarkdown}
            disabled={Object.keys(pageTranslations).length === 0}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-40 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10"
            title="Exportar documento traduzido em Markdown"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Exportar</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: PDF Canvas with In-Place Text Overlay */}
        <section className="flex-1 flex flex-col border-r border-white/10 bg-[#0d0f12] relative">
          {/* Navigation Bar */}
          <div className="h-10 px-4 bg-[#161920] border-b border-white/10 flex items-center justify-between text-xs text-zinc-300 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || !pdfDocRef.current}
                className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="font-mono text-[11px]">
                Pág. {totalPages > 0 ? currentPage : 0} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || !pdfDocRef.current}
                className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            {/* In-Place Overlay Controls */}
            <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded border border-white/10">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Sobreposição por Cima</span>
              </label>
              <div className="h-3 w-px bg-white/10"></div>
              <span className="text-[10px] text-zinc-400">Opacidade:</span>
              <input
                type="range"
                min="50"
                max="100"
                value={Math.round(overlayOpacity * 100)}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                className="w-16 h-1 accent-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScale(prev => Math.max(0.6, prev - 0.2))}
                className="p-1 hover:text-white rounded hover:bg-white/5"
                title="Reduzir Zoom"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span className="font-mono text-[11px] w-12 text-center">{Math.round((scale / 1.2) * 100)}%</span>
              <button
                onClick={() => setScale(prev => Math.min(2.4, prev + 0.2))}
                className="p-1 hover:text-white rounded hover:bg-white/5"
                title="Aumentar Zoom"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <button
                onClick={() => setScale(1.2)}
                className="p-1 hover:text-white rounded hover:bg-white/5"
                title="Ajuste Padrão"
              >
                <span className="material-symbols-outlined text-[18px]">fit_screen</span>
              </button>
            </div>
          </div>

          {/* Viewport */}
          <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-black/30 relative">
            {!pdfDocRef.current ? (
              <div className="m-auto text-center py-20 text-zinc-500 flex flex-col items-center">
                <span className="material-symbols-outlined text-[64px] text-zinc-700 mb-3">picture_as_pdf</span>
                <p className="text-sm font-medium text-zinc-400">Nenhum PDF Carregado</p>
                <p className="text-xs text-zinc-600 mt-1">Clique em "Abrir PDF" para iniciar a leitura</p>
              </div>
            ) : (
              <div className="shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white relative">
                <canvas ref={canvasRef} />

                {/* In-Place Text Overlay Elements */}
                {showOverlay && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {currentBlocks.map((block, idx) => {
                      const hasTranslation = block.translation && block.translation.trim().length > 0;
                      return (
                        <div
                          key={block.id}
                          onClick={() => handleTranslateSingleBlock(block)}
                          style={{
                            left: `${Math.max(4, block.left - 4)}px`,
                            top: `${Math.max(4, block.top - 2)}px`,
                            width: `${Math.max(120, block.width + 8)}px`,
                            minHeight: `${Math.max(22, block.height + 4)}px`,
                            backgroundColor: hasTranslation ? `rgba(15, 23, 42, ${overlayOpacity})` : 'transparent',
                            zIndex: hasTranslation ? 25 : 10,
                          }}
                          className={`absolute pointer-events-auto rounded transition-all cursor-pointer font-sans ${
                            hasTranslation
                              ? 'text-slate-100 text-xs shadow-xl border border-indigo-500/50 backdrop-blur-md p-2.5 hover:z-50'
                              : 'text-transparent hover:text-white hover:bg-indigo-950/40 border border-transparent hover:border-indigo-500/30 p-1'
                          }`}
                          title={hasTranslation ? 'Clique para re-traduzir' : 'Clique para traduzir este bloco'}
                        >
                          {hasTranslation ? (
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-indigo-400 mb-1 select-none border-b border-indigo-500/20 pb-0.5">
                                <span className="font-mono font-medium">#{idx + 1} Tradução</span>
                                <span className="hover:text-white" title="Re-traduzir"><span className="material-symbols-outlined text-[14px]">refresh</span></span>
                              </div>
                              <div className="text-[12px] leading-relaxed text-slate-100 font-normal select-text">
                                <MarkdownRenderer content={block.translation} isStreaming={block.isTranslating} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] bg-slate-900/90 text-indigo-300 px-1.5 py-0.5 rounded shadow opacity-0 hover:opacity-100">
                              Traduzir
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Pane: Live Sidebar Stream */}
        <section className="w-96 flex flex-col bg-[#111318] relative border-l border-white/10 shrink-0">
          {/* Header */}
          <div className="h-10 px-4 bg-[#161920] border-b border-white/10 flex items-center justify-between text-xs text-zinc-300 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  statusType === 'busy'
                    ? 'bg-amber-400 animate-pulse'
                    : statusType === 'error'
                    ? 'bg-rose-500'
                    : statusType === 'success'
                    ? 'bg-emerald-400'
                    : 'bg-zinc-500'
                }`}
              />
              <span className="font-medium text-zinc-300 text-[11px]">{statusMessage}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentTranslationText) {
                    navigator.clipboard.writeText(currentTranslationText);
                    setStatusMessage('Copiado para a área de transferência!');
                    setTimeout(() => setStatusMessage('Pronto'), 2000);
                  }
                }}
                className="p-1 hover:text-indigo-400 text-zinc-400 rounded hover:bg-white/5 transition-colors"
                title="Copiar Tradução"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
              <button
                onClick={() => {
                  clearPageCache(currentPage);
                  setPageTranslations(prev => {
                    const copy = { ...prev };
                    delete copy[currentPage];
                    return copy;
                  });
                  setPageParagraphs(prev => {
                    const list = prev[currentPage] || [];
                    return {
                      ...prev,
                      [currentPage]: list.map(item => ({ ...item, translation: '' })),
                    };
                  });
                  setStatusMessage('Tradução e Cache da página limpos!');
                  setStatusType('idle');
                }}
                className="p-1 hover:text-rose-400 text-zinc-400 rounded hover:bg-white/5 transition-colors"
                title="Limpar Tradução e Cache da Página"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>

          {/* Translation Stream View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!currentTranslationText ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                <span className="material-symbols-outlined text-[56px] text-zinc-700 mb-3">translate</span>
                <p className="text-sm font-medium text-zinc-400">Tradução em Tempo Real</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                  A tradução acontece em streaming <b>diretamente por cima do texto original</b> e sincronizada neste painel lateral.
                </p>
              </div>
            ) : (
              <div className="select-text">
                <MarkdownRenderer content={currentTranslationText} isStreaming={isTranslating} />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {progressPercent > 0 && (
            <div className="h-1 w-full bg-zinc-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
