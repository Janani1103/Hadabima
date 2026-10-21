'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import {
  BadgeDollarSign,
  Coins,
  Wallet,
  TrendingUp,
  Percent,
  Calendar,
  Clock,
} from 'lucide-react';

interface Settlement {
  settlementId: string;
  date: string;
  commissionRate: number;
  customerSalesValue: number;
  staffSalesValue: number;
  totalEligibleSales: number;
  grossCommission: number;
  advanceDeduction: number;
  staffPurchaseDeduction: number;
  netPayment: number;
  status: string;
}

interface Advance {
  advanceId: string;
  date: string;
  amount: number;
  remainingAmount: number;
  reason: string;
  status: string;
}

interface EarningsCalculatorProps {
  currentStaff: {
    employeeId: string;
    fullName: string;
    commissionRate: number;
  };
}

export function EarningsCalculator({ currentStaff }: EarningsCalculatorProps) {
  const { t, tr } = useLanguage();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchPersonalData();
  }, [selectedDate]);

  const fetchPersonalData = async () => {
    try {
      const [settlesRes, advRes] = await Promise.all([
        fetch(`/api/settlements?kitchenStaffId=${currentStaff.employeeId}`),
        fetch(`/api/advances?employeeId=${currentStaff.employeeId}`),
      ]);

      const settlesData = await settlesRes.json();
      const advData = await advRes.json();

      if (settlesData.success) setSettlements(settlesData.settlements || []);
      if (advData.success) setAdvances(advData.advances || []);
    } catch (e) {
      console.error(e);
    }
  };

  const todaySettlement = settlements.find((s) => s.date === selectedDate);
  const totalEarnedPaid = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.netPayment), 0);

  const activeAdvance = advances.find((a) => a.remainingAmount > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BadgeDollarSign className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.nav.myEarnings}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Rule 10 & 22: Performance-based commission ({currentStaff.commissionRate}%) calculated from your assigned food sales
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-stone-900 font-medium focus:outline-hidden"
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Commission Rate"
          value={`${currentStaff.commissionRate}%`}
          subtitle="Configured by Admin"
          icon={<Percent className="w-5 h-5" />}
          accentColor="amber"
        />

        <StatCard
          title="Today's Estimated Net Earning"
          value={`Rs. ${todaySettlement ? todaySettlement.netPayment : '0'}`}
          subtitle={`Gross: Rs. ${todaySettlement ? todaySettlement.grossCommission : '0'}`}
          icon={<Coins className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Advance Outstanding Balance"
          value={`Rs. ${activeAdvance ? activeAdvance.remainingAmount : '0'}`}
          subtitle={activeAdvance ? `Original: Rs. ${activeAdvance.amount}` : 'No active advances'}
          icon={<Wallet className="w-5 h-5" />}
          accentColor="rose"
        />
      </div>

      {/* Today's Settlement Breakdown Card */}
      {todaySettlement ? (
        <div className="bg-white border border-amber-200 shadow-sm p-6 rounded-2xl space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {tr("Daily Performance Breakdown")} ({todaySettlement.date})
              </h3>
              <span className="text-[11px] text-stone-500">
                {tr("Formula: Gross Commission")} ({todaySettlement.commissionRate}%) - {t.settlement.advanceDeduction}
              </span>
            </div>
            <Badge status={todaySettlement.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500">{t.settlement.customerSales}</div>
              <div className="text-base font-bold text-stone-900 mt-1">
                Rs. {todaySettlement.customerSalesValue}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500">{t.settlement.staffSales}</div>
              <div className="text-base font-bold text-orange-700 mt-1">
                Rs. {todaySettlement.staffSalesValue}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500">{t.settlement.totalSales}</div>
              <div className="text-base font-black text-stone-900 mt-1">
                Rs. {todaySettlement.totalEligibleSales}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300">
              <div className="text-amber-800 font-semibold">{t.settlement.grossCommission}</div>
              <div className="text-lg font-black text-amber-900 mt-1">
                Rs. {todaySettlement.grossCommission}
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">
              {tr("Deductions Applied")}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between p-2.5 rounded-lg bg-white border border-stone-200">
                <span className="text-stone-600">{t.settlement.advanceDeduction}</span>
                <span className="font-bold text-rose-600">-Rs. {todaySettlement.advanceDeduction}</span>
              </div>
            </div>
          </div>

          {/* Final Net Amount */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 shadow-md text-white flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                {t.settlement.finalPayment}
              </div>
              <div className="text-3xl font-black text-white mt-0.5">
                Rs. {todaySettlement.netPayment}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-100">{tr("Settlement State")}</div>
              <Badge status={todaySettlement.status} className="mt-1" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 p-6 rounded-2xl text-center text-xs text-stone-500 shadow-xs">
          {tr("No settlement records found.")} ({selectedDate})
        </div>
      )}

      {/* Settlements & Daily Earnings History Table */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-sm">{tr("Earnings & Settlement History")}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-stone-400 italic">{tr("Click a row to inspect breakdown")}</span>
            <span className="text-xs text-stone-500 font-medium bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
              {settlements.length} {tr("Daily Records")}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-2.5 px-3">{tr("Date")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Gross (Rs.)")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Commission (Rs.)")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Advance (Rs.)")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Net Payment (Rs.)")}</th>
                <th className="py-2.5 px-3 text-center">{tr("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    {tr("No settlement records found.")}
                  </td>
                </tr>
              ) : (
                [...settlements]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <tr
                      key={s.settlementId}
                      onClick={() => setSelectedDate(s.date)}
                      title="Click to view performance breakdown for this date"
                      className={`hover:bg-amber-50/60 cursor-pointer transition-colors ${
                        s.date === selectedDate ? 'bg-amber-50/70 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                        {s.date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-stone-900">
                        Rs. {(s.totalEligibleSales ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                        Rs. {(s.grossCommission ?? 0).toLocaleString()}
                        <span className="text-[10px] text-stone-400 font-normal ml-1">
                          ({s.commissionRate}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.advanceDeduction > 0 ? (
                          <span className="font-semibold text-rose-600">
                            -Rs. {s.advanceDeduction.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-stone-400 font-normal">Rs. 0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                        Rs. {(s.netPayment ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge status={s.status} />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
