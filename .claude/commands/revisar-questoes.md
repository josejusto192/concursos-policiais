---
description: Revisa em lote os comentários das questões do Foco usando o Supabase conectado (MCP), com revisores em paralelo
argument-hint: "[quantidade] [disciplina] [banca]"
---

Você vai coordenar a revisão em lote dos comentários de questões do app Foco, usando o Supabase conectado (MCP, ferramenta execute_sql). Guia: docs/REVISAO-CLAUDE-CODE.md.

Argumentos recebidos: $ARGUMENTS

## 0. Conferir a conexão
Se a ferramenta execute_sql do Supabase não estiver disponível, pare e diga ao usuário, em português simples:
"Digite /mcp, escolha **supabase**, clique em autenticar e entre com sua conta do Supabase no navegador. Depois digite /revisar-questoes de novo."

## 1. Combinar a rodada
- Rode `select * from public.cowork_resumo_pendentes();` e mostre uma tabela simples (disciplina, banca, pendentes, com imagem, puladas) e o total.
- Se os argumentos já disserem quantidade, disciplina e banca, use-os. Senão, pergunte numa mensagem só: qual disciplina (ou "todas"), qual banca (ou "todas") e quantas questões nesta rodada (sugira 50). Espere a resposta.

## 2. Revisar em ciclos de até 50
Repita até completar a quantidade combinada (ou até acabar):

1. Pegue os IDs do ciclo (N = o que falta, no máximo 50; use null para "todas", nomes exatamente como na tabela). Questões com imagem embutida ficam de fora (elas são feitas pelo modo scripts):
   ```sql
   select p.questao_id
   from public.cowork_proximas_questoes(N, 'DISCIPLINA' ou null, 'BANCA' ou null) p
   join public.questoes q on q.id = p.questao_id
   where coalesce(q.comentario_html, '') !~* '<img[^>]*src=.?data:';
   ```
   Se não vier nenhum ID, a rodada acabou.
2. Divida os IDs em grupos de 5 e dispare os subagentes `revisor-questoes-mcp` EM PARALELO (vários na mesma mensagem, até 10 de uma vez), passando a cada um a lista de IDs do seu grupo.
3. **Só no primeiro ciclo:** dispare primeiro UM subagente com 2 IDs, mostre os exemplos que ele devolver (original → revisado) e pergunte se pode continuar. Só siga com a aprovação. Nos ciclos seguintes, não pare.
4. Some quantas foram salvas e puladas.

## Regras
- Você (coordenador) só roda os dois SELECTs acima. Quem busca, salva e pula são os subagentes.
- Nunca rode comandos que alterem o banco além das funções cowork_* usadas pelos subagentes.
- Não faça commit de nada desta tarefa.

## 3. Relatório final
- Quantas questões foram salvas e quantas puladas nesta rodada.
- Tabela das puladas: ID e motivo.
- Rode de novo `select * from public.cowork_resumo_pendentes();` e mostre quanto ainda falta.
- Se houver questões com imagem embutida pendentes, avise que elas ficam para o modo scripts (/revisar-questoes-scripts).
