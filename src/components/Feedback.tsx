import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';

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
