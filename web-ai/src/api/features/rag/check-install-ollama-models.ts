/**
 * Script para verificar e instalar modelos Ollama necessários.
 * Uso: node server/features/rag/check-install-ollama-models.ts
 */
import { execSync } from 'child_process';

// Modelos necessários (pode ser lido do .env, mas hardcoded para robustez)
const REQUIRED_MODELS = [
  process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  process.env.LLM_MODEL || 'gemma3:4b',
];

function getInstalledModels(): string[] {
  try {
    const output = execSync('ollama list', { encoding: 'utf-8' });
    return output
      .split('\n')
      .slice(1) // pula header
      .map(line => line.split(' ')[0].trim())
      .filter(Boolean);
  } catch (e) {
    console.error('Erro ao executar "ollama list". Ollama está rodando?');
    process.exit(1);
  }
}

function installModel(model: string) {
  try {
    console.log(`Instalando modelo: ${model}`);
    execSync(`ollama pull ${model}`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Erro ao instalar modelo ${model}:`, e);
    process.exit(1);
  }
}

function main() {
  const installed = getInstalledModels();
  for (const model of REQUIRED_MODELS) {
    if (!installed.includes(model)) {
      installModel(model);
    } else {
      console.log(`Modelo já instalado: ${model}`);
    }
  }
}

if (require.main === module) {
  main();
}