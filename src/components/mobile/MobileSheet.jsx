import React, { useEffect } from 'react';

export default function MobileSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(15,25,20,0.55)] backdrop-blur-sm flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] bg-[var(--bg)] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl animate-sheet-up font-manrope"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1.5 rounded-full bg-[var(--line)] mx-auto mt-3 mb-1" />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-[var(--line)]">
            <div>
              {title && (
                <div className="display text-[18px] font-bold text-[var(--text)]">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-[11.5px] font-bold text-[var(--text-muted)] mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 hide-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-4 px-6 bg-white/95 border-t border-[var(--line)] pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
