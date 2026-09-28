import Mascot from './Mascot';

// Logo: o Foquinho (mascote) + "foco." — por enquanto o mascote é a marca.
export default function Brand({ light = false, caption }: { light?: boolean; caption?: string }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <Mascot mood="idle" size={46} />
      </span>
      <div>
        <span className="brand-name">
          foco<span>.</span>
        </span>
        {caption && <small>{caption}</small>}
      </div>
    </div>
  );
}
