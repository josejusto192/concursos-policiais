// Baixa uma imagem (link) para um arquivo, para o Claude abrir e olhar.
// Usado pelo revisor do /revisar-questoes (modo Supabase conectado).
// Uso: node scripts/revisao/imagem.mjs "<link>" revisao-trabalho/img/<nome>
import fs from 'node:fs';
import path from 'node:path';

const [link, destino] = process.argv.slice(2);
if (!link || !destino || !/^https?:\/\//i.test(link)) {
  console.error('Uso: node scripts/revisao/imagem.mjs "<link http(s)>" <arquivo-sem-extensão>');
  process.exit(1);
}
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
try {
  const res = await fetch(link);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const tipo = (res.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
  const arquivo = `${destino.replace(/\.[a-z0-9]+$/i, '')}.${EXT[tipo] ?? 'png'}`;
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, Buffer.from(await res.arrayBuffer()));
  console.log(arquivo);
} catch (err) {
  console.error(`NÃO ABRIU: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
