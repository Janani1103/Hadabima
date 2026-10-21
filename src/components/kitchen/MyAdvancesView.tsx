'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  X,
  Coins,
  Clock,
  Receipt,
  Calendar,
} from 'lucide-react';

interface Advance {
  advanceId: string;
  date: string;
  amount: number;
  remainingAmount: number;
  reason: string;
  approvedBy: string;
  status: string;
}

interface MyAdvancesViewProps {
  currentStaff: {
    employeeId: string;
    fullName: string;
  };
}

export function MyAdvancesView({ currentStaff }: MyAdvancesViewProps) {
  const { t, tr } = useLanguage();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      const res = await fetch(`/api/advances?employeeId=${currentStaff.employeeId}`);
      const data = await res.json();
      if (data.success) {
        setAdvances(data.advances || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for Summary Cards
  const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalRemaining = advances.reduce((sum, a) => sum + Number(a.remainingAmount || 0), 0);
  const totalDeducted = Math.max(0, totalAdvances - totalRemaining);

  const activeAdvancesCount = advances.filter((a) => (Number(a.remainingAmount) || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.nav.myAdvances}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Section 26: View full advance history, automatic settlement deductions, and outstanding balance.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Advances */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Total Advances")}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            Rs. {totalAdvances.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {advances.length} {tr("advance record(s) logged")}
          </div>
        </div>

        {/* Deducted */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Deducted (Recovered)")}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            Rs. {totalDeducted.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">
            {tr("Deducted via daily settlement payouts")}
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Remaining Balance")}</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            Rs. {totalRemaining.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {activeAdvancesCount > 0
              ? `${activeAdvancesCount} ${tr("active advance pending deduction")}`
              : tr("All advances cleared")}
          </div>
        </div>
      </div>

      {/* ADVANCE HISTORY TABLE */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">{tr("Advance History")}</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {tr("Staff Salary Advances Management")}
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
            {advances.length} {tr("Records Found")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-3 px-4">{tr("Advance ID")}</th>
                <th className="py-3 px-4">{tr("Date Granted")}</th>
                <th className="py-3 px-4 text-right">{tr("Total Advance")}</th>
                <th className="py-3 px-4 text-right">{tr("Settled / Deducted")}</th>
                <th className="py-3 px-4 text-right">{tr("Remaining Balance")}</th>
                <th className="py-3 px-4">{tr("Reason / Notes")}</th>
                <th className="py-3 px-4">{tr("Approved By")}</th>
                <th className="py-3 px-4 text-center">{tr("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    {tr("No settlement records found.")}
                  </td>
                </tr>
              ) : (
                advances.map((a) => {
                  const deducted = Math.max(0, Number(a.amount) - Number(a.remainingAmount));
                  const isCleared = Number(a.remainingAmount) === 0;

                  return (
                    <tr key={a.advanceId} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">
                        {a.advanceId}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {a.date}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900">
                        Rs. {Number(a.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {deducted > 0 ? (
                          <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Rs. {deducted.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-stone-400 font-normal">Rs. 0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        {isCleared ? (
                          <span className="text-stone-400 font-normal">Rs. 0</span>
                        ) : (
                          <span className="text-rose-700">
                            Rs. {Number(a.remainingAmount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate" title={a.reason}>
                        {a.reason}
                      </td>
                      <td className="py-3 px-4 text-stone-500 text-xs">
                        {a.approvedBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={isCleared ? 'CLEARED' : a.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
