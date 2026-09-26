import {
  ArrowRight,
  ArrowsLeftRight,
  Check,
  Fire,
  Lightning,
  Notebook,
  Play,
  Sparkle,
  Target,
  Trophy,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAppState } from '../../state/AppStateContext';
import Brand from '../../components/Brand';
import { ErrorState, LoadingCards } from '../../components/Feedback';
import TrilhaPath from './TrilhaPath';
import TrilhasSheet from './TrilhasSheet';

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
  const { usuario, activeTrilha, modules, dailyDone, errosCount, loading, loadError, retry } = useAppData();
  const { dispatch } = useAppState();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const dailyGoal = Math.max(1, usuario?.meta_diaria ?? 20);
  const dailyRatio = Math.min(1, dailyDone / dailyGoal);
  const questionModules = modules.filter((m) => m.tipo === 'questoes');
  const done = questionModules.filter((m) => m.status === 'done').length;
  const current = modules.find((m) => m.status === 'current');
  const completed = questionModules.length > 0 && done === questionModules.length;
  const firstName = usuario?.nome?.trim().split(' ')[0] || 'estudante';
  function start() {
    dispatch({ type: 'RESET_SESSION' });
    navigate('/questao');
  }

  return (
    <div className="workspace-scroll home-workspace">
      <div className="workspace-content">
        <div className="mobile-brand">
          <Brand />
          <Link to="/perfil" className="avatar" aria-label="Abrir meu perfil">
            {firstName[0].toUpperCase()}
          </Link>
        </div>
        <header className="page-heading">
          <div>
            <span className="eyebrow">UM POUCO TODO DIA, MAIS LONGE SEMPRE</span>
            <h1>
              Bom te ver, {firstName}
              <span className="text-blue">.</span>
            </h1>
            <p>Vamos transformar constância em conquista.</p>
          </div>
          <div className="header-meta">
            <span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span>
            <Link to="/perfil" className="avatar" aria-label="Abrir meu perfil">
              {firstName[0].toUpperCase()}
            </Link>
          </div>
        </header>
        {loading ? (
          <LoadingCards />
        ) : loadError ? (
          <ErrorState message={loadError} retry={retry} />
        ) : (
          <>
            <section className="study-hero" aria-label="Continuar os estudos">
              <div className="hero-copy">
                <span className="hero-kicker">
                  <Sparkle size={14} weight="fill" /> SUA TRILHA ATUAL
                </span>
                <h2>{activeTrilha?.nome || 'Sua jornada começa aqui.'}</h2>
                <p>
                  {current ? (
                    <>
                      Próxima etapa: <strong>{current.titulo}</strong>.
                    </>
                  ) : completed ? (
                    'Trilha concluída! Cada passo fez a diferença. Vamos revisar?'
                  ) : (
                    'Escolha uma trilha e comece a construir seu ritmo de estudos.'
                  )}
                </p>
                {current ? (
                  <button className="button button-yellow" onClick={start}>
                    {done ? 'Continuar estudando' : 'Começar a estudar'}
                    <ArrowRight size={18} weight="bold" />
                  </button>
                ) : completed ? (
                  <Link className="button button-yellow" to="/caderno-de-erros">
                    Revisar meus erros
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <button className="button button-yellow" onClick={() => setSheetOpen(true)}>
                    Explorar trilhas
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
              <PathIllustration />
            </section>
            <div className="metrics-row">
              <div className="metric">
                <span className="metric-icon yellow">
                  <Fire size={23} weight="duotone" />
                </span>
                <div>
                  <strong>
                    {usuario?.streak ?? 0}
                    <span className="metric-unit"> dias</span>
                  </strong>
                  <small>de constância</small>
                </div>
              </div>
              <div className="metric">
                <span className="metric-icon">
                  <Lightning size={23} weight="duotone" />
                </span>
                <div>
                  <strong>{(usuario?.xp ?? 0).toLocaleString('pt-BR')}</strong>
                  <small>XP conquistados</small>
                </div>
              </div>
              <div className="metric">
                <span className="metric-icon green">
                  <Target size={23} weight="duotone" />
                </span>
                <div>
                  <strong>
                    {dailyDone}
                    <span className="metric-unit">/{dailyGoal}</span>
                  </strong>
                  <small>questões hoje</small>
                </div>
              </div>
            </div>
            <div className="home-columns">
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Sua trilha de estudos</h2>
                    <p>{activeTrilha?.nome || 'Escolha uma trilha para começar'}</p>
                  </div>
                  <button className="button button-text" onClick={() => setSheetOpen(true)}>
                    <ArrowsLeftRight size={16} />
                    Trocar trilha
                  </button>
                </div>
                {questionModules.length > 0 && (
                  <div className="trail-progress">
                    <span>
                      {done} de {questionModules.length} etapas concluídas
                    </span>
                    <strong>{Math.round((done / questionModules.length) * 100)}%</strong>
                    <div className="progress-track">
                      <span style={{ width: `${(done / questionModules.length) * 100}%` }} />
                    </div>
                  </div>
                )}
                <TrilhaPath />
              </section>
              <aside className="study-aside">
                <section className="panel">
                  <div className="section-heading">
                    <h2>Sua meta de hoje</h2>
                    <Target size={19} className="text-blue" />
                  </div>
                  <div className="goal-ring" style={{ background: `conic-gradient(#1557e6 ${dailyRatio * 360}deg, #eef3ff 0)` }}>
                    <div>
                      <strong>{Math.round(dailyRatio * 100)}%</strong>
                      <small>da meta diária</small>
                    </div>
                  </div>
                  <p className="goal-copy">
                    {dailyDone >= dailyGoal ? (
                      <>
                        <strong>Meta alcançada!</strong>
                        <br />
                        Seu compromisso de hoje está em dia.
                      </>
                    ) : (
                      <>
                        <strong>Faltam {dailyGoal - dailyDone} questões.</strong>
                        <br />
                        Um pouco de foco faz a diferença.
                      </>
                    )}
                  </p>
                </section>
                <section className="panel review-panel">
                  <Notebook size={26} weight="duotone" />
                  <h2>Errar também é aprender.</h2>
                  <p>
                    {errosCount > 0 ? (
                      <>
                        Você tem <strong>{errosCount} questões</strong> para revisar nesta trilha.
                      </>
                    ) : (
                      'As questões que precisam de reforço ficam no seu caderno de erros.'
                    )}
                  </p>
                  <Link to="/caderno-de-erros" className="button button-text">
                    Abrir meu caderno
                    <ArrowRight size={16} />
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
        {sheetOpen && <TrilhasSheet onClose={() => setSheetOpen(false)} />}
      </div>
    </div>
  );
}
