// Textos da marca num só lugar. Trocar aqui muda o app inteiro.
// As cores ficam em src/index.css (bloco :root). As poucas cores que o código
// precisa em hex (confete em canvas, avatares, conquistas) estão no fim deste
// arquivo — mantenha iguais às do index.css.
//
// Fora do app, a marca também aparece em: index.html, public/manifest.webmanifest,
// public/favicon.svg e os PNGs do PWA, e na persona do tutor de IA em
// supabase/functions/tutor-ia/index.ts (NOME_MASCOTE lá também).

export const MARCA = {
  nome: 'Tacta',
  nomeCompleto: 'Tacta Concursos',
  slogan: 'Estudo hoje. Conquistas amanhã.',
  chamada: 'Disciplina hoje. Grandes conquistas amanhã.',
  descricao: 'Trilhas de questões para concursos policiais',
  // Prefixo do código de indicação ("TACTA-XXXXXXXX")
  prefixoIndicacao: 'TACTA',
} as const;

// O mascote (cão K9) é quem conversa com o aluno no chat de dúvidas.
export const NOME_MASCOTE = 'Major';

// Cores em hex para onde CSS não alcança (canvas, transparência somada no fim).
export const HEX = {
  brand: '#D71938',
  brandLight: '#EF3C58',
  brandDark: '#9B0F27',
  ink: '#171717',
  inkSoft: '#3A3A3A',
  gold: '#F2B33D',
  goldShadow: '#C98A12',
  goldText: '#8A5D00',
  success: '#1FA463',
  gray: '#5C5C5C',
} as const;

// Fundo dos avatares com iniciais (ranking, indicações).
export const CORES_AVATAR = [HEX.ink, HEX.brand, HEX.inkSoft, HEX.goldText, HEX.success, HEX.gray, HEX.brandDark, HEX.goldShadow];
