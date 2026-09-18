import React from 'react';

const PILL_STYLES = {
  good: 'bg-[#DFF0DF] text-[#28653F]',
  warn: 'bg-[#F6E2BE] text-[#8A5C15]',
  bad: 'bg-[#F7DDD2] text-[#A6431E]',
  info: 'bg-[#E1EBF6] text-[#16293F]',
  neutral: 'bg-[#E9F0DD] text-[#1F5C42]',
};

export default function MobileStatusPill({ status, label, className = '' }) {
  const normStatus = (status || '').toLowerCase();
  let styleKey = 'neutral';
  let defaultLabel = status || '';

  if (['approved', 'delivered', 'paid', 'completed', 'active', 'good'].includes(normStatus)) {
    styleKey = 'good';
  } else if (['pending', 'inprogress', 'in progress', 'warn', 'low'].includes(normStatus)) {
    styleKey = 'warn';
  } else if (['rejected', 'cancelled', 'overdue', 'bad', 'danger'].includes(normStatus)) {
    styleKey = 'bad';
  } else if (['upcoming', 'scheduled', 'info'].includes(normStatus)) {
    styleKey = 'info';
  }

  const text = label || defaultLabel || 'Status';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold capitalize font-manrope ${PILL_STYLES[styleKey]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {text}
    </span>
  );
}
