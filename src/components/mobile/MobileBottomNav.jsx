import React from 'react';
import { NavLink } from 'react-router-dom';

export default function MobileBottomNav({ tabs = [], role = 'manager' }) {
  const activeColorClass =
    role === 'farmer'
      ? 'text-[var(--canopy-deep)] font-extrabold'
      : 'text-[var(--admin-navy)] font-extrabold';

  const dotColorClass =
    role === 'farmer' ? 'bg-[var(--canopy)]' : 'bg-[var(--admin-navy-light)]';

  return (
    <nav className="flex-shrink-0 flex justify-around items-center bg-white/90 backdrop-blur-md border-t border-[var(--line)] px-2 py-2 pb-[max(12px,env(safe-area-inset-bottom))] z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] font-manrope">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all tap-highlight ${
              isActive ? activeColorClass : 'text-[var(--text-faint)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-6 h-6 flex items-center justify-center transition-transform ${
                  isActive ? 'scale-105' : 'opacity-80'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[10.5px] font-bold mt-1 text-center truncate max-w-[68px]">
                {tab.label}
              </span>
              <span
                className={`w-1 h-1 rounded-full mt-0.5 transition-all duration-200 ${
                  isActive ? `opacity-100 scale-100 ${dotColorClass}` : 'opacity-0 scale-0'
                }`}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
