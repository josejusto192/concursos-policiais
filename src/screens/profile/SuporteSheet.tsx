import { useCallback, useEffect, useState } from 'react';
import Dialog from '../../components/Dialog';
import { criarTicket, fetchMeusTickets, type TicketRow } from '../../lib/queries';
import { logClientError } from '../../lib/errorLog';

const CATEGORIAS = ['Dúvida sobre o app', 'Problema técnico', 'Pagamento e assinatura', 'Sugestão', 'Outro'];

const STATUS_TICKET: Record<TicketRow['status'], { label: string; cor: string; fundo: string }> = {
  aberto: { label: 'Aberto', cor: '#8a6400', fundo: '#FFF6D6' },
  em_andamento: { label: 'Em andamento', cor: '#1557E6', fundo: '#EEF3FF' },
  resolvido: { label: 'Resolvido', cor: '#17784f', fundo: '#E9F7F0' },
  fechado: { label: 'Fechado', cor: '#6B7488', fundo: '#F4F6FC' },
};

export default function SuporteSheet({ usuarioId, onClose }: { usuarioId: string; onClose: () => void }) {
  const [aba, setAba] = useState<'novo' | 'meus'>('novo');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);

  const carregar = useCallback(() => {
    fetchMeusTickets(usuarioId)
      .then(setTickets)
      .catch((err) => {
        logClientError(err, 'fetchMeusTickets');
        setTickets([]);
      });
  }, [usuarioId]);

  useEffect(carregar, [carregar]);

  async function enviar() {
    if (mensagem.trim().length < 5) {
      setErro('Descreva em poucas palavras como podemos ajudar.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await criarTicket({ usuarioId, tipo: 'suporte', motivo: categoria, mensagem });
      setMensagem('');
      setEnviado(true);
      carregar();
    } catch (err) {
      logClientError(err, 'criarTicket suporte');
      setErro(err instanceof Error && err.message.includes('muitos chamados') ? err.message : 'Não foi possível enviar agora. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  const abertos = (tickets ?? []).filter((t) => t.status === 'aberto' || t.status === 'em_andamento').length;

  return (
    <Dialog title="Ajuda e suporte" onClose={onClose}>
      <div className="filter-tabs" role="tablist">
        <button role="tab" aria-selected={aba === 'novo'} className={aba === 'novo' ? 'active' : ''} onClick={() => setAba('novo')}>
          Novo chamado
        </button>
        <button role="tab" aria-selected={aba === 'meus'} className={aba === 'meus' ? 'active' : ''} onClick={() => setAba('meus')}>
          Meus chamados{abertos > 0 && <span className="nav-count">{abertos}</span>}
        </button>
      </div>

      {aba === 'novo' ? (
        enviado ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
            <div className="font-display text-[17px] font-extrabold text-ink">Chamado enviado ✓</div>
            <div className="font-sans text-[13px] font-semibold text-text2">
              Nossa equipe vai analisar. Acompanhe o status e a resposta em "Meus chamados".
            </div>
            <div className="mt-2 flex gap-4">
              <button onClick={() => setAba('meus')} className="font-sans text-[13px] font-extrabold text-blue">
                Ver meus chamados
              </button>
              <button onClick={() => setEnviado(false)} className="font-sans text-[13px] font-bold text-text3">
                Abrir outro
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="sup-cat" className="block font-sans text-[12px] font-bold text-text2">
              ASSUNTO
            </label>
            <select
              id="sup-cat"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1.5 h-[48px] w-full rounded-2xl border-[1.5px] border-border bg-[#F8FAFF] px-3 font-sans text-[16px] font-semibold text-ink"
            >
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="sup-msg" className="mt-4 block font-sans text-[12px] font-bold text-text2">
              COMO PODEMOS AJUDAR?
            </label>
            <textarea
              id="sup-msg"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Conte o que aconteceu ou o que você precisa."
              className="mt-1.5 w-full rounded-2xl border-[1.5px] border-border bg-[#F8FAFF] p-3.5 font-sans text-[16px] font-semibold text-ink outline-none"
            />
            {erro && (
              <div role="alert" className="mt-2 font-sans text-[12.5px] font-bold text-error">
                {erro}
              </div>
            )}
            <button onClick={enviar} disabled={enviando} className="button button-primary mt-3 w-full">
              {enviando ? 'Enviando…' : 'Enviar chamado'}
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2.5">
          {!tickets && <div className="py-4 text-center font-sans text-[13px] font-semibold text-text3">Carregando…</div>}
          {tickets?.length === 0 && (
            <div className="py-4 text-center font-sans text-[13px] font-semibold text-text3">Você ainda não abriu nenhum chamado.</div>
          )}
          {tickets?.map((t) => {
            const st = STATUS_TICKET[t.status];
            return (
              <div key={t.id} className="rounded-2xl border-[1.5px] border-border2 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-[13px] font-extrabold text-ink">
                    {t.tipo === 'questao' ? `Questão · ${t.motivo}` : t.motivo}
                  </span>
                  <span className="flex-none rounded-lg px-2 py-0.5 font-sans text-[11px] font-extrabold" style={{ color: st.cor, background: st.fundo }}>
                    {st.label}
                  </span>
                </div>
                <div className="mt-0.5 font-sans text-[11px] font-semibold text-text3">
                  #{t.id} · {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                </div>
                {t.mensagem && <div className="mt-1.5 whitespace-pre-line font-sans text-[12.5px] font-medium text-text2">{t.mensagem}</div>}
                {t.resposta && (
                  <div className="mt-2 rounded-xl bg-blue-tint p-2.5 font-sans text-[12.5px] font-semibold text-ink">
                    <div className="mb-0.5 text-[11px] font-extrabold text-blue">Resposta da equipe</div>
                    <div className="whitespace-pre-line">{t.resposta}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
