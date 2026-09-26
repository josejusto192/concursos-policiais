import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import MentorSheet from './sheets/MentorSheet';

export default function PhoneShell({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const { pathname } = useLocation();
  const wide = ['/trilha', '/stats', '/ranking', '/perfil', '/login', '/onboarding'].includes(pathname);

  return (
    <div className={`app-shell ${wide ? 'app-shell-wide' : 'app-shell-focus'}`}>
      {children}

      <MentorSheet />

      {state.navLoading && (
        <div className="absolute inset-0 z-[60] flex animate-fade-quick items-center justify-center bg-app-bg">
          <div
            className="h-11 w-11 animate-spin-fast rounded-full border-4 border-border"
            style={{ borderTopColor: '#1557E6' }}
          />
        </div>
      )}
    </div>
  );
}
