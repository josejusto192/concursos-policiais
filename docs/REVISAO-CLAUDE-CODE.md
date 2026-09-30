# Revisão de comentários com o Claude Code (VS Code)

É o jeito mais rápido de revisar muitas questões. O Claude Code baixa um lote (até 50 por ciclo), revisa **várias questões em paralelo** com o revisor `revisor-questoes` e envia de volta. O banco confere cada revisão antes de gravar, com as mesmas travas do Cowork: imagens, tamanho mínimo, HTML seguro e nunca sobrescrever questão já revisada.

As questões aparecem no painel como **"Revisada (cowork)"**, com o seu usuário como revisor.

## Como funciona

1. `scripts/revisao/baixar.mjs` baixa o ciclo para `revisao-trabalho/lote/`. Cada questão ganha uma pasta com:
   - `questao.md`: enunciado, alternativas, gabarito, diretrizes e comentário original;
   - as imagens salvas como arquivos (`IMG1.png`… do comentário e `enunciado-img1.png`…), para o Claude olhar.
2. Os revisores escrevem `revisado.html` (ou `pular.txt` com o motivo) em cada pasta, vários ao mesmo tempo.
3. `scripts/revisao/enviar.mjs` envia tudo:
   - o que o banco aceitou vai para `revisao-trabalho/feitas/`;
   - o que ele recusou fica no lote com `erro.txt` explicando o motivo, e o Claude corrige.

A pasta `revisao-trabalho/` fica só no seu computador (fora do git). Ela serve de histórico do que foi feito.

## Preparar (uma vez)

1. **Banco:** a migration `037_revisao_por_script_com_login_admin.sql` precisa estar aplicada (além da 033 a 036). Ela deixa os scripts usarem o seu login de admin. Quem não é admin/editor continua sem acesso.
2. **Projeto no computador:** abra a pasta do projeto no VS Code, com a extensão do Claude Code, e rode `npm install` no terminal.
3. **Login:** copie `scripts/revisao/.env.exemplo` para `scripts/revisao/.env` e preencha:
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY`: os mesmos do app, a chave **pública**, a mesma que está no Vercel como `VITE_SUPABASE_ANON_KEY`;
   - `REVISOR_EMAIL` e `REVISOR_SENHA`: o seu login de admin ou editor no app.

   Esse arquivo não vai para o GitHub. **Não use a chave secreta (service_role).**
4. Teste no terminal: `node scripts/revisao/resumo.mjs`. Ele deve mostrar a tabela do que falta revisar.

## Usar

No Claude Code (dentro do VS Code), digite:

```
/revisar-questoes
```

Ele mostra o que falta, pergunta a disciplina, a banca e a quantidade, e começa. Também dá para passar direto:

```
/revisar-questoes 200 Matemática FGV
```

- No **primeiro ciclo** ele para, mostra 2 exemplos e pede a sua aprovação antes de enviar. Depois segue sozinho, de 50 em 50.
- No fim, mostra quantas foram salvas, a lista das puladas com o motivo e quanto ainda falta.

### Mais rápido ainda
- Cada ciclo usa até 10 revisores em paralelo, com 5 questões cada. Rodadas grandes (200, 500) funcionam, mas consomem mais do seu limite de uso do Claude.
- Para usar um modelo mais rápido ou mais barato só nos revisores, adicione o campo `model:` no topo de `.claude/agents/revisor-questoes.md`.
- As permissões de `.claude/settings.json` já liberam os scripts e a pasta `revisao-trabalho/`, então o Claude não fica pedindo confirmação a cada passo.

## Questões puladas

Elas ficam registradas no banco com o motivo e não voltam nos próximos lotes. Para ver a lista, rode no SQL Editor:

`select p.motivo, p.pulada_em, q.id, q.disciplina from cowork_puladas p join questoes q on q.id = p.questao_id order by p.pulada_em desc;`

Depois de corrigir uma no painel, ou para ela voltar à fila: `delete from cowork_puladas where questao_id = '...';`

## Regras de escrita

Estão em `.claude/agents/revisor-questoes.md`, e são as mesmas do Cowork (`docs/REVISAO-COWORK.md`):
- parafrasear sem perder conteúdo;
- conferir o gabarito;
- tirar bibliografia, nomes de professores e sites;
- manter os marcadores `[[IMGn]]` e as fórmulas em `render-latex`;
- pular quando o comentário parece errado ou falta imagem.

Para mudar o estilo das revisões, edite esse arquivo.
