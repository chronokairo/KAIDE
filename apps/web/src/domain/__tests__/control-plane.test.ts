import { describe, expect, it } from 'vitest';
import {
  buildApproachDraft,
  buildFollowUpDraft,
  buildPeriodicIdempotencyKey,
  canRetryJob,
  extractEmailAddress,
  isFollowUpDue,
  isTerminalEmailStatus,
  normalizeEmailStatus,
  scoreLead,
  EMAIL_SYNC_WINDOW_HOURS,
  FOLLOWUP_MIN_INTERVAL_DAYS,
  QUALIFY_SCORE_THRESHOLD,
} from '../control-plane';
import type { JobRecord, LeadResearch } from '../control-plane';

const DAY_MS = 24 * 60 * 60 * 1000;

function research(overrides: Partial<LeadResearch> = {}): LeadResearch {
  return {
    summary: 'Empresa de tecnologia com operação em escala.',
    sector: 'Tecnologia',
    sizeHint: '100-500 funcionários',
    signals: ['contratou time de dados', 'abriu nova filial', 'publicou vaga de automação'],
    sources: [
      { title: 'Site oficial', url: 'https://exemplo.com' },
      { title: 'LinkedIn', url: 'https://linkedin.com/exemplo' },
      { title: 'Notícia de expansão', url: 'https://news.exemplo.com' },
    ],
    researchedAt: '2026-10-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeEmailStatus', () => {
  it('mapeia os last_event conhecidos do Resend', () => {
    expect(normalizeEmailStatus('queued')).toBe('queued');
    expect(normalizeEmailStatus('delivery_delayed')).toBe('queued');
    expect(normalizeEmailStatus('sent')).toBe('sent');
    expect(normalizeEmailStatus('delivered')).toBe('delivered');
    expect(normalizeEmailStatus('opened')).toBe('opened');
    expect(normalizeEmailStatus('bounced')).toBe('bounced');
    expect(normalizeEmailStatus('complained')).toBe('complained');
  });

  it('normaliza caixa e trata ausência/valor desconhecido como unknown', () => {
    expect(normalizeEmailStatus('DELIVERED')).toBe('delivered');
    expect(normalizeEmailStatus(null)).toBe('unknown');
    expect(normalizeEmailStatus(undefined)).toBe('unknown');
    expect(normalizeEmailStatus('')).toBe('unknown');
    expect(normalizeEmailStatus('evento-novo-do-futuro')).toBe('unknown');
  });
});

describe('extractEmailAddress', () => {
  it('extrai o endereço nu de recipient com display name', () => {
    expect(extractEmailAddress('Marina <marina@acme.com.br>')).toBe('marina@acme.com.br');
  });

  it('normaliza recipient sem display name', () => {
    expect(extractEmailAddress('  Marina@Acme.com.br ')).toBe('marina@acme.com.br');
  });
});

describe('isTerminalEmailStatus', () => {
  it('marca entregues/abertos/bounces/complaints como terminais', () => {
    expect(isTerminalEmailStatus('delivered')).toBe(true);
    expect(isTerminalEmailStatus('opened')).toBe(true);
    expect(isTerminalEmailStatus('bounced')).toBe(true);
    expect(isTerminalEmailStatus('complained')).toBe(true);
  });

  it('mantém queued/sent/unknown como re-checáveis', () => {
    expect(isTerminalEmailStatus('queued')).toBe(false);
    expect(isTerminalEmailStatus('sent')).toBe(false);
    expect(isTerminalEmailStatus('unknown')).toBe(false);
  });
});

describe('isFollowUpDue', () => {
  const now = new Date('2026-10-03T12:00:00.000Z');

  it('é devido quando nunca houve contato', () => {
    expect(isFollowUpDue({}, now)).toBe(true);
  });

  it('não é devido antes da cadência mínima', () => {
    const sixDaysAgo = new Date(now.getTime() - 6 * DAY_MS).toISOString();
    expect(isFollowUpDue({ lastContactedAt: sixDaysAgo }, now)).toBe(false);
  });

  it('é devido ao atingir a cadência mínima', () => {
    const sevenDaysAgo = new Date(now.getTime() - FOLLOWUP_MIN_INTERVAL_DAYS * DAY_MS).toISOString();
    expect(isFollowUpDue({ lastContactedAt: sevenDaysAgo }, now)).toBe(true);
  });

  it('trata data inválida como devido (nunca perde follow-up por parse)', () => {
    expect(isFollowUpDue({ lastContactedAt: 'não-é-data' }, now)).toBe(true);
  });
});

describe('scoreLead', () => {
  it('base 40 sem sinais não qualifica', () => {
    const empty = research({ sector: undefined, sizeHint: undefined, signals: [], sources: [] });
    const result = scoreLead(empty, {});
    expect(result.score).toBe(40);
    expect(result.qualified).toBe(false);
    expect(result.rationale[0]).toContain('base 40');
  });

  it('soma todos os critérios e qualifica lead forte', () => {
    const result = scoreLead(research(), {
      contactEmail: 'diretor@empresa.com.br',
      contactRole: 'Diretor de TI',
      tier: 'A',
    });
    // 40 base + 10 tier A + 15 fontes + 10 setor + 5 porte + 10 role + 10 email + 10 sinais = 110 → cap 100
    expect(result.score).toBe(100);
    expect(result.qualified).toBe(true);
    expect(result.rationale).toHaveLength(8);
  });

  it('não pontua e-mail pessoal (gmail)', () => {
    const result = scoreLead(research(), { contactEmail: 'joao@gmail.com' });
    expect(result.rationale.some((r) => r.includes('e-mail corporativo'))).toBe(false);
  });

  it('tier B pontua menos que tier A', () => {
    const a = scoreLead(research(), { tier: 'A' });
    const b = scoreLead(research(), { tier: 'B' });
    expect(b.score).toBe(a.score - 5);
  });

  it('fontes insuficientes pontuam menos', () => {
    const three = scoreLead(research(), {});
    const one = scoreLead(research({ sources: [{ title: 'Site', url: 'https://x.com' }] }), {});
    expect(one.score).toBe(three.score - 10);
  });

  it('qualifica exatamente no threshold', () => {
    expect(QUALIFY_SCORE_THRESHOLD).toBe(60);
    const result = scoreLead(research({ signals: [], sizeHint: undefined }), { tier: 'A' });
    // 40 + 10 tier A + 15 fontes + 10 setor = 75 ≥ 60
    expect(result.qualified).toBe(true);
  });
});

describe('buildPeriodicIdempotencyKey', () => {
  it('usa a data UTC do dia — reexecutar no mesmo dia não duplica', () => {
    const key = buildPeriodicIdempotencyKey('commercial.daily', new Date('2026-10-03T23:30:00.000Z'));
    expect(key).toBe('commercial.daily:2026-10-03');
  });
});

describe('canRetryJob', () => {
  function job(status: JobRecord['status'], attempts: number): JobRecord {
    return {
      id: 'job-1',
      organizationId: 'org',
      type: 'commercial.daily',
      idempotencyKey: 'k',
      status,
      attempts,
      input: {},
      costUsd: 0,
      createdAt: '2026-10-03T00:00:00.000Z',
      updatedAt: '2026-10-03T00:00:00.000Z',
    };
  }

  it('permite retry de job failed abaixo do máximo', () => {
    expect(canRetryJob(job('failed', 1))).toBe(true);
    expect(canRetryJob(job('failed', 2))).toBe(true);
  });

  it('bloqueia retry no máximo de tentativas e em jobs não-falhos', () => {
    expect(canRetryJob(job('failed', 3))).toBe(false);
    expect(canRetryJob(job('completed', 1))).toBe(false);
    expect(canRetryJob(job('queued', 1))).toBe(false);
  });
});

describe('rascunhos de abordagem/follow-up', () => {
  it('abordagem menciona contato, empresa e sinais pesquisados', () => {
    const draft = buildApproachDraft(
      { contactName: 'Marina', companyName: 'Acme' },
      research()
    );
    expect(draft).toContain('Olá, Marina!');
    expect(draft).toContain('Acme');
    expect(draft).toContain('contratou time de dados');
    expect(draft).toContain('setor de Tecnologia');
  });

  it('abordagem sem nome de contato saúda a equipe', () => {
    const draft = buildApproachDraft({ companyName: 'Acme' }, research());
    expect(draft).toContain('Olá, equipe!');
  });

  it('follow-up é reengajamento sem sinais', () => {
    const draft = buildFollowUpDraft({ contactName: 'Marina', companyName: 'Acme' });
    expect(draft).toContain('retomar a conversa');
    expect(draft).toContain('Acme');
  });
});

describe('constantes de operação', () => {
  it('janela de sync de 24h e cadência de 7 dias', () => {
    expect(EMAIL_SYNC_WINDOW_HOURS).toBe(24);
    expect(FOLLOWUP_MIN_INTERVAL_DAYS).toBe(7);
  });
});
