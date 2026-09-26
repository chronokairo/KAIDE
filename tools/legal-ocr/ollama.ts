const OLLAMA_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LLM_BASE_URL) ||
  "http://localhost:11434";

export interface ProcessData {
  numero: string;
  requerente: string;
  assunto: string;
}

export interface AnalysisResult {
  despacho: string;
  requerimento: string;
}

export async function getFirstModel(): Promise<string> {
  // Always use the "auto" virtual model — it intelligently routes to the best
  // available model via the vscode-llm-server bridge.
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  if (!res.ok) throw new Error(`Servidor LLM não acessível em ${OLLAMA_BASE}`);
  const data = await res.json();
  const models: { name: string }[] = data.models ?? [];
  if (models.length === 0) throw new Error("Nenhum modelo encontrado.");
  // Prefer the "auto" router model; fall back to first available
  const autoModel = models.find((m) => m.name === "auto");
  return autoModel ? "auto" : models[0].name;
}

async function chat(
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`Erro na API do LLM (${res.status}): ${res.statusText}`);
  const data = await res.json();
  return ((data.message?.content as string) ?? "").trim();
}

function parseJson<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  // Extract first JSON object or array
  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error("LLM não retornou JSON válido.");
  return JSON.parse(match[0]) as T;
}

export async function extractProcessData(
  model: string,
  pdfText: string
): Promise<ProcessData> {
  const system = `Você é um assistente especializado em análise de processos administrativos municipais brasileiros.
Responda SEMPRE com um objeto JSON válido, sem markdown, sem explicações adicionais.
Schema obrigatório: {"numero": string, "requerente": string, "assunto": string}
Se algum campo não puder ser identificado, use "Não identificado".`;

  const user = `Analise o texto abaixo e extraia:
- numero: número do processo (ex.: 2024.00123.000456-78)
- requerente: nome completo da pessoa ou empresa que faz o pedido
- assunto: descrição concisa do que está sendo solicitado (máximo 2 linhas)

TEXTO DO PROCESSO:
${pdfText}`;

  const response = await chat(model, system, user);
  const parsed = parseJson<Record<string, string>>(response);
  return {
    numero: parsed.numero ?? "Não identificado",
    requerente: parsed.requerente ?? "Não identificado",
    assunto: parsed.assunto ?? "Não identificado",
  };
}

export async function generateDespachoAndRequerimento(
  model: string,
  processData: ProcessData,
  pdfText: string
): Promise<AnalysisResult> {
  const context = `Processo nº: ${processData.numero}
Requerente: ${processData.requerente}
Assunto: ${processData.assunto}

TEXTO COMPLETO DO PROCESSO:
${pdfText}`;

  const systemDespacho = `Você é um servidor público especializado em redação de despachos administrativos municipais brasileiros.
Escreva somente o corpo do despacho — sem cabeçalho, título, assinatura ou data.`;

  const promptDespacho = `Redija um despacho administrativo formal com base no processo abaixo. O despacho deve:
- Usar norma culta da língua portuguesa e linguagem técnica formal
- Citar o número do processo e o nome do requerente
- Analisar brevemente o mérito com base no conteúdo apresentado
- Concluir com decisão fundamentada (deferimento, indeferimento ou encaminhamento)
- Ter entre 3 e 5 parágrafos

${context}`;

  const systemRequerimento = `Você é um assistente especializado em análise de processos administrativos municipais.
Escreva somente o resumo — sem título, cabeçalho ou qualquer outra informação.`;

  const promptRequerimento = `Com base no processo abaixo, escreva um resumo objetivo do requerimento em até 3 parágrafos, na terceira pessoa, descrevendo o que o requerente solicita e a documentação apresentada.

${context}`;

  const [despacho, requerimento] = await Promise.all([
    chat(model, systemDespacho, promptDespacho),
    chat(model, systemRequerimento, promptRequerimento),
  ]);

  return { despacho, requerimento };
}
