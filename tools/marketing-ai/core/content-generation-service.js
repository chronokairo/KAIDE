// content-generation-service.js — Serviço de Domínio para Geração de Conteúdo com IA
//
// Hexagonal (ADR-0003, ADR-0020): Centraliza regras de negócio, sanitização de prompts,
// validação de caminhos de arquivos e orquestração de geração de criativos sem acoplamento
// a navegadores ou seletores de DOM.

const fs = require('fs');
const path = require('path');
const { assertAiContentGeneratorPort } = require('../ports/ai-content-generator');

function createContentGenerationService({ generatorAdapter, workspaceRoot = process.cwd() }) {
  const adapter = assertAiContentGeneratorPort(generatorAdapter);

  return {
    /**
     * Orquestra a geração de imagem por IA e persistência no sistema de arquivos.
     *
     * @param {Object} params
     * @param {string} params.prompt - Texto descritivo da imagem a ser gerada
     * @param {string} params.outputPath - Caminho local (relativo ou absoluto) onde salvar a imagem
     * @param {string} [params.browser='edge'] - Navegador com a sessão ativa
     * @param {number} [params.timeoutMs=120000] - Tempo máximo de espera pela geração
     */
    async generateImage({ prompt, outputPath, browser = 'edge', timeoutMs = 120000 }) {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        throw new Error('Prompt inválido: deve conter pelo menos 5 caracteres.');
      }
      if (!outputPath || typeof outputPath !== 'string') {
        throw new Error('Caminho de saída (outputPath) é obrigatório.');
      }

      const fullOutputPath = path.isAbsolute(outputPath)
        ? outputPath
        : path.resolve(workspaceRoot, outputPath);

      const targetDir = path.dirname(fullOutputPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const startTime = Date.now();
      const result = await adapter.generateImage({
        prompt: prompt.trim(),
        outputPath: fullOutputPath,
        browser,
        timeoutMs
      });

      const durationMs = Date.now() - startTime;

      if (!result.success || !fs.existsSync(fullOutputPath)) {
        throw new Error(result.error || 'Falha na geração ou gravação da imagem gerada.');
      }

      const stats = fs.statSync(fullOutputPath);

      return {
        success: true,
        filePath: fullOutputPath,
        relativePath: path.relative(workspaceRoot, fullOutputPath),
        fileSizeBytes: stats.size,
        width: result.width || null,
        height: result.height || null,
        text: result.text || '',
        durationMs
      };
    },

    /**
     * Orquestra a geração de texto / copywriting por IA.
     *
     * @param {Object} params
     * @param {string} params.prompt - Instrução ou briefing do texto
     * @param {string} [params.browser='edge'] - Navegador com a sessão ativa
     * @param {number} [params.timeoutMs=60000] - Tempo máximo de espera
     */
    async generateText({ prompt, browser = 'edge', timeoutMs = 60000 }) {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        throw new Error('Prompt inválido: deve conter pelo menos 3 caracteres.');
      }

      const startTime = Date.now();
      const result = await adapter.generateText({
        prompt: prompt.trim(),
        browser,
        timeoutMs
      });

      const durationMs = Date.now() - startTime;

      return {
        success: true,
        text: result.text || '',
        durationMs
      };
    }
  };
}

module.exports = {
  createContentGenerationService
};
