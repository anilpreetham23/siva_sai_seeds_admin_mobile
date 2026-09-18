import React from 'react';

export default function MobileStatCard({
  icon,
  iconBg = '#ECF5FD',
  iconColor = '#0369A1',
  value,
  label,
  delta,
  deltaPositive = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-md)] p-4 flex flex-col gap-1.5 shadow-[var(--shadow-sm)] font-manrope ${
        onClick ? 'cursor-pointer tap-highlight active:scale-[0.98]' : ''
      }`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="display text-[22px] font-extrabold text-[var(--text)] mt-1">
        {value}
      </div>
      <div className="text-[11.5px] font-bold text-[var(--text-muted)] leading-tight">
        {label}
      </div>
      {delta && (
        <div
          className={`text-[10.5px] font-extrabold mt-0.5 ${
            deltaPositive ? 'text-[#28653F]' : 'text-[#A6431E]'
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
