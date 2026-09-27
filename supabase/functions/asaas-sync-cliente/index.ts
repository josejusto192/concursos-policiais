// Edge Function: cria/atualiza o cliente do usuário no Asaas.
//
// Chamada pelo trigger trg_usuarios_sync_asaas (migration 020, via pg_net)
// sempre que nome/e-mail/WhatsApp/CPF mudam — nunca pelo navegador. Por
// isso roda sem JWT (deploy com --no-verify-jwt) e se protege com o
// cabeçalho x-sync-secret, que precisa bater com ASAAS_SYNC_SECRET.
//
// Secrets (supabase secrets set …):
//   ASAAS_API_KEY      chave da API do Asaas ($aact_…)
//   ASAAS_BASE_URL     https://api-sandbox.asaas.com/v3 (padrão) ou https://api.asaas.com/v3
//   ASAAS_SYNC_SECRET  mesmo valor do segredo 'asaas_sync_secret' no vault
//
// Resultado gravado em usuarios.asaas_customer_id / asaas_sincronizado_em /
// asaas_sync_erro; falhas também vão para client_errors ("Saúde do app").
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
const ASAAS_BASE_URL = (Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3').replace(/\/$/, '');
const ASAAS_SYNC_SECRET = Deno.env.get('ASAAS_SYNC_SECRET');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

interface AsaasCustomer {
  id: string;
}

async function asaas<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'foco-app/1.0.0',
      access_token: ASAAS_API_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let detalhe = text;
    try {
      const parsed = JSON.parse(text);
      detalhe = (parsed.errors ?? []).map((e: { description: string }) => e.description).join('; ') || text;
    } catch {
      // resposta não-JSON: mantém o texto cru
    }
    throw new Error(`Asaas ${method} ${path} → HTTP ${res.status}: ${detalhe}`);
  }
  return JSON.parse(text) as T;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  if (!ASAAS_SYNC_SECRET || req.headers.get('x-sync-secret') !== ASAAS_SYNC_SECRET) {
    return json({ error: 'Não autorizado' }, 401);
  }

  let usuarioId: string;
  try {
    ({ usuario_id: usuarioId } = await req.json());
  } catch {
    return json({ error: 'Corpo da requisição inválido' }, 400);
  }
  if (!usuarioId) return json({ error: 'usuario_id é obrigatório' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: usuario, error: uErr } = await admin
    .from('usuarios')
    .select('id, nome, email, whatsapp, cpf, asaas_customer_id')
    .eq('id', usuarioId)
    .single();
  if (uErr || !usuario) return json({ error: 'Usuário não encontrado' }, 404);

  try {
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada nas secrets da Edge Function.');

    // Só manda campo preenchido: no PUT, campo ausente = mantém o valor atual
    // no Asaas (vazio/null apagaria o dado de lá).
    const whatsappDigitos = (usuario.whatsapp ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    const payload: Record<string, string> = { name: usuario.nome?.trim() || usuario.email, externalReference: usuario.id };
    if (usuario.cpf) payload.cpfCnpj = usuario.cpf;
    if (usuario.email) payload.email = usuario.email;
    if (whatsappDigitos) payload.mobilePhone = whatsappDigitos;

    let customerId: string | null = usuario.asaas_customer_id;
    if (!customerId) {
      // O Asaas aceita cliente duplicado: antes de criar, procura um já
      // criado pra este usuário (ex.: dois disparos seguidos do trigger).
      const existentes = await asaas<{ data: AsaasCustomer[] }>(
        'GET',
        `/customers?externalReference=${encodeURIComponent(usuario.id)}`,
      );
      customerId = existentes.data?.[0]?.id ?? null;
    }

    if (customerId) {
      await asaas<AsaasCustomer>('PUT', `/customers/${customerId}`, payload);
    } else {
      if (!payload.cpfCnpj) return json({ ok: true, ignorado: 'sem CPF' });
      customerId = (await asaas<AsaasCustomer>('POST', '/customers', payload)).id;
    }

    await admin
      .from('usuarios')
      .update({ asaas_customer_id: customerId, asaas_sincronizado_em: new Date().toISOString(), asaas_sync_erro: null })
      .eq('id', usuario.id);
    return json({ ok: true, asaas_customer_id: customerId });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    await admin.from('usuarios').update({ asaas_sync_erro: mensagem.slice(0, 1000) }).eq('id', usuario.id);
    await admin.from('client_errors').insert({
      usuario_id: usuario.id,
      mensagem: mensagem.slice(0, 2000),
      contexto: 'asaas-sync-cliente',
    });
    return json({ error: mensagem }, 502);
  }
});
