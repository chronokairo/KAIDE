'use client';

interface TermsOfUseDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsOfUseDialog({ open, onClose }: TermsOfUseDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/50 px-4 py-6 sm:px-6 lg:px-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-4xl rounded-[28px] border border-outline-variant bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-on-surface-variant">Plataforma Anna</p>
            <h2 className="mt-1 font-headline-md text-2xl text-on-surface">Termos de uso e tratamento de dados</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar termos"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto chat-scrollbar px-6 py-6 space-y-5 text-sm leading-relaxed text-on-surface">
          <p>
            Ao utilizar a plataforma Anna, você declara ciência e concordância com os termos de uso, políticas
            internas e regras de atendimento aplicáveis ao ambiente digital da instituição.
          </p>

          <p>
            A Anna é uma assistente de atendimento e matrícula. Ela pode orientar sobre cursos, documentação,
            prazos, etapas do processo e encaminhamento de dados necessários para atendimento. O uso da plataforma
            não garante aprovação, matrícula concluída ou disponibilidade imediata de serviços externos.
          </p>

          <p>
            Os dados informados pelo usuário podem ser utilizados para autenticação, continuidade do atendimento,
            criação e manutenção de conversas, validação de elegibilidade, registro de solicitações e execução do
            fluxo de matrícula quando aplicável.
          </p>

          <p>
            Os campos de identificação, como nome, e-mail, CPF e idade, podem ser armazenados de forma segura para
            permitir continuidade da experiência entre sessões e prevenir inconsistências no atendimento. Quando
            documentos forem enviados, eles poderão ser processados para extração de informações estritamente
            necessárias ao atendimento ou matrícula.
          </p>

          <p>
            O usuário é responsável pela veracidade dos dados informados. Informações falsas, incompletas ou de
            terceiros podem impedir o prosseguimento do atendimento ou gerar invalidação de etapas do processo.
          </p>

          <p>
            Menores de idade não devem concluir o uso para matrícula sem a supervisão e autorização exigidas pelas
            regras internas e pela legislação aplicável. Quando houver coleta de dados sensíveis ou documentos, o
            fluxo poderá solicitar validações adicionais.
          </p>

          <p>
            A plataforma pode registrar logs operacionais, histórico de conversas, eventos de uso, anexos e
            respostas automatizadas para fins de auditoria, melhoria do serviço, suporte e segurança.
          </p>

          <p>
            O usuário concorda em não utilizar a plataforma para fins ilícitos, tentativa de fraude, envio de dados
            indevidos, manipulação de fluxos de matrícula ou qualquer uso que viole normas internas, direitos de
            terceiros ou a legislação aplicável.
          </p>

          <p>
            A instituição pode atualizar estes termos, as políticas de privacidade e os fluxos de tratamento de
            dados a qualquer momento, sem prejuízo das obrigações legais já existentes. O uso contínuo da plataforma
            após alterações implica aceitação da versão vigente.
          </p>

          <p>
            Caso você não concorde com estes termos, deve interromper o uso da plataforma e evitar o fornecimento de
            dados pessoais.
          </p>
        </div>
      </div>
    </div>
  );
}
