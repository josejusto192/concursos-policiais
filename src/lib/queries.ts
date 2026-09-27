import { supabase } from './supabase';
import { invokeEdgeFunction } from './edgeFunctions';
import type { Alternativa, Database, ModuloQuestaoRow } from './database.types';
import type { Questao } from '../data/types';
import type { AiMessage } from '../state/types';

export interface TrilhaRow {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  ativa: boolean;
  ordem: number;
  secao_nome: string | null;
}

export async function fetchTrilhas(): Promise<TrilhaRow[]> {
  const { data, error } = await supabase.from('trilhas').select('*').order('ordem');
  if (error) throw error;
  return data ?? [];
}

export interface ModuloRow {
  id: number;
  trilha_id: number;
  titulo: string;
  ordem: number;
  tipo: 'questoes' | 'aula';
  video_url: string | null;
  aula_id: number | null;
}

// Módulos tipo 'aula' apontam para a biblioteca de aulas (aula_id): o vídeo
// vem da aula, e modulos.video_url fica só como fallback legado.
export async function fetchModulos(trilhaId: number): Promise<ModuloRow[]> {
  // Desempate por id: mesma ordenação de modulo_liberado() (migration 022).
  const { data, error } = await supabase.from('modulos').select('*').eq('trilha_id', trilhaId).order('ordem').order('id');
  if (error) throw error;
  const modulos = data ?? [];
  const aulaIds = [...new Set(modulos.map((m) => m.aula_id).filter((id): id is number => id != null))];
  if (!aulaIds.length) return modulos;
  const { data: aulas, error: aulasError } = await supabase.from('aulas').select('id, video_url').in('id', aulaIds);
  if (aulasError) throw aulasError;
  const videoPorAula = new Map((aulas ?? []).map((a) => [a.id, a.video_url]));
  return modulos.map((m) => (m.aula_id != null ? { ...m, video_url: videoPorAula.get(m.aula_id) ?? m.video_url } : m));
}

export interface ModuloProgresso {
  acertos: number;
  total: number;
}

export async function fetchProgressoModulos(usuarioId: string, moduloIds: number[]): Promise<Map<number, ModuloProgresso>> {
  const map = new Map<number, ModuloProgresso>();
  if (!moduloIds.length) return map;
  const { data, error } = await supabase
    .from('progresso_modulos')
    .select('modulo_id, acertos, total')
    .eq('usuario_id', usuarioId)
    .in('modulo_id', moduloIds);
  if (error) throw error;
  for (const row of data ?? []) map.set(row.modulo_id, { acertos: row.acertos, total: row.total });
  return map;
}

export async function upsertProgressoModulo(usuarioId: string, moduloId: number, acertos: number, total: number) {
  const { error } = await supabase
    .from('progresso_modulos')
    .upsert({ usuario_id: usuarioId, modulo_id: moduloId, acertos, total }, { onConflict: 'usuario_id,modulo_id' });
  if (error) throw error;
}

function mapQuestaoRow(row: ModuloQuestaoRow): Questao {
  return {
    id: row.id,
    enunciado: row.enunciado ?? '',
    enunciado_html: row.enunciado_html ?? undefined,
    tem_imagem: row.tem_imagem,
    gabarito_letra: row.gabarito_letra ?? '',
    comentario: row.comentario ?? '',
    comentario_html: row.comentario_html ?? undefined,
    banca: row.banca ?? '',
    ano: row.ano ?? 0,
    orgao: row.orgao ?? undefined,
    orgao_nome: row.orgao_nome ?? undefined,
    cargo: row.cargo ?? undefined,
    disciplina: row.disciplina,
    nivel_escolaridade: row.nivel_escolaridade ?? undefined,
    tipo: row.tipo ?? undefined,
    anulada: row.anulada,
    desatualizada: row.desatualizada,
    alternativas: (row.alternativas ?? []).map((a: Alternativa) => ({
      letra: a.letra,
      texto: a.texto,
      html: a.html ?? undefined,
      correta: a.correta,
    })),
  };
}

// Conteúdo das questões escolhidas a dedo pelo admin para este módulo
// (via RPC — `questoes` em si só é legível por admin, ver migration 004).
export async function fetchQuestoesDoModulo(moduloId: number): Promise<Questao[]> {
  const { data, error } = await supabase.rpc('get_modulo_questoes', { p_modulo_id: moduloId });
  if (error) throw error;
  return (data ?? []).map(mapQuestaoRow);
}

// Tutor de IA: manda a questão atual (via edge function, que busca o
// conteúdo com service_role) + gabarito + se o aluno acertou como contexto.
export async function askTutorIA(input: {
  questaoId: string;
  duvida: string;
  historico: AiMessage[];
  alternativaSelecionada: string | null;
  acertou: boolean;
}): Promise<{ reply: string; creditos_restantes: number | null }> {
  const data = await invokeEdgeFunction<{ reply: string; creditos_restantes?: number }>('tutor-ia', {
    questao_id: input.questaoId,
    duvida: input.duvida,
    historico: input.historico,
    alternativa_selecionada: input.alternativaSelecionada,
    acertou: input.acertou,
  });
  return { reply: data.reply, creditos_restantes: data.creditos_restantes ?? null };
}

export interface CreditosTutor {
  limite: number;
  usados: number;
  restantes: number;
  assinante: boolean;
}

// Créditos do dia no tutor (1 mensagem = 1 crédito; limite menor pra quem
// não assina — migration 023).
export async function fetchMeusCreditosTutor(): Promise<CreditosTutor | null> {
  const { data, error } = await supabase.rpc('meus_creditos_tutor').maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Assinatura (Asaas) ----

export type PlanoRow = Database['public']['Tables']['planos']['Row'];

export async function fetchPlanos(): Promise<PlanoRow[]> {
  const { data, error } = await supabase.from('planos').select('*').eq('ativo', true).order('ordem');
  if (error) throw error;
  return data ?? [];
}

// CPF só é pedido aqui. Devolve o link da fatura (Pix/boleto/cartão) da 1ª
// cobrança; o acesso só é liberado quando o webhook confirmar o pagamento.
// Reativação (cancelou e voltou com acesso ainda válido): nada a pagar
// agora — devolve reativada + proximo_vencimento em vez do link da fatura.
export async function assinarPlano(
  planoId: number,
  cpf: string,
): Promise<{ invoice_url?: string; reativada?: boolean; proximo_vencimento?: string }> {
  return invokeEdgeFunction('asaas-assinar', { plano_id: planoId, cpf });
}

// Para as próximas cobranças; o acesso continua até o fim do período pago.
export async function cancelarAssinatura(): Promise<{ acesso_ate: string | null }> {
  return invokeEdgeFunction('asaas-cancelar', {});
}

export interface MinhaAssinatura {
  status: string;
  planoNome: string | null;
  valor: number | null;
  ciclo: string | null;
  proximoVencimento: string | null;
  // Fatura em aberto (1ª cobrança ainda não paga, ou mensalidade vencida).
  faturaPendente: string | null;
}

// Assinatura mais recente do aluno (RLS: só lê a própria) + fatura em aberto.
export async function fetchMinhaAssinatura(usuarioId: string): Promise<MinhaAssinatura | null> {
  const { data: assinatura, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!assinatura) return null;
  const [plano, pendente] = await Promise.all([
    assinatura.plano_id
      ? supabase.from('planos').select('nome').eq('id', assinatura.plano_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('pagamentos')
      .select('invoice_url')
      .eq('asaas_subscription_id', assinatura.asaas_subscription_id)
      .in('status', ['PENDING', 'OVERDUE'])
      .order('vencimento')
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    status: assinatura.status,
    planoNome: plano.data?.nome ?? null,
    valor: assinatura.valor,
    ciclo: assinatura.ciclo,
    proximoVencimento: assinatura.proximo_vencimento,
    faturaPendente: pendente.data?.invoice_url ?? null,
  };
}

export async function recordResposta(usuarioId: string, questaoId: string, acertou: boolean) {
  const { error } = await supabase.from('progresso_questoes').insert({ usuario_id: usuarioId, questao_id: questaoId, acertou });
  // A retomada de um módulo pode repetir uma questão já registrada: vale a
  // resposta mais recente (acertou no chute e depois errou → vai pro caderno
  // de erros), mas sem conceder XP de novo (retorna false).
  if (error?.code === '23505') {
    await atualizarRespostaErro(usuarioId, questaoId, acertou);
    return false;
  }
  if (error) throw error;
  return true;
}

// Respostas já gravadas do aluno para estas questões (pra retomar um módulo
// não concluído de onde parou). questao_id → acertou.
export async function fetchRespostas(usuarioId: string, questaoIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (!questaoIds.length) return map;
  const { data, error } = await supabase
    .from('progresso_questoes')
    .select('questao_id, acertou')
    .eq('usuario_id', usuarioId)
    .in('questao_id', questaoIds);
  if (error) throw error;
  for (const row of data ?? []) map.set(row.questao_id, row.acertou);
  return map;
}

// ---- Caderno de erros (por trilha, com "responder de novo") ----

export async function fetchContagemErros(trilhaId: number): Promise<number> {
  const { data, error } = await supabase.rpc('contar_minhas_questoes_erradas', { p_trilha_id: trilhaId });
  if (error) throw error;
  return data ?? 0;
}

export async function fetchQuestoesErradas(trilhaId: number): Promise<Questao[]> {
  const { data, error } = await supabase.rpc('get_minhas_questoes_erradas', { p_trilha_id: trilhaId });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapQuestaoRow(row),
    aula: row.aula_video_url ? { titulo: row.aula_titulo ?? 'Aula', video_url: row.aula_video_url } : undefined,
  }));
}

// "Responder de novo": atualiza a mesma linha (upsert, não insert — já existe
// desde a primeira resposta), então se acertar desta vez ela some do caderno.
export async function atualizarRespostaErro(usuarioId: string, questaoId: string, acertou: boolean) {
  const { error } = await supabase
    .from('progresso_questoes')
    .upsert(
      { usuario_id: usuarioId, questao_id: questaoId, acertou, respondido_em: new Date().toISOString() },
      { onConflict: 'usuario_id,questao_id' },
    );
  if (error) throw error;
}

export async function fetchDailyDone(usuarioId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('progresso_questoes')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .gte('respondido_em', startOfDay.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export interface StatsData {
  totalRespondidas: number;
  taxaAcerto: number;
  ultimos7Dias: number[];
  porDisciplina: { disciplina: string; pct: number }[];
}

export async function fetchStats(usuarioId: string): Promise<StatsData> {
  const [respostasResult, porDisciplinaResult] = await Promise.all([
    supabase.from('progresso_questoes').select('acertou, respondido_em').eq('usuario_id', usuarioId),
    supabase.rpc('get_meu_desempenho_por_disciplina'),
  ]);
  if (respostasResult.error) throw respostasResult.error;
  if (porDisciplinaResult.error) throw porDisciplinaResult.error;
  const rows = respostasResult.data ?? [];

  const totalRespondidas = rows.length;
  const taxaAcerto = totalRespondidas ? Math.round((rows.filter((r) => r.acertou).length / totalRespondidas) * 100) : 0;

  const today = new Date();
  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const key = day.toISOString().slice(0, 10);
    return rows.filter((r) => r.respondido_em.slice(0, 10) === key).length;
  });

  const porDisciplina = (porDisciplinaResult.data ?? []).map((d) => ({
    disciplina: d.disciplina,
    pct: d.total ? Math.round((d.acertos / d.total) * 100) : 0,
  }));

  return { totalRespondidas, taxaAcerto, ultimos7Dias, porDisciplina };
}

export interface RankingRow {
  id: string;
  nome: string;
  xp: number;
  streak: number;
}

export async function fetchRanking(): Promise<RankingRow[]> {
  const { data, error } = await supabase.rpc('get_ranking', { p_limit: 50 });
  if (error) throw error;
  return data ?? [];
}

// Código exibido ao usuário é "FOCO-XXXXXXXX" (prefixo de exibição + os 8
// primeiros caracteres do uuid, ver resolveReferralCode/referralCodeFor).
export function referralCodeFor(usuarioId: string): string {
  return `FOCO-${usuarioId.slice(0, 8).toUpperCase()}`;
}

export async function resolveReferralCode(code: string): Promise<string | null> {
  const suffix = code.replace(/^FOCO-/i, '');
  const { data, error } = await supabase.rpc('resolve_referral_code', { p_code: suffix });
  if (error) throw error;
  return data ?? null;
}

export interface ReferralRow {
  id: string;
  indicado_nome: string | null;
  status: 'pendente' | 'assinou';
  criado_em: string;
}

export async function fetchReferrals(usuarioId: string): Promise<ReferralRow[]> {
  const { data, error } = await supabase
    .from('indicacoes')
    .select('id, status, criado_em, indicado_user_id')
    .eq('indicador_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const ids = rows.map((r) => r.indicado_user_id).filter((id): id is string => !!id);
  const nomes = new Map<string, string | null>();
  if (ids.length) {
    const { data: usuariosData } = await supabase.from('usuarios').select('id, nome').in('id', ids);
    for (const u of usuariosData ?? []) nomes.set(u.id, u.nome);
  }

  return rows.map((r) => ({
    id: r.id,
    indicado_nome: r.indicado_user_id ? (nomes.get(r.indicado_user_id) ?? null) : null,
    status: r.status,
    criado_em: r.criado_em,
  }));
}

export async function registerReferral(indicadorId: string, indicadoUserId: string) {
  const { error } = await supabase.from('indicacoes').insert({ indicador_id: indicadorId, indicado_user_id: indicadoUserId });
  if (error) throw error;
}
