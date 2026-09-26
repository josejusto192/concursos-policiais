export default function Brand({ light = false, caption }: { light?: boolean; caption?: string }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        f<span>.</span>
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
