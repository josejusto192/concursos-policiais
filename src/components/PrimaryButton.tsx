import { ArrowRight } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  variant?: 'brand' | 'ink' | 'green' | 'disabled';
}

// Botão "3D" (delight.css .btn-3d): a sombra sólida vira a base, e ao tocar
// o botão afunda e a sombra encolhe.
const VARIANTS = {
  brand: { bg: 'var(--brand)', sombra: 'var(--brand-dark)' },
  ink: { bg: 'var(--ink)', sombra: '#000' },
  green: { bg: 'var(--success)', sombra: 'var(--success-dark)' },
  disabled: { bg: 'var(--border-strong)', sombra: 'transparent' },
};

export default function PrimaryButton({
  children,
  icon,
  iconPosition = 'end',
  variant = 'brand',
  className = '',
  style,
  ...rest
}: PrimaryButtonProps) {
  const v = VARIANTS[variant];
  const iconEl = icon !== undefined ? icon : <ArrowRight weight="bold" size={18} />;
  return (
    <button
      {...rest}
      className={`btn-3d flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl border-none font-sans text-[16px] font-extrabold text-white ${className}`}
      style={{ background: v.bg, '--btn-sombra': v.sombra, cursor: variant === 'disabled' ? 'default' : 'pointer', ...style } as CSSProperties}
    >
      {iconPosition === 'start' && iconEl}
      {children}
      {iconPosition === 'end' && iconEl}
    </button>
  );
}
