import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { BRAND_NAME } from '../../utils/brandLogo';

export default function MobileHeader({
  title = BRAND_NAME,
  subtitle = 'Manager Console',
  onOpenDrawer,
  onOpenNotifications,
  unreadCount = 0,
}) {
  return (
    <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 bg-[var(--bg)] border-b border-[var(--line)] shadow-[0_2px_12px_-6px_rgba(21,48,42,0.14)] z-30 pt-[max(14px,env(safe-area-inset-top))] font-manrope">
      <button
        onClick={onOpenDrawer}
        className="w-10 h-10 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--forest)] flex-shrink-0 shadow-sm tap-highlight"
        aria-label="Open navigation menu"
      >
        <Menu size={19} />
      </button>

      <div className="w-10 h-10 rounded-full border border-[var(--admin-navy-light)] overflow-hidden shadow-sm flex-shrink-0 bg-white">
        <img
          src="/logo-icon.jpeg"
          alt={BRAND_NAME}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-[15.5px] font-extrabold text-[var(--text)] leading-tight truncate">
          {title}
        </h1>
        <p className="text-[10px] font-bold tracking-wider uppercase text-[var(--admin-navy)] mt-0.5 opacity-90 truncate">
          {subtitle}
        </p>
      </div>

      <button
        onClick={onOpenNotifications}
        className="w-10 h-10 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--forest)] flex-shrink-0 relative shadow-sm tap-highlight"
        aria-label="View notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--alert)] border-2 border-white" />
        )}
      </button>
    </header>
  );
}
