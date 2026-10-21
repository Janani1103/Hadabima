import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accentColor?: 'violet' | 'amber' | 'orange' | 'emerald' | 'rose' | 'blue';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
  accentColor = 'amber',
}: StatCardProps) {
  const { tr } = useLanguage();

  const accentStyles = {
    violet: {
      card: 'border-stone-200/90 hover:border-amber-400/80 hover:shadow-amber-500/10',
      icon: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
    amber: {
      card: 'border-stone-200/90 hover:border-amber-400/80 hover:shadow-amber-500/10',
      icon: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
    orange: {
      card: 'border-stone-200/90 hover:border-orange-400/80 hover:shadow-orange-500/10',
      icon: 'bg-orange-50 text-orange-600 border-orange-200/80',
    },
    emerald: {
      card: 'border-stone-200/90 hover:border-emerald-400/80 hover:shadow-emerald-500/10',
      icon: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    rose: {
      card: 'border-stone-200/90 hover:border-rose-400/80 hover:shadow-rose-500/10',
      icon: 'bg-rose-50 text-rose-600 border-rose-200/80',
    },
    blue: {
      card: 'border-stone-200/90 hover:border-sky-400/80 hover:shadow-sky-500/10',
      icon: 'bg-sky-50 text-sky-600 border-sky-200/80',
    },
  }[accentColor];

  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === 'function' || (icon && typeof icon === 'object' && ('render' in icon || '$$typeof' in icon))
    ? React.createElement(icon as any, { className: 'w-5 h-5' })
    : icon;

  return (
    <div
      className={`group relative bg-white border p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-2xs hover:shadow-lg ${accentStyles.card}`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          {tr(title)}
        </span>
        {renderedIcon && (
          <div className={`p-2.5 rounded-xl border shadow-2xs transition-transform duration-200 group-hover:scale-105 ${accentStyles.icon}`}>
            {renderedIcon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-black tracking-tight text-stone-900 tabular-nums">
          {value}
        </h3>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              trendUp
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-stone-500 font-medium">{tr(subtitle)}</p>}
    </div>
  );
}
