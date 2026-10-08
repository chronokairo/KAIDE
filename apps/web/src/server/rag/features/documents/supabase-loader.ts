/**
 * @layer features/documents
 * @description Loader de documentos a partir do Supabase prod (tabela ops_documents).
 *
 * Substitui o TOTVSDocumentLoader (integração TOTVS removida): indexa os
 * documentos já sincronizados em ops_documents, isolados por organization_id.
 */

import { createHash } from 'crypto';
import { getSupabase, PROD_ORGANIZATION_ID } from '../../shared/lib/supabase.js';
import type { Document } from './types.js';

const PAGE_SIZE = 500;

interface OpsDocumentRow {
    id: string;
    title: string | null;
    content: string | null;
    category: string | null;
    document_date: string | null;
    synced_at: string | null;
}

export class SupabaseDocumentLoader {
    private organizationId: string;

    constructor(organizationId?: string) {
        this.organizationId = organizationId || process.env.CONTROL_PLANE_ORGANIZATION_ID || PROD_ORGANIZATION_ID;
    }

    async loadAllDocuments(): Promise<{ documents: Document[]; hash: string }> {
        const supabase = getSupabase();
        const documents: Document[] = [];
        const hashInput: string[] = [];

        let page = 0;
        for (;;) {
            const from = page * PAGE_SIZE;
            const { data, error } = await supabase
                .from('ops_documents')
                .select('id, title, content, category, document_date, synced_at')
                .eq('organization_id', this.organizationId)
                .order('synced_at', { ascending: false, nullsFirst: false })
                .range(from, from + PAGE_SIZE - 1);

            if (error) throw new Error(`Falha ao carregar ops_documents: ${error.message}`);
            const rows = (data || []) as OpsDocumentRow[];
            if (!rows.length) break;

            for (const row of rows) {
                const title = row.title || `Documento ${row.id}`;
                documents.push({
                    content: `# ${title}\n\n${row.content || ''}`,
                    metadata: {
                        source: 'supabase:ops_documents',
                        relativePath: `ops_documents/${row.id}`,
                        title,
                        folder: row.category || 'geral',
                        extension: 'md',
                    },
                });
                hashInput.push(`${row.id}:${row.synced_at || ''}`);
            }

            if (rows.length < PAGE_SIZE) break;
            page += 1;
        }

        const hash = createHash('sha256').update(hashInput.join('|')).digest('hex');
        return { documents, hash };
    }
}
