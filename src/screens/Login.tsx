import { ArrowRight, CircleNotch, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Brand from '../components/Brand';
import { PathIllustration } from './home/Home';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError('Não foi possível entrar. Confira seu e-mail e sua senha.');
        return;
      }
      const next = params.get('next');
      navigate(next?.startsWith('/admin') && !next.startsWith('//') ? next : '/trilha', { replace: true });
    } catch {
      setError('Não conseguimos conectar. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand light caption="UM POUCO TODO DIA" />
        <div>
          <h1>
            Pequenos passos.
            <br />
            <em>Grandes conquistas.</em>
          </h1>
          <p>Sua preparação para concursos, com direção. Questões comentadas, trilhas e um ritmo que cabe na sua vida.</p>
          <div className="auth-art">
            <PathIllustration />
          </div>
        </div>
        <footer>
          <ShieldCheck size={19} />
          Seu progresso acompanha você.
        </footer>
      </section>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleLogin}>
          <span className="eyebrow">BOM TER VOCÊ DE VOLTA</span>
          <h2>Vamos continuar?</h2>
          <p>Sua próxima conquista começa com um pouco de foco.</p>
          <div className="form-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="form-field">
            <div className="label-row">
              <label htmlFor="login-password">Senha</label>
              <Link to="/esqueci-senha">Esqueci minha senha</Link>
            </div>
            <div className="password-field">
              <input
                id="login-password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-error text-sm" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar na minha conta'}
            {loading ? <CircleNotch className="busy-icon" size={19} /> : <ArrowRight size={19} />}
          </button>
          <Link to="/onboarding" className="signup-link">
            Ainda não tem conta? <strong>Comece por aqui</strong>
          </Link>
          <div className="auth-footer">
            <Link to="/termos">Termos de uso</Link>
            <Link to="/privacidade">Privacidade</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
