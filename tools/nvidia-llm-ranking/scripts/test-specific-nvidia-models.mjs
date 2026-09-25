/**
 * Teste focado em modelos específicos do NVIDIA
 * Modelos: Llama Nemotron Ultra, Qwen 3 Coder, Kimi K2, MiniMax M2, GLM-5.1,
 *          DeepSeek V4, GPT-OSS-120B, Mistral Large 3, Nemotron 3 Nano, Mistral Small
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Modelos específicos para teste
const MODELS = [
  'NVIDIA/Llama-Nemotron-Ultra-1',
  'NVIDIA/Qwen-3.5-Coder-480B-A35B',
  'NVIDIA/Kimi-K2-Thinking-1',
  'NVIDIA/MiniMax-M2-1',
  'NVIDIA/GLM-5.1-1',
  'NVIDIA/DeepSeek-V4-1',
  'NVIDIA/GPT-OSS-120B-1',
  'NVIDIA/Mistral-Large-3-675B',
  'NVIDIA/Nemotron-3-Nano-1',
  'NVIDIA/Mistral-Small-1'
];

const OUTPUT_FILE = path.join(
  __dirname,
  '..',
  'data',
  'nvidia-specific-ranking-2026-05-23.json'
);

console.log('='.repeat(80));
console.log('Teste Focado - Modelos NVIDIA Selecionados');
console.log('='.repeat(80));
console.log(`Modelos: ${MODELS.length}`);
console.log(`Output: ${OUTPUT_FILE}\n`);

try {
  // Construir comando com todos os modelos
  const modelArgs = MODELS.join(' ');

  const cmd = `nvidia-ising-calibration-1 test-llm-ranking \\
    --models ${modelArgs} \\
    --benchmark-suite NVIDIA \\
    --evaluation-type full \\
    --output-path ${OUTPUT_FILE}`;

  // Importar e executar o script de benchmarking
  const { benchmarkModels } = await import('./generate-nvidia-ranking.mjs');

  console.log('Executando benchmarking para modelos específicos...\n');

  // Executar benchmarking com os modelos selecionados
  const results = await benchmarkModels({
    models: MODELS,
    benchmarkSuite: 'NVIDIA',
    evaluationType: 'full',
    outputPath: OUTPUT_FILE
  });

  console.log('\nBenchmarks completados com sucesso!');
  console.log(`Resultados salvos em: ${OUTPUT_FILE}`);

  console.log('\n' + '='.repeat(80));
  console.log('Teste concluído com sucesso!');
  console.log('='.repeat(80));

  // Ler e exibir resumo dos resultados
  if (fs.existsSync(OUTPUT_FILE)) {
    const results = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));

    console.log('\n--- Resumo dos Resultados ---');
    console.log(`Total de modelos testados: ${results.models?.length || 'N/A'}`);

    if (results.rankings && results.rankings.length > 0) {
      console.log('\nRanking Top 5:');
      results.rankings.slice(0, 5).forEach((rank, idx) => {
        console.log(`${idx + 1}. ${rank.model} - Score: ${rank.score} (Tier: ${rank.tier})`);
      });
    }
  }

} catch (error) {
  console.error('\nErro durante a execução do teste:');
  console.error(error.message);
  process.exit(1);
}
