import { ArrowsLeftRight, Check, Fire, Lightning, Play, Trophy } from '@phosphor-icons/react';
import { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import Brand from '../../components/Brand';
import ErrosFab from '../../components/ErrosFab';
import { ErrorState, LoadingCards } from '../../components/Feedback';
import PatternBackground from '../../components/PatternBackground';
import TrilhaPath from './TrilhaPath';
import TrilhasSheet from './TrilhasSheet';

// Reused by the login and onboarding illustrations.
export function PathIllustration() {
  return (
    <div className="hero-path" aria-hidden="true">
      <span className="hero-step one">
        <Check size={23} weight="bold" />
      </span>
      <span className="hero-step two">
        <Play size={28} weight="fill" />
      </span>
      <span className="hero-step three">
        <Trophy size={25} weight="duotone" />
      </span>
      <span className="hero-spark">✦</span>
    </div>
  );
}

export default function Home() {
  const { usuario, activeTrilha, dailyDone, errosCount, loading, loadError, retry } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const dailyGoal = Math.max(1, usuario?.meta_diaria ?? 20);
  const dailyRatio = Math.min(1, dailyDone / dailyGoal);

  return (
    <>
      <header className="compact-home-header">
        <div className="compact-home-top">
          <Brand />
          <div className="compact-home-badges" aria-label="Seu progresso">
            <span className="compact-badge streak" aria-label={`${usuario?.streak ?? 0} dias de sequência`}>
              <Fire size={16} weight="fill" aria-hidden="true" />
              <strong>{usuario?.streak ?? 0}</strong>
            </span>
            <span className="compact-badge xp" aria-label={`${usuario?.xp ?? 0} pontos de experiência`}>
              <Lightning size={16} weight="fill" aria-hidden="true" />
              <strong>{(usuario?.xp ?? 0).toLocaleString('pt-BR')} XP</strong>
            </span>
          </div>
        </div>

        <button className="compact-trilha" type="button" onClick={() => setSheetOpen(true)} aria-label="Trocar trilha de estudos">
          <span className="compact-trilha-label">
            TRILHA ATUAL
            <span className="compact-trilha-switch">
              <ArrowsLeftRight size={12} weight="bold" aria-hidden="true" />
              trocar
            </span>
          </span>
          <strong>{activeTrilha?.nome || 'Escolha sua trilha'}</strong>
          {activeTrilha?.descricao && <small>{activeTrilha.descricao}</small>}
        </button>

        <div className="compact-goal" aria-label={`Meta de hoje: ${dailyDone} de ${dailyGoal} questões`}>
          <div className="compact-goal-track" aria-hidden="true">
            <span style={{ width: `${dailyRatio * 100}%` }} />
          </div>
          <strong>
            Meta {dailyDone}/{dailyGoal}
          </strong>
        </div>
      </header>

      <PatternBackground scrollClassName="compact-path-scroll">
        {loading ? <LoadingCards /> : loadError ? <ErrorState message={loadError} retry={retry} /> : <TrilhaPath />}
      </PatternBackground>

      <ErrosFab count={errosCount} />
      {sheetOpen && <TrilhasSheet onClose={() => setSheetOpen(false)} />}
    </>
  );
}
