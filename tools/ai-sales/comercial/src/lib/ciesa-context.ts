import type { CiesaInfo } from '@/app/api/ciesa-info/route';

/**
 * Fetches CIESA institutional data from the internal API and returns a
 * formatted system prompt block for Anna to use as knowledge base.
 *
 * Called server-side (API routes) or client-side (chat page).
 */
export async function fetchCiesaContext(baseOrigin = ''): Promise<string> {
  try {
    const url = `${baseOrigin}/api/ciesa-info`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return buildFallbackContext();
    const data = (await res.json()) as CiesaInfo;
    return buildContext(data);
  } catch {
    return buildFallbackContext();
  }
}

function buildContext(d: CiesaInfo): string {
  const noticiasTxt =
    d.noticias.length > 0
      ? d.noticias.map((n) => `  - ${n.titulo} (${n.url})`).join('\n')
      : '  (sem notícias recentes disponíveis)';

  return `## Conhecimento Institucional — CIESA (atualizado: ${d.fetchedAt || 'estático'})

### Sobre o CIESA
${d.sobre}

### Contato
- Telefones: ${d.contato.telefones.join(', ')}
- E-mail: ${d.contato.email}
- WhatsApp / Pré-matrícula: ${d.contato.whatsapp}
- Endereços:
${d.contato.enderecos.map((e) => `  - ${e}`).join('\n')}

### Links Importantes
- Site: ${d.links.site}
- Portal do Aluno: ${d.links.portalAluno}
- Portal do Professor: ${d.links.portalProfessor}
- Minha Biblioteca: ${d.links.minhabiblioteca}
- Calendário Acadêmico 2026 (PDF): ${d.links.calendarioAcademico}
- Central de Documentos: ${d.links.centralDocumentos}
- Matrícula online: ${d.links.matricula}

### Cursos de Graduação
${d.cursos.graduacao.map((c) => `  - ${c}`).join('\n')}

### Cursos de Pós-Graduação
${d.cursos.posGraduacao.map((c) => `  - ${c}`).join('\n')}

### Formas de Ingresso
${d.formasIngresso.map((f) => `  - ${f}`).join('\n')}

### Bolsas e Financiamento
${d.bolsas.map((b) => `  - ${b}`).join('\n')}

### Notícias Recentes
${noticiasTxt}`;
}

function buildFallbackContext(): string {
  return `## Conhecimento Institucional — CIESA
O CIESA é um Centro Universitário em Manaus-AM, fundado em 1986.
- Site: https://ciesa.br
- Portal do Aluno: https://portal.wdedu.com.br/FrameHTML/web/app/edu/portaleducacional/login/
- Telefone: (92) 99350-2810 | E-mail: secretaria@ciesa.br`;
}
