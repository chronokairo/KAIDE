'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAnnaAuth } from '@/lib/anna-auth';
import TermsOfUseDialog from '@/components/TermsOfUseDialog';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/chat';
  const { auth: currentAuth, login, logout } = useAnnaAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Informe seu nome para acessar a Anna.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.');
      return;
    }

    const ageNumber = Number(age);
    if (!Number.isInteger(ageNumber) || ageNumber < 18) {
      setError('Informe uma idade válida de 18 anos ou mais.');
      return;
    }

    login({
      isAuthenticated: true,
      displayName: displayName.trim(),
      email: email.trim(),
      cpf: cpfDigits,
      age: String(ageNumber),
    });

    router.push(nextUrl);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(234,243,255,0.92)_40%,_rgba(219,232,255,0.98)_100%)] text-on-surface">
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-surface-container-lowest shadow-[0_20px_60px_rgba(16,24,40,0.12)] p-8 lg:p-12">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(28,58,93,0.05),rgba(16,185,129,0.06),rgba(255,255,255,0))]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm text-on-surface-variant shadow-sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="text-secondary"
                >
                  <g fill="currentColor">
                    <ellipse cx="12" cy="5.8" rx="2.2" ry="4.1" />
                    <ellipse cx="12" cy="18.2" rx="2.2" ry="4.1" />
                    <ellipse cx="5.8" cy="12" rx="4.1" ry="2.2" />
                    <ellipse cx="18.2" cy="12" rx="4.1" ry="2.2" />
                    <ellipse cx="7.7" cy="7.7" rx="2.1" ry="4" transform="rotate(-45 7.7 7.7)" />
                    <ellipse cx="16.3" cy="16.3" rx="2.1" ry="4" transform="rotate(-45 16.3 16.3)" />
                    <ellipse cx="16.3" cy="7.7" rx="2.1" ry="4" transform="rotate(45 16.3 7.7)" />
                    <ellipse cx="7.7" cy="16.3" rx="2.1" ry="4" transform="rotate(45 7.7 16.3)" />
                  </g>
                  <circle cx="12" cy="12" r="2.6" fill="#ffffff" />
                </svg>
              </div>
              <div className="max-w-xl space-y-4">
                <h1 className="font-headline-lg text-4xl md:text-6xl leading-tight text-primary">
                  Converse com a Anna. Faça matrícula só com acesso.
                </h1>
                <p className="text-body-lg text-on-surface-variant max-w-2xl">
                  Sem login, você continua conversando normalmente com a Anna.
                  Para iniciar matrícula, revisar documentos e concluir o processo, o acesso autenticado é obrigatório.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                {[
                  ['chat', 'Conversar livremente'],
                  ['verified_user', 'Liberar matrícula'],
                  ['attach_file', 'Enviar documentos'],
                ].map(([icon, label]) => (
                  <div key={label} className="rounded-2xl border border-outline-variant/30 bg-white/80 backdrop-blur p-4 shadow-sm">
                    <span className="material-symbols-outlined text-secondary mb-3 block">{icon}</span>
                    <p className="font-medium text-on-surface">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5 text-sm text-on-surface-variant">
                <p className="font-medium text-on-surface mb-1">Modo visitante</p>
                <p>
                  Você pode entrar no chat sem autenticação. Nesse modo, a Anna conversa e orienta, mas não conclui matrícula.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] bg-surface-container-lowest border border-outline-variant/40 shadow-[0_20px_60px_rgba(16,24,40,0.14)] p-8 lg:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.22em] text-on-surface-variant mb-2">Entrar na Anna</p>
              <h2 className="font-headline-md text-3xl text-on-surface">Acesso para matrícula</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Autentique-se para habilitar o fluxo de matrícula dentro do chat.
              </p>
            </div>

            {currentAuth.isAuthenticated ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-secondary/20 bg-secondary-container/30 p-5">
                  <p className="font-medium text-on-surface">Você já está logado</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {currentAuth.displayName} · {currentAuth.email}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    CPF {currentAuth.cpf} · {currentAuth.age} anos
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={nextUrl}
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white font-medium hover:opacity-90 transition"
                  >
                    Ir para o chat
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                    }}
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-outline-variant px-5 py-3 text-on-surface font-medium hover:bg-surface-container transition"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-on-surface-variant mb-2">
                    Nome
                  </label>
                  <input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-2">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-on-surface-variant mb-2">
                    CPF
                  </label>
                  <input
                    id="cpf"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-on-surface-variant mb-2">
                    Idade
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="18"
                    step="1"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="18"
                    className="w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline text-left"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Ler termos de uso da plataforma e tratamento de dados
                </button>

                {error && (
                  <div className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white font-medium hover:opacity-90 transition"
                  >
                    Entrar e liberar matrícula
                  </button>
                  <Link
                    href="/chat"
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-outline-variant px-5 py-3 text-on-surface font-medium hover:bg-surface-container transition"
                  >
                    Continuar sem login
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
      <TermsOfUseDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </main>
  );
}
