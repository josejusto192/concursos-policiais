import { PaperPlaneRight, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/AppStateContext';
import { askTutorIA, fetchMeusCreditosTutor, type CreditosTutor } from '../../lib/queries';
import { EdgeFunctionError } from '../../lib/edgeFunctions';
import { logClientError } from '../../lib/errorLog';
import type { Questao } from '../../data/types';
import ModalFrame from '../../components/ModalFrame';

interface AiTutorSheetProps {
  q: Questao;
  selected: string | null;
  acertou: boolean;
  onClose: () => void;
}

export default function AiTutorSheet({ q, selected, acertou, onClose }: AiTutorSheetProps) {
  const { state, dispatch } = useAppState();
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState<CreditosTutor | null>(null);
  const semCreditos = creditos !== null && creditos.restantes <= 0;

  useEffect(() => {
    fetchMeusCreditosTutor()
      .then(setCreditos)
      .catch((err) => logClientError(err, 'fetchMeusCreditosTutor'));
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || semCreditos || state.aiTyping) return;
    const historico = state.aiMessages;
    dispatch({ type: 'AI_SEND_USER', text });
    setInput('');
    try {
      const { reply, creditos_restantes } = await askTutorIA({ questaoId: q.id, duvida: text, historico, alternativaSelecionada: selected, acertou });
      dispatch({ type: 'AI_REPLY', text: reply });
      if (creditos_restantes !== null) setCreditos((c) => (c ? { ...c, restantes: creditos_restantes } : c));
    } catch (err) {
      // Limite diário é o único erro cuja mensagem o aluno deve ver; o resto
      // (chave do Gemini, rede, IA fora do ar) vira texto amigável e vai pro
      // log de erros do admin com o motivo real.
      const limiteDiario = err instanceof EdgeFunctionError && err.status === 429;
      if (limiteDiario) setCreditos((c) => (c ? { ...c, restantes: 0 } : c));
      if (!limiteDiario) {
        logClientError(err, `tutor-ia${err instanceof EdgeFunctionError ? ` (HTTP ${err.status ?? 'rede'})` : ''} · questão ${q.id}`);
      }
      dispatch({
        type: 'AI_REPLY',
        text: limiteDiario
          ? (err as Error).message
          : 'Ops, o tutor está indisponível no momento. Já avisamos a equipe — tente de novo mais tarde.',
      });
    }
  }

  return (
    <ModalFrame title="Tutor IA" onClose={onClose} sheet className="tutor-sheet">
      {(close) => (
        <div className="tutor-sheet-content bg-surface">
          <div className="flex flex-none items-center gap-3 border-b border-border2 p-[14px_18px]">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-blue font-display text-[15px] font-extrabold text-yellow">
              IA
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[15px] font-extrabold text-ink">Tutor IA</div>
              <div className="font-sans text-[11.5px] font-semibold text-text2">
                {creditos
                  ? `${creditos.restantes} de ${creditos.limite} mensagens restantes hoje`
                  : 'Sabe a questão, as alternativas e o comentário'}
              </div>
            </div>
            <button
              onClick={close}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] border-none bg-app-bg text-text2"
              aria-label="Fechar"
            >
              <X weight="bold" size={16} />
            </button>
          </div>
          <div className="scr flex flex-1 flex-col gap-2.5 overflow-y-auto p-[16px_16px_8px]">
            {state.aiMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[82%] p-[12px_14px] font-sans text-[13.5px] font-semibold leading-[1.5]"
                  style={{
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? '#1557E6' : '#F4F6FC',
                    color: m.role === 'user' ? '#fff' : '#0B1F4D',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {state.aiTyping && (
              <div className="inline-flex w-fit items-center gap-1 self-start rounded-2xl bg-app-bg p-[12px_14px]">
                <span className="h-1.5 w-1.5 animate-float-y rounded-full bg-text5" />
                <span className="h-1.5 w-1.5 animate-float-y rounded-full bg-text5" style={{ animationDelay: '.15s' }} />
                <span className="h-1.5 w-1.5 animate-float-y rounded-full bg-text5" style={{ animationDelay: '.3s' }} />
              </div>
            )}
          </div>
          {semCreditos ? (
            <div className="flex flex-none flex-col gap-2 border-t border-border2 p-[12px_16px_18px] text-center">
              <div className="font-sans text-[12.5px] font-bold text-text2">
                {creditos?.assinante
                  ? 'Seus créditos do tutor acabaram por hoje. Eles renovam à meia-noite.'
                  : 'Suas mensagens grátis de hoje acabaram. Assinantes conversam muito mais com o tutor.'}
              </div>
              {!creditos?.assinante && (
                <button onClick={() => navigate('/assinar')} className="button button-primary w-full">
                  Ver planos
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-none items-center gap-2.5 border-t border-border2 p-[12px_16px_18px]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Digite sua dúvida..."
                className="h-[46px] flex-1 rounded-2xl border-[1.5px] border-border bg-[#F8FAFF] px-3.5 font-sans text-[14px] font-semibold text-ink outline-none"
              />
              <button
                onClick={send}
                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-2xl border-none bg-blue text-white"
              >
                <PaperPlaneRight weight="fill" size={19} />
              </button>
            </div>
          )}
        </div>
      )}
    </ModalFrame>
  );
}
