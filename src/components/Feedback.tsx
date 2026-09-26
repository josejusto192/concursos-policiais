import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';
import Brand from './Brand';

export function LoadingExperience({ message = 'Preparando seu espaço', fullPage = false }: { message?: string; fullPage?: boolean }) {
  return (
    <div className={`loading-experience ${fullPage ? 'full-page' : ''}`} role="status" aria-live="polite">
      <div className="loading-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
        <div className="loading-core">
          <Brand />
        </div>
      </div>
      <strong>{message}</strong>
      <span className="loading-subtitle">Mais um passo na sua jornada.</span>
      <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
  );
}

export function LoadingCards() {
  return (
    <div className="loading-cards" role="status" aria-label="Carregando conteúdo">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <WarningCircle size={24} />
      <div>
        <strong>Não foi possível carregar</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <button className="button button-secondary" onClick={retry}>
          <ArrowClockwise size={17} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
