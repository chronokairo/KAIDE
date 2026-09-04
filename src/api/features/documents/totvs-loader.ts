/**
 * @layer features/documents
 * @description Loader de documentos das APIs TOTVS
 * Transforma dados estruturados das APIs em documentos para RAG
 */

import type { Document } from './types.js';
import { getTOTVSClient } from '../api-client/client.js';
import { buscarAreas } from '../totvs/api/areas.js';
import { buscarOfertas, type Oferta } from '../totvs/api/ofertas.js';
import { buscarNiveis, buscarRankCurso, type RankCurso } from '../totvs/api/niveis.js';
import * as crypto from 'node:crypto';

export class TOTVSDocumentLoader {
    /**
     * Transforma dados de áreas em documentos
     */
    private async loadAreas(): Promise<Document[]> {
        try {
            const areas = await buscarAreas();
            return this.transformAreas(areas);
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar áreas:', error);
            return [];
        }
    }

    /**
     * Transforma array de áreas em documentos
     */
    private transformAreas(areas: any[]): Document[] {
        return areas.map((area) => ({
            content: `Área de Conhecimento: ${area.NOME}
Código da Área: ${area.CODAREA}

Esta área representa um campo de conhecimento acadêmico oferecido pela instituição.
Inclui cursos e formações relacionadas a ${area.NOME}, abrangendo disciplinas específicas desta área do conhecimento.
Os cursos nesta área proporcionam formação teórica e prática para atuação profissional em ${area.NOME}.
Características: Conhecimento especializado, metodologias específicas da área, aplicações práticas no mercado de trabalho.`,
            metadata: {
                source: 'totvs_areas',
                relativePath: `areas/${area.CODAREA}`,
                title: `Área: ${area.NOME}`,
                folder: 'areas',
                extension: 'api',
            },
        }));
    }

    /**
     * Transforma dados de ofertas em documentos
     */
    private async loadOfertas(): Promise<Document[]> {
        try {
            const ofertas = await buscarOfertas();
            return this.transformOfertas(ofertas);
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar ofertas:', error);
            return [];
        }
    }

    /**
     * Transforma array de ofertas em documentos
     */
    private transformOfertas(ofertas: any[]): Document[] {
        return ofertas.map((oferta) => ({
            content: `OFERTA DE CURSO DISPONÍVEL: ${oferta.CURSO || `Curso ${oferta.CODCURSO || 'N/A'}`}

=== IDENTIFICAÇÃO DO CURSO ===
Nome do Curso: ${oferta.CURSO || `Curso ${oferta.CODCURSO || 'N/A'}`}
Código: ${oferta.CODCURSO || 'N/A'}
Habilitação: ${oferta.TIPOHABILITACAO || 'Especialização específica'}

=== MODALIDADE E HORÁRIO ===
Modalidade de Ensino: ${oferta.NOMETIPOENSINO || 'Ensino regular'}
Período/Turno: ${oferta.TURNO || 'Horário a definir'}

=== VALORES E INVESTIMENTO ===
Mensalidade: R$ ${oferta.VAL_MENSAL_CURSO ? oferta.VAL_MENSAL_CURSO.toFixed(2) : '0.00'}
Forma de Pagamento: Mensal
Investimento Total: Conforme duração do curso

=== LOCALIZAÇÃO ===
Campus: ${oferta.CAMPUS_NOME || 'Campus principal'}
Cidade: ${oferta.CAMPUS_CIDADE || 'Manaus'}
Estado: Amazonas

=== SOBRE O CURSO ===

Este curso está disponível para matrícula na instituição Século Manaus, oferecendo formação acadêmica completa e reconhecida.

A habilitação especializada "${oferta.TIPOHABILITACAO || 'Especialização'}" prepara o aluno para atuação profissional qualificada na área, com conhecimentos teóricos e práticos essenciais para o mercado de trabalho.

As aulas ocorrem no período ${oferta.TURNO || 'a definir'}, com mensalidade no valor de R$ ${oferta.VAL_MENSAL_CURSO ? oferta.VAL_MENSAL_CURSO.toFixed(2) : '0.00'}, proporcionando flexibilidade para o estudante.

O curso é oferecido no ${oferta.CAMPUS_NOME || 'Campus principal'}, localizado em ${oferta.CAMPUS_CIDADE || 'Manaus'}, com infraestrutura completa para o desenvolvimento acadêmico.

PALAVRAS-CHAVE: curso ${oferta.CURSO || oferta.CODCURSO}, ${oferta.TIPOHABILITACAO}, ${oferta.NOMETIPOENSINO}, ${oferta.TURNO}, oferta ${oferta.CODCURSO}, graduação, formação, curso disponível, matrícula, valor, mensalidade, ${oferta.CAMPUS_CIDADE}`,
            metadata: {
                source: 'totvs_ofertas',
                relativePath: `ofertas/${oferta.CODCURSO || `oferta_${Math.random()}`}`,
                title: `Curso: ${oferta.CURSO || `Curso ${oferta.CODCURSO || 'N/A'}`}`,
                folder: 'ofertas',
                extension: 'api',
            },
        }));
    }

    /**
     * Transforma dados de níveis em documentos
     */
    private async loadNiveis(): Promise<Document[]> {
        try {
            const niveis = await buscarNiveis();
            return this.transformNiveis(niveis);
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar níveis:', error);
            return [];
        }
    }

    /**
     * Transforma array de níveis em documentos
     */
    private transformNiveis(niveis: any[]): Document[] {
        return niveis.map((nivel) => ({
            content: `Nível de Ensino: ${nivel.NIVEL_ENSINO}
Código: ${nivel.CODTIPOCURSO}
Descrição: O nível de ensino ${nivel.NIVEL_ENSINO} representa uma categoria educacional oferecida pela instituição.
Este nível inclui cursos de formação acadêmica e profissional nesta modalidade de ensino.
Características: Formação educacional estruturada, com disciplinas específicas do nível educacional.
Objetivo: Proporcionar conhecimento e habilidades adequadas ao nível ${nivel.NIVEL_ENSINO} de formação educacional.`,
            metadata: {
                source: 'totvs_niveis',
                relativePath: `niveis/${nivel.CODTIPOCURSO}`,
                title: `Nível: ${nivel.NIVEL_ENSINO}`,
                folder: 'niveis',
                extension: 'api',
            },
        }));
    }

    /**
     * Transforma ranking de cursos em documentos
     */
    private async loadRankCursos(): Promise<Document[]> {
        try {
            const ranking = await buscarRankCurso();
            return this.transformRanking(ranking);
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar ranking:', error);
            return [];
        }
    }

    /**
     * Transforma array de ranking em documentos
     */
    private transformRanking(ranking: any[]): Document[] {
        // Ordenar por QTD (quantidade) em ordem decrescente para criar ranking
        const rankingOrdenado = ranking.sort((a, b) => b.QTD - a.QTD);

        return rankingOrdenado.map((curso, index) => ({
            content: `Curso Popular #${index + 1}: ${curso.NOME}
Código do Curso: ${curso.CODCURSO}
Posição no Ranking de Popularidade: ${index + 1}º lugar
Quantidade de Interessados: ${curso.QTD}
Este curso está entre os mais procurados e demandados pelos alunos da instituição.
Características do curso: Formação acadêmica especializada em ${curso.NOME}.
Objetivo: Preparar profissionais qualificados na área de ${curso.NOME}.
Demanda: ${curso.QTD} interessado(s), indicando alta relevância no mercado educacional.
Disponibilidade: Oferta regular na instituição, com possibilidade de matrícula.`,
            metadata: {
                source: 'totvs_ranking',
                relativePath: `ranking/${curso.CODCURSO}`,
                title: `Ranking: ${curso.NOME}`,
                folder: 'ranking',
                extension: 'api',
            },
        }));
    }

    /**
     * Carrega grade curricular como documentos
     */
    private async loadGradeCurricular(): Promise<Document[]> {
        try {
            const client = getTOTVSClient();
            const result = await client.getGradeCurricular();

            if (!result.success || !result.data) {
                return [];
            }

            const grades = Array.isArray(result.data) ? result.data : [result.data];

            return grades.map((grade: any) => ({
                content: `Disciplina: ${grade.NOMEDISCIPLINA || grade.NOME || 'N/A'}
Código: ${grade.CODDISCIPLINA || grade.CODIGO || 'N/A'}
Curso: ${grade.NOMECURSO || 'N/A'}
Período: ${grade.PERIODO || 'N/A'}
Carga Horária: ${grade.CARGAHORARIA || 'N/A'}h
Créditos: ${grade.CREDITOS || 'N/A'}
Ementa: ${grade.EMENTA || 'Informação não disponível'}`,
                metadata: {
                    source: 'totvs_grade',
                    relativePath: `grade/${grade.CODDISCIPLINA || grade.CODIGO}`,
                    title: `Disciplina: ${grade.NOMEDISCIPLINA || grade.NOME || 'N/A'}`,
                    folder: 'grade',
                    extension: 'api',
                },
            }));
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar grade:', error);
            return [];
        }
    }

    /**
     * Carrega dados brutos da grade curricular
     */
    private async loadGradeCurricularRaw(): Promise<any[]> {
        try {
            const client = getTOTVSClient();
            const result = await client.getGradeCurricular();

            if (!result.success || !result.data) {
                return [];
            }

            return Array.isArray(result.data) ? result.data : [result.data];
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar grade raw:', error);
            return [];
        }
    }

    /**
     * Carrega informações de atendentes
     */
    private async loadAtendentes(): Promise<Document[]> {
        try {
            const atendentes = await this.loadAtendentesRaw();
            return this.transformAtendentes(atendentes);
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar atendentes:', error);
            return [];
        }
    }

    /**
     * Transforma array de grade curricular em documentos
     */
    private transformGrade(grades: any[]): Document[] {
        return grades.map((grade: any) => ({
            content: `Disciplina: ${grade.NOMEDISCIPLINA || grade.NOME || 'N/A'}
Código: ${grade.CODDISCIPLINA || grade.CODIGO || 'N/A'}
Curso: ${grade.NOMECURSO || 'N/A'}
Período: ${grade.PERIODO || 'N/A'}
Carga Horária: ${grade.CARGAHORARIA || 'N/A'}h
Créditos: ${grade.CREDITOS || 'N/A'}
Ementa: ${grade.EMENTA || 'Informação não disponível'}`,
            metadata: {
                source: 'totvs_grade',
                relativePath: `grade/${grade.CODDISCIPLINA || grade.CODIGO}`,
                title: `Disciplina: ${grade.NOMEDISCIPLINA || grade.NOME || 'N/A'}`,
                folder: 'grade',
                extension: 'api',
            },
        }));
    }

    /**
     * Transforma array de atendentes em documentos
     */
    private async transformAtendentes(atendentes: any[]): Promise<Document[]> {
        const client = getTOTVSClient();
        const atendenteDocuments: Document[] = [];

        // Coletar todos os históricos de todos os atendentes
        const todosHistoricos: any[] = [];

        // Documento com lista completa de todos os atendentes
        const listaAtendentes = atendentes.map((a: any) =>
            `${a.NOME} (${a.CODIGO}) - ${a.PERMISSAO}`
        ).join('\n- ');

        atendenteDocuments.push({
            content: `LISTA COMPLETA DE ATENDENTES DA INSTITUIÇÃO SÉCULO MANAUS

=== ATENDENTES CADASTRADOS ===

- ${listaAtendentes}

Total de Atendentes: ${atendentes.length}

=== INFORMAÇÕES GERAIS ===

Equipe de Atendimento: ${atendentes.length} profissionais especializados
Categorias: Administradores(ADMIN) e Atendentes Regulares(ATENDENTE)

A instituição Século Manaus conta com uma equipe de ${atendentes.length} atendentes qualificados para oferecer suporte completo aos alunos, candidatos e interessados nos processos seletivos e matrículas.

=== ESTRUTURA DA EQUIPE ===

Administradores(ADMIN):
- Acesso total ao sistema
- Gestão de processos seletivos
- Configurações e relatórios avançados
- Supervisão de equipe

Atendentes Regulares(ATENDENTE):
- Atendimento direto ao público
- Suporte a candidatos e alunos
- Registro de atendimentos
- Orientações sobre cursos e processos

Cada profissional possui código único de identificação e é especializado em diferentes áreas do processo seletivo, garantindo atendimento personalizado e eficiente.

PALAVRAS - CHAVE: atendentes, equipe, staff, colaboradores, profissionais, quem atende, responsáveis, lista de atendentes, todos os atendentes, atendimento ao aluno`,
            metadata: {
                source: 'totvs_atendentes_lista',
                relativePath: 'atendentes/lista-completa',
                title: 'Lista Completa de Atendentes',
                folder: 'atendentes',
                extension: 'api',
            },
        });

        for (const atendente of atendentes as any[]) {
            try {
                const historicoResult = await client.getHistoricoAtendimento(atendente.CODIGO);

                let historico: any[] = [];
                if (historicoResult.success && historicoResult.data) {
                    const rawData = historicoResult.data as any;
                    if (Array.isArray(rawData)) {
                        historico = rawData;
                    } else if (rawData.historico && Array.isArray(rawData.historico)) {
                        historico = rawData.historico;
                    } else if (typeof rawData === 'object' && !Array.isArray(rawData)) {
                        const arrayProp = Object.values(rawData).find(val => Array.isArray(val));
                        if (arrayProp && Array.isArray(arrayProp)) {
                            historico = arrayProp;
                        }
                    }
                }

                if (historico.length > 0) {
                    todosHistoricos.push(...historico);
                }

                atendenteDocuments.push({
                    content: `PERFIL PROFISSIONAL DO ATENDENTE: ${atendente.NOME}

=== DADOS CADASTRAIS ===
Nome Completo: ${atendente.NOME}
Código de Identificação: ${atendente.CODIGO}
Nível de Permissão: ${atendente.PERMISSAO}
Categoria: ${atendente.PERMISSAO === 'ADMIN' ? 'Administrador(a)' : 'Atendente Regular'}

=== DESCRIÇÃO DO CARGO ===

${atendente.NOME} é ${atendente.PERMISSAO === 'ADMIN' ? 'um(a) administrador(a)' : 'um(a) atendente regular'} da instituição Século Manaus, responsável por ${atendente.PERMISSAO === 'ADMIN' ? 'gerenciar o sistema, supervisionar processos seletivos e fornecer suporte avançado' : 'atender candidatos, orientar sobre cursos e processos, e registrar informações de atendimento'}.

=== RESPONSABILIDADES ===

Como ${atendente.PERMISSAO.toLowerCase()}, ${atendente.NOME} possui:
${atendente.PERMISSAO === 'ADMIN' ?
                            '- Acesso administrativo completo ao sistema\n- Permissão para gerenciar todas as operações\n- Capacidade de configurar processos seletivos\n- Autoridade para gerar relatórios avançados\n- Supervisão da equipe de atendimento' :
                            '- Permissão para atendimento direto ao público\n- Suporte personalizado a alunos e candidatos\n- Registro e acompanhamento de atendimentos\n- Orientação sobre cursos, processos e matrículas\n- Interface com candidatos durante processos seletivos'
                        }

=== ATUAÇÃO ===

O(a) profissional ${atendente.NOME} atua diretamente no atendimento institucional, sendo ponto de contato para candidatos e alunos que necessitam de informações, suporte ou orientação.

PALAVRAS - CHAVE: ${atendente.NOME}, atendente ${atendente.CODIGO}, ${atendente.PERMISSAO}, quem é, perfil, responsável, colaborador, profissional, contato`,
                    metadata: {
                        source: 'totvs_atendentes_perfil',
                        relativePath: `atendentes/${atendente.CODIGO}/perfil`,
                        title: `Perfil: ${atendente.NOME}`,
                        folder: 'atendentes',
                        extension: 'api',
                    },
                });

                if (historico && Array.isArray(historico) && historico.length > 0) {
                    const totalAtendimentos = historico.length;
                    const statusCounts = historico.reduce((acc: any, h: any) => {
                        acc[h.STATUS] = (acc[h.STATUS] || 0) + 1;
                        return acc;
                    }, {});

                    const areasInteresse = [...new Set(historico.map((h: any) => h.AREA_INTERESSES).filter(Boolean))];
                    const processos = [...new Set(historico.map((h: any) => h.PROCESSO).filter(Boolean))];

                    atendenteDocuments.push({
                        content: `ESTATÍSTICAS E MÉTRICAS DE ATENDIMENTO: ${atendente.NOME}

=== RESUMO EXECUTIVO ===
Atendente: ${atendente.NOME}
Código: ${atendente.CODIGO}
Total de Atendimentos Realizados: ${totalAtendimentos}

=== DISTRIBUIÇÃO POR STATUS ===
${Object.entries(statusCounts).map(([status, count]) => {
                            const percentage = Math.round((count as number / totalAtendimentos) * 100);
                            return `• ${status}: ${count} candidatos (${percentage}%)`;
                        }).join('\n')}

=== ÁREAS DE INTERESSE COBERTAS ===
Total de Áreas Diferentes: ${areasInteresse.length}
${areasInteresse.map(area => `• ${area}`).join('\n')}

=== PROCESSOS SELETIVOS ===
Número de Processos Participados: ${processos.length}
${processos.map(processo => `• ${processo}`).join('\n')}

=== ANÁLISE DE PERFORMANCE ===

${atendente.NOME} realizou ${totalAtendimentos} atendimentos completos, demonstrando experiência consolidada em ${areasInteresse.length} diferentes áreas de interesse e participação ativa em ${processos.length} processos seletivos distintos.

Cobertura de Atendimento:
• Diversidade de Áreas: ${areasInteresse.length} especializações
• Processos Gerenciados: ${processos.length} modalidades
• Volume Total: ${totalAtendimentos} atendimentos
• Média por Processo: ${Math.round(totalAtendimentos / Math.max(processos.length, 1))} atendimentos

Esta diversidade demonstra versatilidade e capacidade de atender diferentes perfis de candidatos em múltiplos contextos institucionais.

PALAVRAS-CHAVE: estatísticas ${atendente.NOME}, performance ${atendente.CODIGO}, métricas, desempenho, quantos atendimentos, histórico, resultados, números, dados, ${atendente.NOME} fez quantos atendimentos, atendimentos de ${atendente.NOME}, total de atendimentos ${atendente.NOME}, ${atendente.NOME} atendeu quantos, quantos ${atendente.NOME} atendeu`,
                        metadata: {
                            source: 'totvs_atendentes_estatisticas',
                            relativePath: `atendentes/${atendente.CODIGO}/estatisticas`,
                            title: `Estatísticas: ${atendente.NOME}`,
                            folder: 'atendentes',
                            extension: 'api',
                        },
                    });

                    for (const hist of historico as any[]) {
                        atendenteDocuments.push({
                            content: `REGISTRO DE ATENDIMENTO: ${atendente.NOME} → ${hist.CANDIDATO_NOME}

=== INFORMAÇÕES DO ATENDIMENTO ===
Atendente Responsável: ${atendente.NOME}
Código do Atendente: ${atendente.CODIGO}
Data do Registro: ${hist.DATAINSCRICAO}

=== DADOS DO CANDIDATO ===
Nome Completo: ${hist.CANDIDATO_NOME}
CPF: ${hist.CANDIDATO_CPF}
E-mail: ${hist.CANDIDATO_EMAIL}
Telefone: ${hist.TELEFONE}
Data de Nascimento: ${hist.CANDIDATO_DTNASCIMENTO}
Número de Inscrição: ${hist.CANDIDATO_NROINSCRICAO}

=== PROCESSO SELETIVO ===
Processo: ${hist.PROCESSO}
Área de Interesse: ${hist.AREA_INTERESSES}
Status Atual: ${hist.STATUS}
Data de Inscrição: ${hist.DATAINSCRICAO}

=== RESUMO DO ATENDIMENTO ===

O(a) atendente ${atendente.NOME} (código ${atendente.CODIGO}) foi responsável pelo atendimento do candidato ${hist.CANDIDATO_NOME} no processo seletivo "${hist.PROCESSO}".

O candidato demonstrou interesse específico na área "${hist.AREA_INTERESSES}" e atualmente encontra-se com status "${hist.STATUS}" no sistema.

Este registro documenta o acompanhamento personalizado realizado pela instituição Século Manaus para candidatos interessados em seus programas educacionais.

PALAVRAS-CHAVE: atendimento ${hist.CANDIDATO_NOME}, candidato ${hist.CANDIDATO_CPF}, inscrição ${hist.CANDIDATO_NROINSCRICAO}, ${atendente.NOME} atendeu, processo ${hist.PROCESSO}, ${hist.AREA_INTERESSES}, status ${hist.STATUS}`,
                            metadata: {
                                source: 'totvs_atendentes_candidatos',
                                relativePath: `atendentes/${atendente.CODIGO}/candidatos/${hist.CANDIDATO_NROINSCRICAO}`,
                                title: `Atendimento: ${hist.CANDIDATO_NOME}`,
                                folder: 'atendentes',
                                extension: 'api',
                            },
                        });
                    }
                }
            } catch (historicoError) {
                console.warn(`[TOTVSDocumentLoader] Erro ao buscar histórico para ${atendente.CODIGO}:`, historicoError);
            }
        }

        if (todosHistoricos.length > 0) {
            const matriculasPorCurso: Record<string, any[]> = {};
            const matriculasPorProcesso: Record<string, any[]> = {};
            const matriculasPorStatus: Record<string, any[]> = {};

            for (const hist of todosHistoricos) {
                const area = hist.AREA_INTERESSES || 'Não especificado';
                const processo = hist.PROCESSO || 'Não especificado';
                const status = hist.STATUS || 'Não especificado';

                if (!matriculasPorCurso[area]) matriculasPorCurso[area] = [];
                if (!matriculasPorProcesso[processo]) matriculasPorProcesso[processo] = [];
                if (!matriculasPorStatus[status]) matriculasPorStatus[status] = [];

                matriculasPorCurso[area].push(hist);
                matriculasPorProcesso[processo].push(hist);
                matriculasPorStatus[status].push(hist);
            }

            const cursosList = Object.entries(matriculasPorCurso)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([curso, matriculas], idx) =>
                    `${idx + 1}. ${curso}: ${matriculas.length} matrícula(s)`
                ).join('\n');

            atendenteDocuments.push({
                content: `RELATÓRIO CONSOLIDADO DE MATRÍCULAS POR CURSO/ÁREA DE INTERESSE

=== RESUMO GERAL ===
Total de Matrículas/Inscrições: ${todosHistoricos.length}
Total de Cursos/Áreas: ${Object.keys(matriculasPorCurso).length}
Total de Processos Seletivos: ${Object.keys(matriculasPorProcesso).length}

=== MATRÍCULAS POR CURSO/ÁREA DE INTERESSE ===

${cursosList}

=== RANKING DOS CURSOS MAIS PROCURADOS ===

Os cursos com maior número de matrículas são:
${Object.entries(matriculasPorCurso)
                        .sort((a, b) => b[1].length - a[1].length)
                        .slice(0, 10)
                        .map(([curso, matriculas], idx) => {
                            const percentual = ((matriculas.length / todosHistoricos.length) * 100).toFixed(1);
                            return `${idx + 1}º ${curso}: ${matriculas.length} alunos (${percentual}% do total)`;
                        }).join('\n')}

=== DISTRIBUIÇÃO POR STATUS ===

${Object.entries(matriculasPorStatus)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([status, matriculas]) => {
                            const percentual = ((matriculas.length / todosHistoricos.length) * 100).toFixed(1);
                            return `• ${status}: ${matriculas.length} (${percentual}%)`;
                        }).join('\n')}

=== MATRÍCULAS POR PROCESSO SELETIVO ===

${Object.entries(matriculasPorProcesso)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([processo, matriculas]) =>
                            `• ${processo}: ${matriculas.length} inscrição(ões)`
                        ).join('\n')}

=== ANÁLISE ===

A instituição Século Manaus possui ${todosHistoricos.length} matrículas/inscrições registradas, distribuídas em ${Object.keys(matriculasPorCurso).length} diferentes cursos/áreas de interesse.

O curso mais procurado é "${Object.entries(matriculasPorCurso).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}" com ${Object.entries(matriculasPorCurso).sort((a, b) => b[1].length - a[1].length)[0]?.[1]?.length || 0} matrículas.

PALAVRAS-CHAVE: matrículas por curso, quantas matrículas, total de matrículas, alunos por curso, turmas, quantidade de alunos, estatísticas, relatório, consolidado, quantos tem, quantas matriculas eu tenho, matrículas por área`,
                metadata: {
                    source: 'totvs_matriculas_consolidado',
                    relativePath: 'matriculas/consolidado-por-curso',
                    title: 'Matrículas Consolidadas por Curso',
                    folder: 'matriculas',
                    extension: 'api',
                },
            });

            for (const [curso, matriculas] of Object.entries(matriculasPorCurso)) {
                const candidatos = matriculas.map((m: any) =>
                    `• ${m.CANDIDATO_NOME} (${m.STATUS}) - Inscrição: ${m.CANDIDATO_NROINSCRICAO}`
                ).join('\n');

                atendenteDocuments.push({
                    content: `TURMA/CURSO: ${curso}

=== INFORMAÇÕES DA TURMA ===
Curso/Área: ${curso}
Total de Alunos Matriculados: ${matriculas.length}

=== LISTA DE ALUNOS/CANDIDATOS ===

${candidatos}

=== ESTATÍSTICAS DA TURMA ===

Total de alunos: ${matriculas.length}
Status mais comum: ${Object.entries(
                        matriculas.reduce((acc: any, m: any) => {
                            acc[m.STATUS] = (acc[m.STATUS] || 0) + 1;
                            return acc;
                        }, {})
                    ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'}

PALAVRAS-CHAVE: turma ${curso}, alunos ${curso}, quantos alunos tem ${curso}, matrículas ${curso}, ${matriculas.length} alunos`,
                    metadata: {
                        source: 'totvs_turma_curso',
                        relativePath: `turmas/${curso.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        title: `Turma: ${curso}`,
                        folder: 'turmas',
                        extension: 'api',
                    },
                });
            }
        }

        return atendenteDocuments;
    }

    /**
     * Carrega dados brutos dos atendentes
     */
    private async loadAtendentesRaw(): Promise<any[]> {
        try {
            const client = getTOTVSClient();
            const result = await client.getAtendentes();

            if (!result.success || !result.data) {
                return [];
            }

            // A API pode retornar os dados em 'data' ou 'atendentes'
            const dataArray = (result.data as any)?.atendentes || result.data;
            return Array.isArray(dataArray) ? dataArray : [dataArray];
        } catch (error) {
            console.error('[TOTVSDocumentLoader] Erro ao carregar atendentes raw:', error);
            return [];
        }
    }
    /**
     * Carrega todos os documentos de todas as APIs
     */
    async loadAllDocuments(): Promise<{ documents: Document[]; hash: string }> {
        console.log('[TOTVSDocumentLoader] Carregando dados de todas as APIs TOTVS...');

        const [areasData, ofertasData, niveisData, rankingData, gradeData, atendentesData] = await Promise.all([
            buscarAreas(),
            buscarOfertas(),
            buscarNiveis(),
            buscarRankCurso(),
            this.loadGradeCurricularRaw(),
            this.loadAtendentesRaw(),
        ]);

        // Combinar todos os dados para hash
        const allRawData = {
            areas: areasData,
            ofertas: ofertasData,
            niveis: niveisData,
            ranking: rankingData,
            grade: gradeData,
            atendentes: atendentesData,
        };

        const dataString = JSON.stringify(allRawData);
        const hash = crypto.createHash('md5').update(dataString).digest('hex');

        // Transformar em documentos
        const areas = this.transformAreas(areasData);
        const ofertas = this.transformOfertas(ofertasData);
        const niveis = this.transformNiveis(niveisData);
        const ranking = this.transformRanking(rankingData);
        const grade = this.transformGrade(gradeData);
        const atendentes = await this.transformAtendentes(atendentesData);

        const allDocuments = [
            ...areas,
            ...ofertas,
            ...niveis,
            ...ranking,
            ...grade,
            ...atendentes,
        ];

        console.log(`[TOTVSDocumentLoader] Total de documentos carregados: ${allDocuments.length}`);
        console.log(`  - Áreas: ${areas.length}`);
        console.log(`  - Ofertas: ${ofertas.length}`);
        console.log(`  - Níveis: ${niveis.length}`);
        console.log(`  - Ranking: ${ranking.length}`);
        console.log(`  - Grade: ${grade.length}`);
        console.log(`  - Atendentes: ${atendentes.length}`);

        return { documents: allDocuments, hash };
    }

    /**
     * Retorna um generator de documentos (compatível com DocumentLoader)
     */
    * loadAllDocumentsGenerator(): Generator<Document> {
        // Esta é uma versão síncrona que não pode fazer chamadas async
        // Use loadAllDocuments() para a versão async
        throw new Error('Use loadAllDocuments() for TOTVS loader - async required');
    }
}
