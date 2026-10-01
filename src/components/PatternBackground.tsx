import type { ReactNode } from 'react';

interface PatternBackgroundProps {
  children: ReactNode;
  scrollClassName?: string;
}

// Área de conteúdo com rolagem própria. O fundo fica numa camada absoluta
// separada (hoje lisa, sem textura) para não se mover junto com o scroll.
export default function PatternBackground({ children, scrollClassName = '' }: PatternBackgroundProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 pattern-layer" aria-hidden="true" />
      <div className={`pattern-scroll relative h-full overflow-y-auto ${scrollClassName}`}>{children}</div>
    </div>
  );
}
