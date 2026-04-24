'use client';

import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white border-transparent',
  secondary: 'text-white border-transparent',
  outline: 'bg-transparent border-current',
  danger: 'text-white border-transparent',
};

const variantStyles: Record<
  NonNullable<ButtonProps['variant']>,
  React.CSSProperties
> = {
  primary: {
    backgroundColor: 'var(--brand-primary, #2563eb)',
    color: 'var(--brand-surface, #ffffff)',
  },
  secondary: {
    backgroundColor: 'var(--brand-secondary, #334155)',
    color: 'var(--brand-surface, #ffffff)',
  },
  outline: {
    color: 'var(--brand-text, currentColor)',
    borderColor: 'var(--brand-border, currentColor)',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-md border font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'outline' ? 'hover:bg-white/10' : 'hover:opacity-90',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={variantStyles[variant]}
    >
      {children}
    </button>
  );
}
