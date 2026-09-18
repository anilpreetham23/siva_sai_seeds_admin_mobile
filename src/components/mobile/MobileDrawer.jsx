import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function MobileDrawer({
  isOpen,
  onClose,
  user,
  onLogout,
  groups = [],
  role = 'manager',
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

  const headerGradient =
    role === 'farmer'
      ? 'bg-gradient-to-r from-[var(--forest)] to-[var(--canopy-deep)]'
      : 'bg-gradient-to-r from-[var(--admin-navy-deep)] to-[var(--admin-navy)]';

  const userInitial = user?.name ? user.name[0].toUpperCase() : 'M';
  const roleLabel =
    role === 'farmer' ? 'Farmer' : role === 'super_admin' ? 'Super Admin' : 'Manager';

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Scrim */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Panel */}
      <div
        className="relative w-[82%] max-w-[320px] h-full bg-[var(--bg)] shadow-2xl flex flex-col overflow-hidden z-10 font-manrope animate-slide-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Head */}
        <div
          className={`${headerGradient} text-white p-6 pt-[max(24px,env(safe-area-inset-top))] flex-shrink-0 shadow-md`}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-black">
            {userInitial}
          </div>
          <div className="font-extrabold text-[15.5px] mt-2.5 truncate">
            {user?.name || 'Authorized Account'}
          </div>
          <div className="text-[11px] text-white/80 mt-0.5 truncate">
            {user?.phone || user?.email || 'Kurnool Zone'}
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white mt-2">
            {roleLabel}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 hide-scrollbar">
          {groups.map((group, gIdx) => (
            <div key={gIdx}>
              {group.label && (
                <div className="text-[10.5px] font-extrabold tracking-wider uppercase text-[var(--text-faint)] px-3 py-1">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5 mt-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold transition-all tap-highlight ${
                        isActive
                          ? 'bg-[var(--surface-alt)] text-[var(--canopy-deep)]'
                          : 'text-[var(--text)] hover:bg-white'
                      }`
                    }
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--forest)] flex-shrink-0 shadow-xs">
                      {item.icon}
                    </div>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--alert)] text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[var(--line)] bg-white/50 flex-shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F7DDD2] text-[#A6431E] font-bold text-[13.5px] tap-highlight active:scale-98"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
