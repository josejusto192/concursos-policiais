// Mascote da Tacta: o K9 (pastor preto e caramelo), desenhado em partes para
// animar só com CSS (delight.css). Cada humor muda olhos, sobrancelhas, boca,
// orelhas e pose; `key={mood}` reinicia a animação quando o humor muda.
// Abaixo de 72 px aparece só a cabeça, para a expressão continuar legível.
//
//   idle       parado: respira, pisca, mexe a orelha
//   thinking   pensando: pata no queixo (carregamento, tutor)
//   happy      feliz: acertou
//   celebrate  comemorando: fim de lição
//   encourage  focado: errou ("bora de novo"), nunca bravo
//   wave       acenando: boas-vindas e lembretes
//   sad        decepcionado: perdeu a ofensiva
//   surprised  surpreso: conquista, recorde
//   tired      cansado: sessão muito longa
export type MascotMood = 'idle' | 'thinking' | 'happy' | 'celebrate' | 'encourage' | 'wave' | 'sad' | 'surprised' | 'tired';

interface Pelagem {
  cabeca: string;
  orelha: string;
  orelhaDentro: string;
  focinho: string;
  sobrancelha: string;
  mascara: string | null; // faixa escura no meio da testa
  pata: string;
  dedos: string;
  olhoFechado: string; // cor do arco dos olhos fechados (feliz)
  palpebra: string | null; // contorno da pálpebra
  brilho: number;
}

const PELAGENS: Record<'preto' | 'caramelo' | 'lobo', Pelagem> = {
  preto: {
    cabeca: '#272422', orelha: '#272422', orelhaDentro: '#4d443d', focinho: '#d38c48', sobrancelha: '#df9a55', mascara: null,
    pata: '#d38c48', dedos: '#94592a', olhoFechado: '#f6f1e8', palpebra: null, brilho: 0.07,
  },
  caramelo: {
    cabeca: '#cf8c4a', orelha: '#2b2420', orelhaDentro: '#5c4535', focinho: '#f3dbbb', sobrancelha: '#2b2420', mascara: '#2b2420',
    pata: '#efc08b', dedos: '#9a6230', olhoFechado: '#2b2420', palpebra: '#3a2416', brilho: 0.14,
  },
  lobo: {
    cabeca: '#8e8984', orelha: '#3c3835', orelhaDentro: '#625b55', focinho: '#e0dbd4', sobrancelha: '#2c2826', mascara: '#3c3835',
    pata: '#d2ccc4', dedos: '#6e6862', olhoFechado: '#2c2826', palpebra: '#2c2826', brilho: 0.12,
  },
};
// Pelagem em uso. Para trocar, use 'caramelo' ou 'lobo'.
const P = PELAGENS.preto;

type Boca = 'neutra' | 'sorriso' | 'firme' | 'triste' | 'lado' | 'cansada' | 'aberta' | 'festa' | 'o';
interface Olho {
  feliz?: boolean; // olhos fechados em arco
  palpebra?: [number, number]; // altura da pálpebra no canto de fora e no de dentro (relativa ao centro)
  rx?: number;
  ry?: number;
  pupila?: number;
  olhar?: [number, number]; // deslocamento das pupilas
}
interface Humor {
  sobrancelhas: [[number, number], [number, number]]; // [fora, dentro] da esquerda e da direita
  olho: Olho;
  boca: Boca;
  orelhas: [number, number]; // graus que cada orelha cai para fora
  inclina?: number;
  desce?: number;
  pose?: 'acena' | 'comemora' | 'queixo';
  efeito?: 'alerta' | 'gota';
}

const HUMORES: Record<MascotMood, Humor> = {
  idle: { sobrancelhas: [[69, 68], [69, 68]], olho: {}, boca: 'neutra', orelhas: [0, 0] },
  thinking: { sobrancelhas: [[63, 62], [69, 71]], olho: { olhar: [3, -3] }, boca: 'lado', orelhas: [0, 16], inclina: -5, pose: 'queixo' },
  happy: { sobrancelhas: [[66, 64], [66, 64]], olho: { feliz: true }, boca: 'aberta', orelhas: [0, 0] },
  celebrate: { sobrancelhas: [[63, 61], [63, 61]], olho: { feliz: true }, boca: 'festa', orelhas: [-6, -6], pose: 'comemora' },
  encourage: { sobrancelhas: [[64, 72], [64, 72]], olho: { palpebra: [-3, 1], olhar: [0, 1] }, boca: 'firme', orelhas: [-4, -4] },
  wave: { sobrancelhas: [[67, 66], [67, 66]], olho: { palpebra: [-6, -6] }, boca: 'sorriso', orelhas: [4, 0], inclina: 5, pose: 'acena' },
  sad: { sobrancelhas: [[71, 62], [71, 62]], olho: { palpebra: [-1, -6], olhar: [0, 2.5] }, boca: 'triste', orelhas: [30, 30], desce: 3 },
  surprised: { sobrancelhas: [[59, 58], [59, 58]], olho: { rx: 11.5, ry: 10.5, pupila: 3.8 }, boca: 'o', orelhas: [-6, -6], efeito: 'alerta' },
  tired: { sobrancelhas: [[71, 69], [71, 69]], olho: { palpebra: [1, 1], olhar: [0, 2.5] }, boca: 'cansada', orelhas: [34, 34], desce: 4, efeito: 'gota' },
};

const ORELHA_E = 'M60 80C52 60 47 36 51 22C53 13 61 11 67 16C79 27 89 41 94 57Z';
const ORELHA_E_DENTRO = 'M65 70C60 55 57 39 59 29C60 24 64 23 67 26C76 35 83 45 87 56Z';
const ORELHA_D = 'M140 80C148 60 153 36 149 22C147 13 139 11 133 16C121 27 111 41 106 57Z';
const ORELHA_D_DENTRO = 'M135 70C140 55 143 39 141 29C140 24 136 23 133 26C124 35 117 45 113 56Z';
const CABECA = 'M100 44C129 44 149 61 152 88C155 112 147 132 130 143C118 151 82 151 70 143C53 132 45 112 48 88C51 61 71 44 100 44Z';
const FOCINHO = 'M67 113C69 99 84 95 100 95C116 95 131 99 133 113C135 131 121 148 100 148C79 148 65 131 67 113Z';
const MASCARA = 'M94.5 60C96 57 104 57 105.5 60L108.5 99C105 102 95 102 91.5 99Z';
const NARIZ = 'M86 101C86 95 114 95 114 101C114 109 106 114 100 114C94 114 86 109 86 101Z';
const OLHOS: Array<[number, number, number]> = [
  [79, 84, -1], // [x, y, lado]: lado -1 = olho da esquerda (canto de dentro à direita)
  [121, 84, 1],
];
const LINHA = '#3a2416';
const BOCA_DENTRO = '#4a1219';
const LINGUA = '#e0566a';

function Olhos({ olho }: { olho: Olho }) {
  if (olho.feliz) {
    return (
      <g className="m-eyes-closed" stroke={P.olhoFechado} strokeWidth="5" strokeLinecap="round" fill="none">
        {OLHOS.map(([x, y]) => (
          <path key={x} d={`M${x - 10} ${y + 3}Q${x} ${y - 9} ${x + 10} ${y + 3}`} />
        ))}
      </g>
    );
  }
  const rx = olho.rx ?? 10.5;
  const ry = olho.ry ?? 9;
  const pupila = olho.pupila ?? 5.2;
  const [ox, oy] = olho.olhar ?? [0, 0.5];
  return (
    <g className="m-eyes">
      {OLHOS.map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill="#faf7f2" />
      ))}
      <g className="m-pupils">
        {OLHOS.map(([x, y]) => (
          <g key={x}>
            <circle cx={x + ox} cy={y + oy} r={pupila} fill="#2b1a0e" />
            <circle cx={x + ox + 1.8} cy={y + oy - 2} r="1.8" fill="#fff" />
          </g>
        ))}
      </g>
      {olho.palpebra &&
        OLHOS.map(([x, y, lado]) => {
          const dentro = x - lado * 11;
          const fora = x + lado * 11;
          const yFora = y + olho.palpebra![0];
          const yDentro = y + olho.palpebra![1];
          return (
            <g key={x}>
              <path d={`M${fora} ${y - 13}L${dentro} ${y - 13}L${dentro} ${yDentro}L${fora} ${yFora}Z`} fill={P.cabeca} />
              {P.palpebra && (
                <path d={`M${fora} ${yFora}L${dentro} ${yDentro}`} stroke={P.palpebra} strokeWidth="2.6" strokeLinecap="round" />
              )}
            </g>
          );
        })}
    </g>
  );
}

function BocaK9({ tipo }: { tipo: Boca }) {
  const traco = (d: string) => <path d={d} stroke={LINHA} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  switch (tipo) {
    case 'sorriso':
      return <g className="m-mouth">{traco('M100 114V120M84 119C90 129 98 128 100 120C102 128 110 129 116 119')}</g>;
    case 'firme':
      return <g className="m-mouth">{traco('M100 114V120M88 125C95 127 105 126 113 120')}</g>;
    case 'triste':
      return <g className="m-mouth">{traco('M100 114V121M87 130C93 123 107 123 113 130')}</g>;
    case 'lado':
      return <g className="m-mouth">{traco('M100 114V120M91 127C97 128 104 126 110 122')}</g>;
    case 'cansada':
      return <g className="m-mouth">{traco('M100 114V121M90 127C94 124 97 129 100 126C103 123 106 128 110 126')}</g>;
    case 'aberta':
      return (
        <g className="m-mouth">
          {traco('M100 114V119')}
          <path d="M83 119C87 138 113 138 117 119C109 123 91 123 83 119Z" fill={BOCA_DENTRO} />
          <path d="M91 127C93 135 107 135 109 127C104 125 96 125 91 127Z" fill={LINGUA} />
        </g>
      );
    case 'festa':
      return (
        <g className="m-mouth">
          {traco('M100 114V117')}
          <path d="M80 117C84 144 116 144 120 117C110 122 90 122 80 117Z" fill={BOCA_DENTRO} />
          <path d="M89 128C91 139 109 139 111 128C105 125.5 95 125.5 89 128Z" fill={LINGUA} />
        </g>
      );
    case 'o':
      return (
        <g className="m-mouth">
          {traco('M100 114V118')}
          <ellipse cx="100" cy="127" rx="6.5" ry="8" fill={BOCA_DENTRO} />
        </g>
      );
    default:
      return <g className="m-mouth">{traco('M100 114V120M87 121C92 127 98 126 100 120C102 126 108 127 113 121')}</g>;
  }
}

function Dedos({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 6} ${y - 7}v5M${x} ${y - 9}v6M${x + 6} ${y - 7}v5`}
      stroke={P.dedos}
      strokeWidth="2"
      strokeLinecap="round"
    />
  );
}

function Pose({ pose }: { pose: Humor['pose'] }) {
  const braco = (d: string) => <path d={d} stroke={P.cabeca} strokeWidth="19" strokeLinecap="round" />;
  if (pose === 'acena')
    return (
      <g className="m-paw">
        {braco('M150 200C152 180 156 150 160 128')}
        <ellipse cx="161" cy="120" rx="13" ry="12" fill={P.pata} />
        <Dedos x={161} y={120} />
        <path className="m-wave-line" d="M181 106C186 114 186 124 181 132" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </g>
    );
  if (pose === 'comemora')
    return (
      <g className="m-paw">
        {braco('M148 200C152 170 160 130 166 100')}
        <ellipse cx="167" cy="92" rx="13" ry="12" fill={P.pata} />
        <Dedos x={167} y={92} />
      </g>
    );
  if (pose === 'queixo')
    return (
      <g className="m-paw">
        {braco('M56 200C66 184 80 166 92 153')}
        <ellipse cx="98" cy="148" rx="14" ry="11" fill={P.pata} />
        <path d="M91 142v5M98 140v6M105 142v5" stroke={P.dedos} strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  return null;
}

function Efeitos({ humor }: { humor: Humor }) {
  return (
    <>
      {humor.pose === 'comemora' && (
        <g className="m-sparkles" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round">
          <path className="m-spark s1" d="M180 70L188 60" />
          <path className="m-spark s2" d="M187 88L198 86" />
          <path className="m-spark s3" d="M165 69L164 57" />
        </g>
      )}
      {humor.pose === 'queixo' && (
        <g className="m-thought" fill="#a3a39c">
          <circle className="m-dot d1" cx="152" cy="38" r="3.2" />
          <circle className="m-dot d2" cx="164" cy="27" r="4.6" />
        </g>
      )}
      {humor.efeito === 'alerta' && (
        <g className="m-sparkles" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round">
          <path className="m-spark s1" d="M158 46L167 37" />
          <path className="m-spark s2" d="M161 60L172 57" />
          <path className="m-spark s3" d="M154 32L156 21" />
        </g>
      )}
      {humor.efeito === 'gota' && <path className="m-drop" d="M152 48C158 58 158 64 152 64C146 64 146 58 152 48Z" fill="#8fb3d9" />}
    </>
  );
}

export default function Mascot({ mood = 'idle', size = 120, className = '' }: { mood?: MascotMood; size?: number; className?: string }) {
  const h = HUMORES[mood] ?? HUMORES.idle;
  const soCabeca = size < 72;
  const [sobE, sobD] = h.sobrancelhas;
  return (
    <svg
      key={mood}
      className={`mascot k9 mood-${mood}${soCabeca ? ' so-cabeca' : ''} ${className}`}
      width={size}
      height={size}
      viewBox={soCabeca ? '29 6 142 142' : '0 0 200 200'}
      fill="none"
      aria-hidden="true"
    >
      <g className="m-jump">
        <g className="m-body">
          {/* colete com o T da marca, coleira vermelha e plaquinha dourada */}
          <path d="M30 200C33 178 48 163 72 157H128C152 163 167 178 170 200Z" fill="#2c2c2c" />
          <path d="M77 158L71 200M123 158L129 200" stroke="#3b3b3b" strokeWidth="7" />
          <rect x="110" y="172" width="26" height="20" rx="5" fill="#171717" />
          <path d="M115 176.5H131V180.5H125.5V188.5H120.5V180.5H115Z" fill="#f6f6f4" />
          <circle cx="131.5" cy="187" r="2.4" fill="var(--brand)" />
          <text x="86" y="189" textAnchor="middle" fontFamily="Archivo, Arial, sans-serif" fontWeight="800" fontSize="11" fill="#8a8a85">
            K9
          </text>
          <path d="M74 150C76 140 86 134 100 134C114 134 124 140 126 150V160H74Z" fill={P.cabeca} />
          <path d="M71 147C86 156 114 156 129 147L130 156C114 166 86 166 70 156Z" fill="var(--brand)" />
          <circle cx="100" cy="166" r="5" fill="var(--gold)" stroke="var(--gold-shadow)" strokeWidth="1.2" />

          <g className="m-head">
            <g transform={`translate(0 ${h.desce ?? 0}) rotate(${h.inclina ?? 0} 100 112)`}>
              <g className="m-ear-l">
                <g transform={`rotate(${-h.orelhas[0]} 78 66)`}>
                  <path d={ORELHA_E} fill={P.orelha} />
                  <path d={ORELHA_E_DENTRO} fill={P.orelhaDentro} />
                </g>
              </g>
              <g className="m-ear-r">
                <g transform={`rotate(${h.orelhas[1]} 122 66)`}>
                  <path d={ORELHA_D} fill={P.orelha} />
                  <path d={ORELHA_D_DENTRO} fill={P.orelhaDentro} />
                </g>
              </g>
              <path d={CABECA} fill={P.cabeca} />
              <ellipse cx="84" cy="58" rx="15" ry="7" transform="rotate(-18 84 58)" fill="#fff" opacity={P.brilho} />
              {P.mascara && <path d={MASCARA} fill={P.mascara} />}
              <path d={FOCINHO} fill={P.focinho} />
              <path d={NARIZ} fill="#151515" />
              <ellipse cx="94" cy="100" rx="4" ry="2" fill="#fff" opacity=".35" />
              <BocaK9 tipo={h.boca} />
              <Olhos olho={h.olho} />
              <g className="m-brows" stroke={P.sobrancelha} strokeWidth="7" strokeLinecap="round">
                <path d={`M69 ${sobE[0]}L87 ${sobE[1]}`} />
                <path d={`M131 ${sobD[0]}L113 ${sobD[1]}`} />
              </g>
            </g>
          </g>
          <Pose pose={h.pose} />
        </g>
      </g>
      <Efeitos humor={h} />
    </svg>
  );
}
