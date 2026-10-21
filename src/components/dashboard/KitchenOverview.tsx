'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import {
  ChefHat,
  Utensils,
  Coins,
  BadgeDollarSign,
  ArrowRight,
} from 'lucide-react';

interface KitchenOverviewProps {
  currentStaff: {
    fullName: string;
    employeeId: string;
    commissionRate: number;
  };
  onNavigateTab: (tab: string) => void;
}

export function KitchenOverview({ currentStaff, onNavigateTab }: KitchenOverviewProps) {
  const { t, tr } = useLanguage();
  const [preparations, setPreparations] = useState<any[]>([]);
  const [settlement, setSettlement] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchKitchenOverview();
  }, []);

  const fetchKitchenOverview = async () => {
    try {
      const [prepRes, setRes] = await Promise.all([
        fetch(`/api/preparations?date=${todayStr}&kitchenStaffId=${currentStaff.employeeId}`),
        fetch(`/api/settlements?date=${todayStr}&kitchenStaffId=${currentStaff.employeeId}`),
      ]);
      const prepData = await prepRes.json();
      const setData = await setRes.json();

      if (prepData.success) setPreparations(prepData.preparations);
      if (setData.success && setData.settlements?.length > 0) {
        setSettlement(setData.settlements[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalPrepared = preparations.reduce((sum, p) => sum + Number(p.preparedQuantity), 0);
  const totalSold = preparations.reduce((sum, p) => sum + Number(p.soldQuantity), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
            {tr("Kitchen Production Portal")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {tr("Welcome, Chef")} {currentStaff.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl font-medium">
            {tr("Assigned items, food shelf life tracking, batch preparation, and daily commission settlement calculations")}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Today's Items Prepared"
          value={`${totalPrepared} ${tr("units")}`}
          subtitle={`${preparations.length} ${tr("active batches")}`}
          icon={<Utensils className="w-5 h-5" />}
          accentColor="orange"
        />

        <StatCard
          title="Units Sold at POS"
          value={`${totalSold} ${tr("units")}`}
          subtitle="Customer + Staff sales"
          icon={<Coins className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Estimated Daily Earnings"
          value={`Rs. ${settlement ? settlement.netPayment : '0'}`}
          subtitle={settlement ? `${tr("Status")}: ${tr(settlement.status)}` : "Pending calculation"}
          icon={<BadgeDollarSign className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Quick Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('preparations')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 group-hover:scale-110 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-amber-700">
                {tr("Food Preparation & Expiry")}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Log batches & wastage")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>

        <button
          onClick={() => onNavigateTab('earnings')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 group-hover:scale-110 transition-transform">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-emerald-700">
                {tr("My Earnings & Settlement")}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Transparent payment formula")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>

        <button
          onClick={() => onNavigateTab('advances')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-orange-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-orange-700">
                {tr("My Advances")}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Track outstanding balances")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>
      </div>

      {/* Today's Active Batches Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">{tr("Today's Active Production Batches")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-3">{tr("Item")}</th>
                <th className="py-3 px-3 text-center">{tr("Prepared")}</th>
                <th className="py-3 px-3 text-center">{tr("Sold")}</th>
                <th className="py-3 px-3 text-center">{tr("Remaining")}</th>
                <th className="py-3 px-3">{tr("Expiry Date")}</th>
                <th className="py-3 px-3 text-center">{tr("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {preparations.map((p) => (
                <tr key={p.preparationId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{tr(p.foodItemName)}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">{p.preparedQuantity}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{p.soldQuantity}</td>
                  <td className="py-2.5 px-3 text-center font-black text-amber-700">{p.remainingQuantity}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.expiryDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
