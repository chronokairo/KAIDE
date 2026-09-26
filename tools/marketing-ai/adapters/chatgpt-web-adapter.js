// chatgpt-web-adapter.js — Adaptador de Saída Hexagonal para o ChatGPT Web
//
// Implementa AiContentGeneratorPort (core/ports/ai-content-generator.js).
// Encapsula toda a automação via CDP do navegador persistente (Microsoft Edge / Google Chrome),
// permitindo gerar imagens (DALL-E 3) e textos aproveitando a sessão autenticada (Plus)
// com zero prompts intrusivos e zero WebSockets avulsos.

const fs = require('fs');
const path = require('path');

function createChatGptWebAdapter({ getCDP }) {
  async function getBrowserClient(browserName = 'edge') {
    const client = typeof getCDP === 'function' ? await getCDP(browserName) : null;
    if (!client) {
      throw new Error(`CDP do navegador '${browserName}' não disponível.`);
    }
    return client;
  }

  async function ensureChatGPTPage(client) {
    const pages = await client.getPages();
    let chatPage = pages.find(p => p.url && p.url.includes('chatgpt.com'));
    if (!chatPage) {
      // Procurar aba ativa ou navegar
      chatPage = pages.find(p => p.type === 'page' && !p.url.includes('business.facebook.com'));
      if (!chatPage) {
        throw new Error('Aba do ChatGPT não encontrada. Abra https://chatgpt.com no navegador.');
      }
      await client.navigate('https://chatgpt.com', chatPage.targetId);
      await new Promise(r => setTimeout(r, 4000));
    }

    await client.activate(chatPage.targetId);
    const { sessionId } = await client.attach(chatPage.targetId);
    return { targetId: chatPage.targetId, sessionId };
  }

  return {
    /**
     * Valida se a sessão do ChatGPT está ativa e pronta para receber prompts.
     */
    async ensureSession({ browser = 'edge' } = {}) {
      const client = await getBrowserClient(browser);
      const { sessionId } = await ensureChatGPTPage(client);

      const checkScript = `
        (() => {
          const editor = document.querySelector('#prompt-textarea');
          const isPlus = document.body.innerText.includes('Plus') || document.body.innerText.includes('Luan Nery');
          return { ready: !!editor, isPlus };
        })()
      `;
      const res = await client.send('Runtime.evaluate', { expression: checkScript, returnByValue: true }, sessionId);
      return res && res.result ? res.result.value : { ready: false, isPlus: false };
    },

    /**
     * Envia prompt de criação de imagem para o ChatGPT Web e salva o resultado em disco.
     */
    async generateImage({ prompt, outputPath, browser = 'edge', timeoutMs = 120000 }) {
      const client = await getBrowserClient(browser);
      const { sessionId } = await ensureChatGPTPage(client);

      // 1. Mapear imagens existentes na página antes do envio
      const preCheckScript = `
        (() => {
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => 
            img.naturalWidth >= 400 && img.naturalHeight >= 400 && img.src
          );
          return imgs.map(i => i.src);
        })()
      `;
      const preRes = await client.send('Runtime.evaluate', { expression: preCheckScript, returnByValue: true }, sessionId);
      const knownImageSrcs = new Set(preRes?.result?.value || []);

      // 2. Inserir o prompt no editor
      const insertScript = `
        (() => {
          const editor = document.querySelector('#prompt-textarea');
          if (!editor) return { success: false, error: 'Editor #prompt-textarea não encontrado' };
          editor.focus();
          editor.innerText = ${JSON.stringify(prompt)};
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          return { success: true };
        })()
      `;
      const insertRes = await client.send('Runtime.evaluate', { expression: insertScript, returnByValue: true }, sessionId);
      if (!insertRes?.result?.value?.success) {
        throw new Error(insertRes?.result?.value?.error || 'Falha ao preencher o prompt no ChatGPT');
      }

      await new Promise(r => setTimeout(r, 600));

      // 3. Clicar no botão Enviar (via dispatchMouseEvent / DOM click)
      const clickSendScript = `
        (() => {
          const btn = document.querySelector('button[data-testid="send-button"]') ||
                      document.querySelector('button[aria-label="Enviar prompt"]') ||
                      document.querySelector('button[aria-label="Send prompt"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => 
                        b.querySelector('svg path[d*="M15.192"]') || b.getAttribute('aria-label') === 'Enviar prompt'
                      );
          if (!btn) return { success: false, error: 'Botão de envio não encontrado' };
          btn.click();
          return { success: true };
        })()
      `;
      const sendRes = await client.send('Runtime.evaluate', { expression: clickSendScript, returnByValue: true }, sessionId);
      if (!sendRes?.result?.value?.success) {
        throw new Error(sendRes?.result?.value?.error || 'Falha ao clicar no botão de envio do ChatGPT');
      }

      // 4. Aguardar o início e a conclusão da geração
      const startTime = Date.now();
      let hasStarted = false;
      let completed = false;

      while (Date.now() - startTime < timeoutMs) {
        await new Promise(r => setTimeout(r, 2500));

        const statusScript = `
          (() => {
            const isGenerating = document.querySelector('button[aria-label="Parar geração"]') !== null ||
                                 document.querySelector('button[data-testid="stop-button"]') !== null ||
                                 document.body.innerText.includes('Gerando uma imagem') ||
                                 document.body.innerText.includes('Pensando');
            
            const hasError = Array.from(document.querySelectorAll('div[role="alert"], button')).some(
              el => el.textContent && el.textContent.includes('Algo deu errado. Tente novamente.')
            );

            // Verificar se há uma imagem grande nova
            const allImgs = Array.from(document.querySelectorAll('img')).filter(img => 
              img.naturalWidth >= 400 && img.naturalHeight >= 400 && img.src
            );

            return { isGenerating, hasError, largeImagesCount: allImgs.length };
          })()
        `;

        const statusRes = await client.send('Runtime.evaluate', { expression: statusScript, returnByValue: true }, sessionId);
        const status = statusRes?.result?.value;

        if (status?.hasError) {
          throw new Error('ChatGPT reportou erro: "Algo deu errado. Tente novamente."');
        }

        if (status?.isGenerating) {
          hasStarted = true;
        } else if (hasStarted && !status?.isGenerating) {
          // Geração terminou!
          completed = true;
          break;
        } else if (!hasStarted && status?.largeImagesCount > knownImageSrcs.size) {
          // Imagem já apareceu rapidamente
          completed = true;
          break;
        }
      }

      if (!completed) {
        throw new Error(`Timeout de ${timeoutMs}ms aguardando a geração da imagem no ChatGPT.`);
      }

      // Aguardar 2 segundos adicionais para renderização final completa do asset
      await new Promise(r => setTimeout(r, 2000));

      // 5. Extrair a imagem gerada de mais alta resolução em formato base64
      const extractScript = `
        (async () => {
          const knownList = ${JSON.stringify(Array.from(knownImageSrcs))};
          const allImgs = Array.from(document.querySelectorAll('img')).filter(img => 
            img.naturalWidth >= 400 && img.naturalHeight >= 400 && img.src
          );

          // Priorizar imagem nova que não estava na lista inicial
          let targetImg = allImgs.find(img => !knownList.includes(img.src));
          if (!targetImg && allImgs.length > 0) {
            targetImg = allImgs[allImgs.length - 1];
          }

          if (!targetImg) {
            return { success: false, error: 'Nenhuma imagem gerada encontrada na página' };
          }

          // Extrair também o texto do assistente
          const articles = Array.from(document.querySelectorAll('article, [data-message-author-role="assistant"]'));
          const lastArticle = articles[articles.length - 1];
          const text = lastArticle ? lastArticle.innerText.trim() : '';

          try {
            const resp = await fetch(targetImg.src);
            const blob = await resp.blob();
            const b64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            return {
              success: true,
              dataUrl: b64,
              width: targetImg.naturalWidth,
              height: targetImg.naturalHeight,
              alt: targetImg.alt || '',
              text
            };
          } catch (err) {
            return { success: false, error: 'Erro no fetch da imagem: ' + err.message };
          }
        })()
      `;

      const extractRes = await client.send('Runtime.evaluate', {
        expression: extractScript,
        returnByValue: true,
        awaitPromise: true
      }, sessionId);

      const extractData = extractRes?.result?.value;
      if (!extractData || !extractData.success || !extractData.dataUrl) {
        throw new Error(extractData?.error || 'Falha ao extrair o binário da imagem do ChatGPT');
      }

      // 6. Gravar arquivo diretamente em disco no formato original (PNG/JPEG)
      const base64Content = extractData.dataUrl.split(',')[1];
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(outputPath, buffer);

      return {
        success: true,
        filePath: outputPath,
        width: extractData.width,
        height: extractData.height,
        text: extractData.text,
        fileSizeBytes: buffer.length
      };
    },

    /**
     * Envia prompt de texto / copywriting para o ChatGPT Web e retorna o resultado textual.
     */
    async generateText({ prompt, browser = 'edge', timeoutMs = 60000 }) {
      const client = await getBrowserClient(browser);
      const { sessionId } = await ensureChatGPTPage(client);

      // Inserir prompt
      const insertScript = `
        (() => {
          const editor = document.querySelector('#prompt-textarea');
          if (!editor) return { success: false, error: 'Editor #prompt-textarea não encontrado' };
          editor.focus();
          editor.innerText = ${JSON.stringify(prompt)};
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          return { success: true };
        })()
      `;
      const insertRes = await client.send('Runtime.evaluate', { expression: insertScript, returnByValue: true }, sessionId);
      if (!insertRes?.result?.value?.success) {
        throw new Error(insertRes?.result?.value?.error || 'Falha ao preencher prompt');
      }

      await new Promise(r => setTimeout(r, 600));

      // Clicar Enviar
      const clickScript = `
        (() => {
          const btn = document.querySelector('button[data-testid="send-button"]') ||
                      document.querySelector('button[aria-label="Enviar prompt"]') ||
                      document.querySelector('button[aria-label="Send prompt"]');
          if (!btn) return { success: false, error: 'Botão de envio não encontrado' };
          btn.click();
          return { success: true };
        })()
      `;
      await client.send('Runtime.evaluate', { expression: clickScript, returnByValue: true }, sessionId);

      // Aguardar conclusão
      const startTime = Date.now();
      let hasStarted = false;

      while (Date.now() - startTime < timeoutMs) {
        await new Promise(r => setTimeout(r, 1500));

        const statusScript = `
          (() => {
            const isGenerating = document.querySelector('button[aria-label="Parar geração"]') !== null ||
                                 document.querySelector('button[data-testid="stop-button"]') !== null;
            return { isGenerating };
          })()
        `;
        const res = await client.send('Runtime.evaluate', { expression: statusScript, returnByValue: true }, sessionId);
        const isGenerating = res?.result?.value?.isGenerating;

        if (isGenerating) {
          hasStarted = true;
        } else if (hasStarted && !isGenerating) {
          break;
        }
      }

      // Extrair resposta do assistente (priorizando conteúdo markdown após pensamento)
      const extractScript = `
        (() => {
          const articles = Array.from(document.querySelectorAll('article, [data-message-author-role="assistant"]'));
          const lastArticle = articles[articles.length - 1];
          if (!lastArticle) return '';
          const prose = lastArticle.querySelector('div.markdown, div.prose, [class*="markdown"]');
          if (prose) return prose.innerText.trim();
          return lastArticle.innerText.trim();
        })()
      `;
      const textRes = await client.send('Runtime.evaluate', { expression: extractScript, returnByValue: true }, sessionId);
      return {
        success: true,
        text: textRes?.result?.value || ''
      };
    }
  };
}

module.exports = {
  createChatGptWebAdapter
};
