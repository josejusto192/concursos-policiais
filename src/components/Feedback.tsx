import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';
function JourneyMascot() {
  return (
    <svg className="journey-mascot" viewBox="0 0 144 144" fill="none" aria-hidden="true">
      <ellipse cx="72" cy="125" rx="35" ry="7" fill="#DCE6F8" />
      <g className="mascot-body">
        <path d="M42 72 28 81M102 72l14 9" stroke="#1557E6" strokeWidth="8" strokeLinecap="round" />
        <path d="M51 105v12m42-12v12" stroke="#0B3FAF" strokeWidth="9" strokeLinecap="round" />
        <path d="M41 119h20m22 0h20" stroke="#FFCB2D" strokeWidth="10" strokeLinecap="round" />
        <rect x="34" y="25" width="76" height="86" rx="32" fill="#1557E6" />
        <path d="M42 38c8-12 20-17 35-17 11 0 22 5 28 13" stroke="#FFCB2D" strokeWidth="8" strokeLinecap="round" />
        <rect x="46" y="42" width="52" height="42" rx="21" fill="white" />
        <g className="mascot-eyes" fill="#0B1F4D">
          <circle cx="62" cy="59" r="3.2" />
          <circle cx="82" cy="59" r="3.2" />
        </g>
        <path d="M65 70c4 5 10 5 14 0" stroke="#0B1F4D" strokeWidth="2.7" strokeLinecap="round" />
        <circle cx="53" cy="69" r="3" fill="#FFDDA1" />
        <circle cx="91" cy="69" r="3" fill="#FFDDA1" />
        <path d="M60 96h24" stroke="#FFCB2D" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path className="mascot-spark" d="m115 28 2.4 6.6L124 37l-6.6 2.4L115 46l-2.4-6.6L106 37l6.6-2.4L115 28Z" fill="#FFCB2D" />
    </svg>
  );
}

export function LoadingExperience({
  message = 'Preparando seu espaço',
  fullPage = false,
}: {
  message?: string;
  fullPage?: boolean;
}) {
  return (
    <div className={`loading-experience ${fullPage ? 'full-page' : ''}`} role="status" aria-live="polite">
      <div className="loading-journey" aria-hidden="true">
        <span className="journey-halo" />
        <JourneyMascot />
        <span className="journey-ground">
          <i />
          <i />
          <i />
        </span>
      </div>
      <span className="loading-eyebrow">FOCO EM MOVIMENTO</span>
      <strong>{message}</strong>
      <span className="loading-subtitle">Seu próximo passo está sendo preparado.</span>
    </div>
  );
}

export function TrailLoading() {
  return (
    <div className="trail-loading game-map" role="status" aria-label="Preparando sua trilha">
      <div className="trail-loading-title skeleton-shape" />
      <div className="trail-loading-path" aria-hidden="true">
        <svg viewBox="0 0 320 450" preserveAspectRatio="none">
          <path
            d="M160 45 C160 150 225 115 225 205 C225 300 95 260 95 380"
            fill="none"
            stroke="#D8E2F5"
            strokeWidth="5"
            strokeDasharray="3 12"
            strokeLinecap="round"
          />
        </svg>
        {[0, 1, 2].map((step) => (
          <span key={step} className={`trail-loading-stop stop-${step}`} />
        ))}
      </div>
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
