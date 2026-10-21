'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Lock, Calculator, CheckCircle2, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface ClosingRecord {
  closingId: string;
  date: string;
  cashierName: string;
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  notes?: string;
  createdAt: string;
}

interface DailyClosingViewProps {
  currentCashier: {
    employeeId: string;
    fullName: string;
  };
}

export function DailyClosingView({ currentCashier }: DailyClosingViewProps) {
  const { t, tr } = useLanguage();

  const [closings, setClosings] = useState<ClosingRecord[]>([]);
  const [openingCash, setOpeningCash] = useState<string>('5000');
  const [actualCash, setActualCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');

  const [todayCashSales, setTodayCashSales] = useState<number>(0);
  const [todayCashExpenses, setTodayCashExpenses] = useState<number>(0);
  const [todayCashAdvances, setTodayCashAdvances] = useState<number>(0);

  // Bank Deposit on Closing
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [depositToBank, setDepositToBank] = useState<boolean>(false);
  const [depositAccountId, setDepositAccountId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchClosingsAndTodayStats();
  }, []);

  const fetchClosingsAndTodayStats = async () => {
    try {
      const [closingsRes, billsRes, expRes, advRes, bankRes] = await Promise.all([
        fetch('/api/closings'),
        fetch(`/api/bills?date=${todayStr}&status=COMPLETED`),
        fetch(`/api/expenses?date=${todayStr}`),
        fetch('/api/advances'),
        fetch('/api/bank-accounts'),
      ]);

      const closingsData = await closingsRes.json();
      const billsData = await billsRes.json();
      const expData = await expRes.json();
      const advData = await advRes.json();
      const bankData = await bankRes.json();

      if (closingsData.success) setClosings(closingsData.closings);

      if (billsData.success) {
        const cashBills = billsData.bills.filter((b: any) => b.paymentMethod === 'CASH');
        const salesTotal = cashBills.reduce((sum: number, b: any) => sum + Number(b.total), 0);
        setTodayCashSales(salesTotal);
      }

      if (expData.success) {
        const cashExp = expData.expenses.filter((e: any) => e.paymentMethod === 'CASH' && e.status === 'ACTIVE');
        const expTotal = cashExp.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        setTodayCashExpenses(expTotal);
      }

      if (advData.success) {
        const todayAdv = (advData.advances || []).filter(
          (a: any) =>
            a.date === todayStr &&
            (a.disbursementSource === 'CASH_DRAWER' || !a.disbursementSource) &&
            a.status !== 'CANCELLED'
        );
        const advTotal = todayAdv.reduce((sum: number, a: any) => sum + Number(a.amount), 0);
        setTodayCashAdvances(advTotal);
      }

      if (bankData.success && bankData.accounts) {
        setBankAccounts(bankData.accounts);
        if (bankData.accounts.length > 0 && !depositAccountId) {
          setDepositAccountId(bankData.accounts[0].accountId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const opening = Number(openingCash) || 0;
  const expected = opening + todayCashSales - todayCashExpenses - todayCashAdvances;
  const actual = Number(actualCash) || 0;
  const diff = actualCash !== '' ? actual - expected : 0;

  const handleSubmitClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === '') {
      setMessage({ type: 'error', text: 'Please enter actual counted cash amount.' });
      return;
    }

    if (depositToBank && (!depositAccountId || Number(depositAmount) <= 0)) {
      setMessage({ type: 'error', text: 'Please select a bank account and enter valid deposit amount.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingCash: opening,
          actualCash: actual,
          notes: closingNotes,
          cashierId: currentCashier.employeeId,
          cashierName: currentCashier.fullName,
          date: todayStr,
          depositToBank,
          depositAccountId,
          depositAmount: Number(depositAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({
          type: 'success',
          text: depositToBank
            ? `${t.closing.closedSuccess} & Rs.${Number(depositAmount).toLocaleString()} deposited to bank account!`
            : t.closing.closedSuccess,
        });
        setActualCash('');
        setClosingNotes('');
        setDepositToBank(false);
        setDepositAmount('');
        fetchClosingsAndTodayStats();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.closing.title}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {tr("Reconcile physical cash drawer with POS cash transactions and operational payouts")}
          </p>
        </div>

        <div className="text-xs font-mono bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 font-bold">
          {tr("Today")}: {todayStr}
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Closing Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">{tr("Perform Daily Cash Closing")}</h3>

          <form onSubmit={handleSubmitClosing} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {t.closing.openingCash} (Rs.)
              </label>
              <input
                type="number"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>+ {t.closing.cashSales}</span>
                <span className="font-semibold text-stone-900">Rs. {todayCashSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>- {t.closing.cashExpenses}</span>
                <span className="font-semibold text-rose-600">Rs. {todayCashExpenses.toLocaleString()}</span>
              </div>
              {todayCashAdvances > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span className="text-orange-800 font-medium">- {tr("Staff Cash Advances Given")}</span>
                  <span className="font-bold text-orange-700">Rs. {todayCashAdvances.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-amber-900 pt-1.5 border-t border-stone-200 text-xs">
                <span>= {t.closing.expectedCash}</span>
                <span>Rs. {expected.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {t.closing.actualCash} ({tr("Counted in Drawer")}) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder={tr("Count physical cash")}
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-black text-sm focus:outline-hidden focus:border-amber-600"
              />
            </div>

            {/* Deposit Surplus Cash to Business Bank Account */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-amber-950 text-xs">
                <input
                  type="checkbox"
                  checked={depositToBank}
                  onChange={(e) => {
                    setDepositToBank(e.target.checked);
                    if (e.target.checked && actual !== 0) {
                      // Pre-fill surplus if actual exceeds expected opening float
                      setDepositAmount(String(Math.max(0, actual - opening)));
                    }
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>{tr("Deposit Surplus to Business Bank Account")}</span>
              </label>

              {depositToBank && (
                <div className="space-y-2 pt-1 border-t border-amber-200/80 animate-fadeIn">
                  <div>
                    <label className="block text-stone-700 font-semibold text-[11px] mb-1">
                      {tr("Target Business Bank Account *")}
                    </label>
                    <select
                      value={depositAccountId}
                      onChange={(e) => setDepositAccountId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs font-bold focus:outline-hidden"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.accountId} value={b.accountId}>
                          {b.bankName} - A/C {b.accountNumber} ({b.branch})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold text-[11px] mb-1">
                      {tr("Cash Amount to Deposit (Rs.) *")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs font-black focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {actualCash !== '' && (
              <div
                className={`p-3 rounded-xl border flex justify-between items-center ${
                  diff === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : diff > 0
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span className="font-semibold">{t.closing.difference}:</span>
                <span className="font-extrabold text-sm">
                  {diff > 0 ? `+Rs. ${diff}` : `Rs. ${diff}`}
                </span>
              </div>
            )}

            <div>
              <label className="block text-stone-700 font-semibold mb-1">{tr("Closing Notes / Discrepancy Reason")}</label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding discrepancy..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-600/20 cursor-pointer transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>{t.closing.performClosing}</span>
            </button>
          </form>
        </div>

        {/* Closings Log Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">{t.closing.closingHistory}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">{tr("Date")}</th>
                  <th className="py-2.5 px-3">{tr("Cashier")}</th>
                  <th className="py-2.5 px-3">{tr("Opening")}</th>
                  <th className="py-2.5 px-3">{tr("Cash Sales")}</th>
                  <th className="py-2.5 px-3">{tr("Expected")}</th>
                  <th className="py-2.5 px-3">{tr("Actual Counted")}</th>
                  <th className="py-2.5 px-3 text-right">{tr("Variance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {closings.map((c) => (
                  <tr key={c.closingId} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono">{c.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{c.cashierName}</td>
                    <td className="py-2.5 px-3">Rs. {c.openingCash}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Rs. {c.cashSales}</td>
                    <td className="py-2.5 px-3">Rs. {c.expectedCash}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">Rs. {c.actualCash}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-extrabold ${
                        c.difference === 0
                          ? 'text-emerald-600'
                          : c.difference > 0
                          ? 'text-orange-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {c.difference > 0 ? `+Rs. ${c.difference}` : `Rs. ${c.difference}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
