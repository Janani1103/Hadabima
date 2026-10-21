import React from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const { tr } = useLanguage();
  const norm = status?.toUpperCase() || '';

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200/90';
  let isPulsing = false;

  if (norm === 'ACTIVE' || norm === 'COMPLETED' || norm === 'PAID' || norm === 'FRESH' || norm === 'APPROVED') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-2xs';
    isPulsing = norm === 'ACTIVE' || norm === 'FRESH';
  } else if (norm === 'INACTIVE' || norm === 'VOIDED' || norm === 'EXPIRED' || norm === 'CANCELLED' || norm === 'REJECTED') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-2xs';
  } else if (norm === 'PENDING' || norm === 'CALCULATED' || norm === 'EXPIRING_TODAY') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/90 shadow-2xs';
    isPulsing = true;
  } else if (norm === 'ADMIN') {
    colorClasses = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
  } else if (norm === 'CASHIER') {
    colorClasses = 'bg-orange-100 text-orange-900 border-orange-300 font-extrabold';
  } else if (norm === 'KITCHEN') {
    colorClasses = 'bg-stone-100 text-stone-800 border-stone-300 font-extrabold';
  } else if (norm === 'STAFF') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/90 font-bold';
  } else if (norm === 'CUSTOMER') {
    colorClasses = 'bg-stone-100 text-stone-700 border-stone-200/90';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0 ${isPulsing ? 'animate-pulse' : 'opacity-80'}`} />
      {tr(status)}
    </span>
  );
}
