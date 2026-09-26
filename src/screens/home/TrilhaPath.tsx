import { Check, LockSimple, Play, Path, Trophy } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAppState } from '../../state/AppStateContext';
import type { Modulo } from '../../data/types';
import VideoSheet from '../../components/sheets/VideoSheet';

const STEP_HEIGHT = 170;
const centerX = (index: number) => 160 + Math.sin((index * Math.PI) / 2) * 66;

export default function TrilhaPath() {
  const { modules, activeTrilha } = useAppData();
  const { dispatch } = useAppState();
  const navigate = useNavigate();
  const [aula, setAula] = useState<Modulo | null>(null);
  if (!modules.length)
    return (
      <div className="panel empty-state">
        <Path size={34} />
        <h3>Novas etapas a caminho</h3>
        <p>Os módulos desta trilha estão sendo preparados. Você pode escolher outra trilha enquanto isso.</p>
      </div>
    );
  const height = modules.length * STEP_HEIGHT;
  const route = modules
    .map((_, i) =>
      i === 0
        ? `M ${centerX(0)} 48`
        : `C ${centerX(i - 1)} ${(i - 1) * STEP_HEIGHT + 130}, ${centerX(i)} ${i * STEP_HEIGHT - 35}, ${centerX(i)} ${i * STEP_HEIGHT + 48}`,
    )
    .join(' ');
  return (
    <div className="game-map">
      <div className="map-section-label">
        <span>{activeTrilha?.secao_nome || 'Sua trilha de conquistas'}</span>
      </div>
      <div className="map-path" style={{ height }}>
        <svg className="map-line" viewBox={`0 0 320 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={route} fill="none" stroke="#d8e2f5" strokeWidth="5" strokeDasharray="3 12" strokeLinecap="round" />
        </svg>
        {modules.map((m, index) => {
          const current = m.status === 'current';
          const done = m.status === 'done';
          const video = m.tipo === 'aula';
          const title = current
            ? 'Continuar estudando'
            : video
              ? 'Assistir aula'
              : done
                ? 'Concluído'
                : 'Conclua a etapa anterior';
          return (
            <div
              key={m.id}
              className={`map-stop ${m.status}`}
              style={{ top: index * STEP_HEIGHT, left: `${(centerX(index) / 320) * 100}%` }}
            >
              {current && (
                <span className="map-current-label">
                  SEU PRÓXIMO PASSO
                  <span />
                </span>
              )}
              <button
                className="map-node"
                disabled={!current && !(video && m.video_url)}
                aria-label={`${m.titulo}. ${title}`}
                title={title}
                onClick={() => {
                  if (video) setAula(m);
                  else {
                    dispatch({ type: 'RESET_SESSION' });
                    navigate('/questao');
                  }
                }}
              >
                {done ? (
                  <Check size={29} weight="bold" />
                ) : current || video ? (
                  <Play size={26} weight="fill" />
                ) : (
                  <LockSimple size={24} weight="duotone" />
                )}
              </button>
              <div className="map-caption">
                <h3>{m.titulo}</h3>
                <p>
                  {done
                    ? `${m.acertos}/${m.total} acertos · concluído`
                    : video
                      ? 'AULA EXTRA · OPCIONAL'
                      : current
                        ? 'Toque para continuar'
                        : 'Próxima conquista'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="map-finish">
        <span>
          <Trophy size={30} weight="duotone" />
        </span>
        <strong>Um passo de cada vez.</strong>
        <p>Sua constância leva você mais longe.</p>
      </div>
      {aula?.video_url && <VideoSheet titulo={aula.titulo} videoUrl={aula.video_url} onClose={() => setAula(null)} />}
    </div>
  );
}
