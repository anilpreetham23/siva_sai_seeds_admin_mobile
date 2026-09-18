import React from 'react';

export default function MobileEmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2 font-manrope">
      <div className="w-14 h-14 rounded-full bg-[var(--surface-alt)] flex items-center justify-center mb-1 text-[var(--canopy-deep)]">
        {icon || (
          <img
            src="/logo-icon.jpeg"
            alt="Sri Siva Sai Seeds"
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
      </div>
      <div className="text-[14px] font-extrabold text-[var(--text)]">{title}</div>
      {description && (
        <div className="text-[12px] text-[var(--text-muted)] max-w-[240px] leading-relaxed font-semibold">
          {description}
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
