import React from 'react';

export default function MobileCard({
  children,
  onClick,
  className = '',
  style = {},
  interactive = false,
}) {
  const isClickable = interactive || Boolean(onClick);

  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] font-manrope ${
        isClickable ? 'cursor-pointer tap-highlight active:scale-[0.98]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
