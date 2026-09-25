/**
 * Reranker for refining retrieved documents
 */

import type { Document } from '../documents/types';

export interface Reranker {
    rerank(query: string, documents: Document[]): Promise<Document[]>;
}

/**
 * Heuristic reranker based on textual relevance
 */
export class HeuristicReranker implements Reranker {
    async rerank(query: string, documents: Document[]): Promise<Document[]> {
        console.log(`[HeuristicReranker] Reranking ${documents.length} documents`);
        
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
        const scoredDocs = documents.map(doc => {
            const content = doc.content.toLowerCase();
            const title = (doc.metadata.title || '').toLowerCase();
            let score = 0;

            for (const word of queryWords) {
                // Exact title matches are weighted more
                if (title.includes(word)) score += 5;
                
                // Occurrences in content
                const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const matches = content.match(regex);
                if (matches) {
                    // Logarithmic to avoid spamming documents dominating
                    score += Math.log1p(matches.length);
                }
            }

            return { doc, score };
        });

        // Sort by descending score
        scoredDocs.sort((a, b) => b.score - a.score);

        return scoredDocs.map(sd => sd.doc);
    }
}
