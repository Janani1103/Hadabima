'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import {
  TrendingUp,
  ReceiptText,
  Coins,
  Wallet,
  Users,
  UtensilsCrossed,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const { t, tr, language } = useLanguage();
  const [finance, setFinance] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const [finRes, empRes, billsRes] = await Promise.all([
        fetch('/api/finance/summary'),
        fetch('/api/employees'),
        fetch('/api/bills'),
      ]);

      const finData = await finRes.json();
      const empData = await empRes.json();
      const billsData = await billsRes.json();

      if (finData.success) setFinance(finData.summary);
      if (empData.success) setEmployees(empData.employees);
      if (billsData.success) setRecentBills(billsData.bills.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const todayStr = new Date().toLocaleDateString(language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalRev = finance?.totalRevenue || 0;
  const totalExp = finance?.totalExpenses || 0;
  const netProf = finance?.netProfit || 0;
  const settlementsPaid = finance?.totalSettlementsPaid || 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg shadow-amber-600/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-100 text-xs font-extrabold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-100" />
              <span>{t.overview.adminTitle}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t.appName}
            </h1>
            <p className="text-xs sm:text-sm text-amber-50 mt-1 max-w-xl font-medium">
              {language === 'si'
                ? 'ද්විත්ව මට්ටමේ POS විකිණුම්, ගතික මුළුතැන්ගෙයි කොමිස් බේරුම්කරණය, අත්තිකාරම් සහ මූල්‍ය කළමනාකරණය.'
                : language === 'ta'
                ? 'இரு அடுக்கு POS விற்பனை, மாறும் சமையலறை கமிஷன் தீர்வுகள், முன்பணங்கள் மற்றும் நிதி சமரசம்.'
                : 'Centralized food shop operational management: dual-tier POS sales, dynamic kitchen commission settlements, advances, and financial reconciliation.'}
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <div className="text-xs font-bold text-amber-100">{todayStr}</div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 text-white text-xs font-bold mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t.overview.allSystemsOperational}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.overview.grossSalesRevenue}
          value={`Rs. ${totalRev.toLocaleString()}`}
          subtitle={`${finance?.totalBillsCount || 0} ${t.overview.completedOrders}`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="amber"
        />

        <StatCard
          title={t.overview.totalExpenses}
          value={`Rs. ${totalExp.toLocaleString()}`}
          subtitle={language === 'si' ? 'විදුලිබල, ජල, ඇසුරුම් හා ප්‍රවාහන' : language === 'ta' ? 'மின்சாரம், தண்ணீர், போக்குவரத்து' : 'CEB, water, packaging, transport'}
          icon={<ReceiptText className="w-5 h-5" />}
          accentColor="rose"
        />

        <StatCard
          title={t.overview.kitchenSettlements}
          value={`Rs. ${settlementsPaid.toLocaleString()}`}
          subtitle={language === 'si' ? 'බේරුම් කළ කොමිස් මුදල්' : language === 'ta' ? 'செலுத்தப்பட்ட கமிஷன்கள்' : 'Commissions settled'}
          icon={<Coins className="w-5 h-5" />}
          accentColor="orange"
        />

        <StatCard
          title={t.overview.netProfit}
          value={`Rs. ${netProf.toLocaleString()}`}
          subtitle={language === 'si' ? 'ආදායම - වියදම් - බේරුම්කරණ' : language === 'ta' ? 'வருவாய் - செலவுகள் - தீர்வுகள்' : 'Revenue - Expenses - Settlements'}
          icon={<Wallet className="w-5 h-5" />}
          accentColor={netProf >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Quick Launch Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('settlements')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t.nav.settlements}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                {language === 'si' ? 'කාර්ය මණ්ඩල කොමිස් ගණනය හා අනුමැතිය' : language === 'ta' ? 'ஊழியர் கமிஷன்களைக் கணக்கிட்டு அங்கீகரித்தல்' : 'Calculate & approve staff commissions'}
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
        </button>

        <button
          onClick={() => onNavigateTab('employees')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-stone-900 group-hover:text-orange-800 transition-colors">
                {t.nav.employees}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                {language === 'si' ? 'සේවකයින් ලියාපදිංචිය හා කොමිස් % සැකසුම්' : language === 'ta' ? 'பணியாளர் பதிவு மற்றும் கமிஷன் % கட்டமைப்பு' : 'Register staff & configure commission %'}
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
        </button>

        <button
          onClick={() => onNavigateTab('finance')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                {t.nav.finance}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                {language === 'si' ? 'ගෙවීම් සැසඳීම හා ලාභ/අලාභ වාර්තා' : language === 'ta' ? 'பண சமரசம் மற்றும் லாப நட்ட அறிக்கைகள்' : 'Payment reconciliation & profit margins'}
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
        </button>
      </div>

      {/* Recent Bills */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {t.overview.recentBills}
          </h3>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
          >
            {t.overview.viewAllBills}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentBills.map((b) => (
            <div key={b.billId} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-mono font-bold text-slate-900">{b.billNumber}</div>
                <div className="text-[11px] text-slate-500">
                  {b.saleType === 'STAFF'
                    ? `${tr('STAFF SALE')} (${b.employeeName})`
                    : tr('CUSTOMER SALE')}{' '}
                  • {tr(b.paymentMethod)}
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-slate-900">Rs. {b.total}</div>
                <Badge status={b.status} className="mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
