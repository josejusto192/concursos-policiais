import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  atualizarTicket,
  fetchEmailsUsuarios,
  fetchNomesUsuarios,
  fetchTickets,
  type TicketAdminRow,
  type TicketStatus,
} from '../lib/adminQueries';
import { useUsuario } from '../hooks/useUsuario';
import AdminLayout from './AdminLayout';

const STATUS: { value: TicketStatus; label: string; classe: string }[] = [
  { value: 'aberto', label: 'Aberto', classe: 'bg-amber-100 text-amber-700' },
  { value: 'em_andamento', label: 'Em andamento', classe: 'bg-blue-100 text-blue-700' },
  { value: 'resolvido', label: 'Resolvido', classe: 'bg-green-100 text-green-700' },
  { value: 'fechado', label: 'Fechado', classe: 'bg-gray-100 text-gray-600' },
];
const FILTROS = [
  { value: 'abertos', label: 'Em aberto' },
  { value: 'resolvidos', label: 'Resolvidos' },
  { value: 'todos', label: 'Todos' },
] as const;

// Tickets vêm do "Reportar questão" (tela da questão) e do "Ajuda e
// suporte" (perfil). Editor só enxerga os de questão (RLS, migration 025).
export default function AdminSuportePage() {
  const { usuario } = useUsuario();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['value']>('abertos');
  const [tipo, setTipo] = useState<'' | 'questao' | 'suporte'>('');
  const [tickets, setTickets] = useState<TicketAdminRow[] | null>(null);
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());
  const [emails, setEmails] = useState<Map<string, string>>(new Map());
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchTickets({ status: filtro, tipo: tipo || undefined });
      setTickets(rows);
      setRespostas(Object.fromEntries(rows.map((t) => [t.id, t.resposta ?? ''])));
      const ids = rows.map((t) => t.usuario_id).filter((id): id is string => !!id);
      const [n, e] = await Promise.all([fetchNomesUsuarios(ids).catch(() => new Map()), fetchEmailsUsuarios(ids)]);
      setNomes(n);
      setEmails(e);
    } catch {
      setError('Não foi possível carregar os chamados.');
    }
  }, [filtro, tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(t: TicketAdminRow, patch: { status?: TicketStatus; resposta?: string | null }) {
    setSalvando(t.id);
    setError(null);
    try {
      await atualizarTicket(t.id, patch);
      await carregar();
    } catch (err) {
      setError(err instanceof Error ? `Erro ao salvar o chamado #${t.id}: ${err.message}` : 'Erro ao salvar.');
    } finally {
      setSalvando(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-gray-900">Suporte</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="filter-tabs !pb-0" aria-label="Status">
            {FILTROS.map((f) => (
              <button key={f.value} className={filtro === f.value ? 'active' : ''} aria-pressed={filtro === f.value} onClick={() => setFiltro(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            aria-label="Tipo"
          >
            <option value="">Todos os tipos</option>
            <option value="questao">Problemas em questões</option>
            {usuario?.is_admin && <option value="suporte">Suporte</option>}
          </select>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Reportes de questões e chamados de suporte dos alunos. O aluno vê o status e a sua resposta em Perfil → Ajuda e suporte.
        {!usuario?.is_admin && ' Como editor, você vê só os reportes de questões.'}
      </p>

      {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}

      <div className="mt-4 flex flex-col gap-3">
        {!tickets && !error && <div className="text-gray-400">Carregando…</div>}
        {tickets?.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-400">Nenhum chamado por aqui. 🎉</div>
        )}
        {tickets?.map((t) => {
          const st = STATUS.find((s) => s.value === t.status)!;
          const resposta = respostas[t.id] ?? '';
          const respostaMudou = resposta.trim() !== (t.resposta ?? '');
          const ocupado = salvando === t.id;
          return (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400">#{t.id}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.tipo === 'questao' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}
                >
                  {t.tipo === 'questao' ? 'Questão' : 'Suporte'}
                </span>
                <span className="text-sm font-bold text-gray-900">{t.motivo}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${st.classe}`}>{st.label}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {t.usuario_id ? nomes.get(t.usuario_id) || 'Aluno' : 'Conta excluída'}
                {t.usuario_id && emails.get(t.usuario_id) && ` · ${emails.get(t.usuario_id)}`} ·{' '}
                {new Date(t.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {t.resolvido_em && ` · resolvido em ${new Date(t.resolvido_em).toLocaleDateString('pt-BR')}`}
              </div>
              {t.mensagem ? (
                <div className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{t.mensagem}</div>
              ) : (
                <div className="mt-2 text-xs italic text-gray-400">Sem comentário.</div>
              )}
              {t.questao_id && (
                <Link to={`/admin/questoes/${t.questao_id}`} className="mt-2 inline-block text-sm font-bold text-blue-600 hover:underline">
                  Abrir questão para corrigir ›
                </Link>
              )}

              <div className="mt-3">
                <label className="text-xs font-bold text-gray-500" htmlFor={`resp-${t.id}`}>
                  RESPOSTA AO ALUNO (opcional)
                </label>
                <textarea
                  id={`resp-${t.id}`}
                  value={resposta}
                  onChange={(e) => setRespostas((r) => ({ ...r, [t.id]: e.target.value }))}
                  rows={2}
                  maxLength={4000}
                  placeholder="Ex.: Obrigado! Corrigimos o gabarito."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={t.status}
                  disabled={ocupado}
                  onChange={(e) => salvar(t, { status: e.target.value as TicketStatus })}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  aria-label="Status do chamado"
                >
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  disabled={ocupado || !respostaMudou}
                  onClick={() => salvar(t, { resposta: resposta.trim() || null })}
                  className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                >
                  Salvar resposta
                </button>
                {t.status !== 'resolvido' && (
                  <button
                    disabled={ocupado}
                    onClick={() => salvar(t, { status: 'resolvido', ...(respostaMudou ? { resposta: resposta.trim() || null } : {}) })}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {respostaMudou ? 'Responder e resolver' : 'Marcar como resolvido'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
