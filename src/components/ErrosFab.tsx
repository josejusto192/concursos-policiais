import { Notebook } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export default function ErrosFab({ count }: { count: number }) {
  const navigate = useNavigate();

  if (count <= 0) return null;

  return (
    <button
      onClick={() => navigate('/caderno-de-erros')}
      className="absolute bottom-20 right-5 z-20 flex h-12 w-12 animate-pop-in items-center justify-center rounded-[16px]"
      style={{ background: 'linear-gradient(180deg,#2e2e2e,var(--ink))', boxShadow: '0 3px 0 #000, 0 10px 18px -8px rgba(0,0,0,.35)' }}
      aria-label="Caderno de erros"
    >
      <Notebook weight="fill" size={21} color="#fff" />
      <span
        className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-app-bg bg-brand px-1 font-sans text-[11px] font-extrabold text-white"
      >
        {count}
      </span>
    </button>
  );
}
