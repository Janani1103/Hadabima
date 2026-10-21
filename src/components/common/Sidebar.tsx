'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  CalendarDays,
  Receipt,
  Users,
  Coins,
  Wallet,
  ReceiptText,
  Lock,
  BarChart3,
  ScrollText,
  Settings,
  Scale,
  ChefHat,
  BadgeDollarSign,
  Banknote,
  HandCoins,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export function Sidebar({ role, activeTab, onTabChange }: SidebarProps) {
  const { t, tr } = useLanguage();

  const adminGroups: NavGroup[] = [
    {
      groupTitle: tr('Core Management'),
      items: [
        { id: 'overview', label: t.nav.dashboard, icon: LayoutDashboard },
        { id: 'employees', label: t.nav.employees, icon: Users },
        { id: 'reports', label: t.nav.reports, icon: BarChart3 },
      ],
    },
    {
      groupTitle: tr('Finance & Settlements'),
      items: [
        { id: 'settlements', label: t.nav.settlements, icon: Coins },
        { id: 'payroll', label: t.nav.payroll, icon: Banknote },
        { id: 'advances', label: t.nav.advances, icon: HandCoins },
        { id: 'finance', label: t.nav.finance, icon: Wallet },
        { id: 'expenses', label: t.nav.expenses, icon: ReceiptText },
      ],
    },
    {
      groupTitle: tr('System Controls'),
      items: [
        { id: 'settings', label: t.nav.settings, icon: Settings },
        { id: 'audit', label: t.nav.auditLogs, icon: ScrollText },
      ],
    },
  ];

  const cashierGroups: NavGroup[] = [
    {
      groupTitle: tr('Terminal Operations'),
      items: [
        { id: 'overview', label: t.nav.dashboard, icon: LayoutDashboard },
        { id: 'pos', label: t.nav.pos, icon: ShoppingCart },
        { id: 'assignments', label: t.nav.foodAssignment, icon: CalendarDays },
        { id: 'foodItems', label: t.nav.foodItems, icon: Utensils },
      ],
    },
    {
      groupTitle: tr('Sales & Reconciliation'),
      items: [
        { id: 'bills', label: t.nav.billHistory, icon: Receipt },
        { id: 'expenses', label: t.nav.expenses, icon: ReceiptText },
        { id: 'closing', label: t.nav.dailyClosing, icon: Lock },
        { id: 'reconciliation', label: t.nav.reconciliation, icon: Scale },
      ],
    },
    {
      groupTitle: tr('Reports'),
      items: [
        { id: 'reports', label: t.nav.reports, icon: BarChart3 },
      ],
    },
  ];

  const kitchenGroups: NavGroup[] = [
    {
      groupTitle: tr('Kitchen Production'),
      items: [
        { id: 'overview', label: t.nav.dashboard, icon: LayoutDashboard },
        { id: 'myItems', label: t.nav.myItems, icon: Utensils },
      ],
    },
    {
      groupTitle: tr('Earnings & Payouts'),
      items: [
        { id: 'earnings', label: t.nav.myEarnings, icon: BadgeDollarSign },
        { id: 'advances', label: t.nav.myAdvances, icon: Wallet },
      ],
    },
  ];

  const navGroups = role === 'ADMIN' ? adminGroups : role === 'CASHIER' ? cashierGroups : kitchenGroups;

  const roleBadgeStyle = {
    ADMIN: 'bg-amber-50 text-amber-900 border-amber-200/80',
    CASHIER: 'bg-orange-50 text-orange-900 border-orange-200/80',
    KITCHEN: 'bg-stone-100 text-stone-900 border-stone-200',
  }[role];

  return (
    <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col shrink-0 min-h-[calc(100vh-65px)] shadow-2xs select-none">
      <div className="p-4 flex-1 space-y-5 overflow-y-auto">
        {/* Role Header Banner */}
        <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${roleBadgeStyle}`}>
          <span className="text-[11px] font-black uppercase tracking-wider">
            {role === 'ADMIN'
              ? t.roles.admin
              : role === 'CASHIER'
              ? t.roles.cashier
              : t.roles.kitchen}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Categorized Navigation Groups */}
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.groupTitle && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-3 pb-1">
                {group.groupTitle}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`group relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-600/20 translate-x-0.5'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80 hover:translate-x-1'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-white' : 'text-amber-600 group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-2xs" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Enterprise System Info Footer */}
      <div className="p-3.5 border-t border-stone-200/80 bg-stone-50/70">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-stone-500 font-medium">Hadabima POS ERP</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
