import { ArrowRight, ChatCircleText, Path, ShieldCheck, Target } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../../state/AppStateContext';
import Brand from '../../../components/Brand';
import { PathIllustration } from '../../home/Home';

export default function WelcomeStep() {
  const { dispatch } = useAppState();
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand light caption="UM POUCO TODO DIA" />
        <div>
          <h1>
            O próximo passo
            <br />é o seu <em>começo.</em>
          </h1>
          <p>Transforme a preparação para o concurso em um hábito. Uma trilha, uma questão, uma conquista por vez.</p>
          <div className="auth-art">
            <PathIllustration />
          </div>
        </div>
        <footer>
          <ShieldCheck size={20} />
          No seu ritmo. Com direção.
        </footer>
      </section>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">SUA PREPARAÇÃO, COM FOCO</span>
          <h2>
            Um plano que cabe
            <br />
            na sua rotina.
          </h2>
          <p>Conte um pouco sobre seu objetivo. A gente organiza os próximos passos.</p>
          <div className="welcome-features">
            <div>
              <span className="metric-icon">
                <Path size={23} weight="duotone" />
              </span>
              <span>
                <strong>Saiba o que estudar</strong>
                <small>Trilhas organizadas em pequenas etapas.</small>
              </span>
            </div>
            <div>
              <span className="metric-icon yellow">
                <ChatCircleText size={23} weight="duotone" />
              </span>
              <span>
                <strong>Entenda cada resposta</strong>
                <small>Questões com comentários revisados.</small>
              </span>
            </div>
            <div>
              <span className="metric-icon green">
                <Target size={23} weight="duotone" />
              </span>
              <span>
                <strong>Veja sua evolução</strong>
                <small>Metas diárias e progresso de verdade.</small>
              </span>
            </div>
          </div>
          <button className="button button-primary" onClick={() => dispatch({ type: 'OB_SET_STEP', step: 1 })}>
            Montar meu plano
            <ArrowRight size={19} />
          </button>
          <Link className="signup-link" to="/login">
            Já tem uma conta? <strong>Entrar</strong>
          </Link>
          <div className="auth-footer">
            <Link to="/termos">Termos de uso</Link>
            <Link to="/privacidade">Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
