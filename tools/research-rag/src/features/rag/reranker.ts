/**
 * @layer features/rag
 * @description Reranker para refinamento de documentos recuperados
 */

import type { Document } from '../documents/types.js';
import type { LLMProvider } from './llm-provider.js';

export interface Reranker {
    rerank(query: string, documents: Document[]): Promise<Document[]>;
}

/**
 * Reranker heurístico baseado em relevância textual
 */
export class HeuristicReranker implements Reranker {
    async rerank(query: string, documents: Document[]): Promise<Document[]> {
        console.log(`[HeuristicReranker] Reranking ${documents.length} documentos`);
        
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
        const scoredDocs = documents.map(doc => {
            const content = doc.content.toLowerCase();
            const title = (doc.metadata.title || '').toLowerCase();
            let score = 0;

            for (const word of queryWords) {
                // Fósforos exatos no título valem muito
                if (title.includes(word)) score += 5;
                
                // Ocorrências no corpo
                const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const matches = content.match(regex);
                if (matches) {
                    // Logaritmicamente para evitar que documentos longos com spam de palavras dominem
                    score += Math.log1p(matches.length);
                }
            }

            return { doc, score };
        });

        // Ordenar por score descendente
        scoredDocs.sort((a, b) => b.score - a.score);

        return scoredDocs.map(sd => sd.doc);
    }
}

/**
 * Reranker usando o LLM para avaliar a relevância (mais lento, porém mais preciso)
 */
export class LLMReranker implements Reranker {
    private llmProvider: LLMProvider;

    constructor(llmProvider: LLMProvider) {
        this.llmProvider = llmProvider;
    }

    async rerank(query: string, documents: Document[]): Promise<Document[]> {
        console.log(`[LLMReranker] Reranking ${documents.length} documentos usando LLM`);
        
        // Só rerankeamos os top 5 para não demorar demais
        const docsToRerank = documents.slice(0, 5);
        const remainingDocs = documents.slice(5);

        const promises = docsToRerank.map(async (doc) => {
            const prompt = `Avalie a relevância do documento abaixo para a pergunta do usuário.
Responda APENAS com um número de 0 a 10, onde 10 é extremamente relevante e 0 é irrelevante.

Pergunta: ${query}
Documento: ${doc.content.substring(0, 1000)}

Relevância (0-10):`;

            try {
                const response = await this.llmProvider.generate(prompt, { 
                    temperature: 0.1,
                    numPredict: 5
                });
                const score = parseInt(response.trim().match(/\d+/)?.[0] || '0', 10);
                return { doc, score };
            } catch (error) {
                console.error('[LLMReranker] Erro ao pontuar documento:', error);
                return { doc, score: 0 };
            }
        });

        const scoredDocs = await Promise.all(promises);
        scoredDocs.sort((a, b) => b.score - a.score);

        return [...scoredDocs.map(sd => sd.doc), ...remainingDocs];
    }
}
