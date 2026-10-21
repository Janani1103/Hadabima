'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Scale,
  Banknote,
  CreditCard,
  QrCode,
  Coins,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Building2,
  Receipt,
  Search,
  Check,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  ArrowDownRight,
  Info,
} from 'lucide-react';

interface BillItem {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Bill {
  billId: string;
  billNumber: string;
  cashierName: string;
  saleType: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  bankAccountId?: string;
  bankAccountName?: string;
  status: string;
  createdAt: string;
}

interface ClosingRecord {
  closingId: string;
  date: string;
  cashierName: string;
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  otherCashReceipts?: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  notes?: string;
  createdAt: string;
  depositAccountId?: string;
  depositAmount?: number;
}

interface PaymentReconciliationViewProps {
  currentCashier: {
    employeeId: string;
    fullName: string;
  };
  onNavigateTab?: (tab: string) => void;
}

export function PaymentReconciliationView({
  currentCashier,
  onNavigateTab,
}: PaymentReconciliationViewProps) {
  const { t, tr } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [bills, setBills] = useState<Bill[]>([]);
  const [closings, setClosings] = useState<ClosingRecord[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter & Search
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'CARD' | 'ONLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchReconciliationData(selectedDate);
  }, [selectedDate]);

  const fetchReconciliationData = async (targetDate: string) => {
    setIsLoading(true);
    try {
      const [billsRes, closingsRes, expRes, advRes, bankRes] = await Promise.all([
        fetch(`/api/bills?date=${targetDate}&status=COMPLETED`),
        fetch('/api/closings'),
        fetch(`/api/expenses?date=${targetDate}`),
        fetch('/api/advances'),
        fetch('/api/bank-accounts'),
      ]);

      const billsData = await billsRes.json();
      const closingsData = await closingsRes.json();
      const expData = await expRes.json();
      const advData = await advRes.json();
      const bankData = await bankRes.json();

      if (billsData.success) setBills(billsData.bills || []);
      if (closingsData.success) setClosings(closingsData.closings || []);
      if (expData.success) setExpenses(expData.expenses || []);
      if (advData.success) setAdvances(advData.advances || []);
      if (bankData.success && bankData.accounts) setBankAccounts(bankData.accounts);
    } catch (e) {
      console.error('Error fetching reconciliation data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Calculations for Payment Methods ---
  const validBills = bills.filter((b) => b.status !== 'VOIDED');

  const cashBills = validBills.filter((b) => b.paymentMethod === 'CASH');
  const cardBills = validBills.filter((b) => b.paymentMethod === 'CARD');
  const onlineBills = validBills.filter((b) => b.paymentMethod === 'ONLINE');

  const cashTotal = cashBills.reduce((sum, b) => sum + Number(b.total || 0), 0);
  const cardTotal = cardBills.reduce((sum, b) => sum + Number(b.total || 0), 0);
  const onlineTotal = onlineBills.reduce((sum, b) => sum + Number(b.total || 0), 0);
  const grandTotal = cashTotal + cardTotal + onlineTotal;

  // --- Expenses & Advances disbursed in cash ---
  const cashExpensesTotal = expenses
    .filter((e) => e.paymentMethod === 'CASH' && e.status === 'ACTIVE')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const cashAdvancesTotal = advances
    .filter(
      (a) =>
        a.date === selectedDate &&
        (a.disbursementSource === 'CASH_DRAWER' || !a.disbursementSource) &&
        a.status !== 'CANCELLED'
    )
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

  // --- Connected Daily Cash Closing for selectedDate ---
  const selectedDateClosing = closings.find((c) => c.date === selectedDate);
  const isClosed = !!selectedDateClosing;

  // Estimated expected drawer calculation
  const defaultOpeningFloat = 5000;
  const openingFloat = selectedDateClosing ? selectedDateClosing.openingCash : defaultOpeningFloat;
  const estimatedExpectedCash = isClosed
    ? selectedDateClosing.expectedCash
    : openingFloat + cashTotal - cashExpensesTotal - cashAdvancesTotal;

  // --- Bank Deposit breakdown for Card/Online ---
  const bankBreakdown: { [accId: string]: { name: string; cardAmount: number; onlineAmount: number; count: number } } = {};
  [...cardBills, ...onlineBills].forEach((b) => {
    const accId = b.bankAccountId || 'UNLINKED';
    const accName = b.bankAccountName || (accId === 'UNLINKED' ? 'General Business Account' : accId);
    if (!bankBreakdown[accId]) {
      bankBreakdown[accId] = { name: accName, cardAmount: 0, onlineAmount: 0, count: 0 };
    }
    if (b.paymentMethod === 'CARD') {
      bankBreakdown[accId].cardAmount += Number(b.total || 0);
    } else {
      bankBreakdown[accId].onlineAmount += Number(b.total || 0);
    }
    bankBreakdown[accId].count += 1;
  });

  // Filtered bills for list
  const filteredBills = validBills.filter((b) => {
    if (methodFilter !== 'ALL' && b.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = b.billNumber.toLowerCase().includes(q);
      const matchMethod = b.paymentMethod.toLowerCase().includes(q);
      const matchBank = (b.bankAccountName || '').toLowerCase().includes(q);
      return matchNumber || matchMethod || matchBank;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{tr("Cashier Payment & POS Reconciliation")}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {tr("Reconcile daily customer receipts, cash drawer balance, card settlements, and bank deposits")}
          </p>
        </div>

        {/* Date Selector & Quick Refresh */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs text-stone-600 font-semibold">{tr("Date")}:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-stone-900 font-bold focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchReconciliationData(selectedDate)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            title={tr("Refresh")}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* DAILY COLLECTIONS SUMMARY CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
            <span>{tr("Daily Collections Summary")} ({selectedDate})</span>
            {selectedDate === todayStr && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {tr("Today")} ({tr("POS Live")})
              </span>
            )}
          </h3>
          <span className="text-xs text-stone-500">{validBills.length} {tr("completed orders")}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CASH SALES */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">{tr("Cash Sales Total")}</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              Rs. {cashTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-50 text-[11px] text-stone-500">
              <span>{cashBills.length} {tr("cash transactions")}</span>
              <span className="font-semibold text-emerald-600">
                {grandTotal > 0 ? `${Math.round((cashTotal / grandTotal) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* CARD SALES */}
          <div className="bg-white border border-blue-200 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">{tr("Card Sales Total")}</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2">
              Rs. {cardTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-50 text-[11px] text-stone-500">
              <span>{cardBills.length} {tr("card transactions")}</span>
              <span className="font-semibold text-blue-600">
                {grandTotal > 0 ? `${Math.round((cardTotal / grandTotal) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* ONLINE / QR SALES */}
          <div className="bg-white border border-violet-200 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">{tr("Online / Bank Total")}</span>
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-violet-700 mt-2">
              Rs. {onlineTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-violet-50 text-[11px] text-stone-500">
              <span>{onlineBills.length} {tr("online transactions")}</span>
              <span className="font-semibold text-violet-600">
                {grandTotal > 0 ? `${Math.round((onlineTotal / grandTotal) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* GRAND TOTAL */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4.5 shadow-md shadow-orange-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-100">{tr("Total POS Turnover")}</span>
              <div className="p-2 rounded-xl bg-white/20 text-white">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              Rs. {grandTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-[11px] text-amber-100">
              <span>100% {tr("Total Gross Daily Sales")}</span>
              <span className="font-bold">{validBills.length} {tr("bills issued")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY CASH CLOSING CONNECTION CARD */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                isClosed
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-stone-900 text-sm">
                  {tr("Drawer Cash Reconciliation")}
                </h3>
                {isClosed ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {tr("COMPLETED")}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {tr("PENDING")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {tr("Reconcile physical cash drawer with POS cash transactions and operational payouts")}
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('closing')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-600/20 cursor-pointer transition-all shrink-0"
            >
              <span>{isClosed ? tr("Perform Cash Closing") : tr("Perform Cash Closing")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Breakdown Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Opening Float */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500 text-[11px]">{tr("Opening")}</div>
              <div className="text-base font-bold text-stone-800 mt-1">
                Rs. {openingFloat.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">{tr("Drawer initial float")}</div>
            </div>

            {/* Cash Sales */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-emerald-800 font-semibold text-[11px]">+{tr("Today's Cash Sales")}</div>
              <div className="text-base font-extrabold text-emerald-800 mt-1">
                +Rs. {cashTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">From {cashBills.length} {tr("bills")}</div>
            </div>

            {/* Cash Expenses */}
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="text-rose-800 font-semibold text-[11px]">-{tr("Operating Expenses")}</div>
              <div className="text-base font-extrabold text-rose-700 mt-1">
                -Rs. {cashExpensesTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-600/80 mt-0.5">{tr("Drawer Cash")}</div>
            </div>

            {/* Cash Advances */}
            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200">
              <div className="text-orange-800 font-semibold text-[11px]">-{tr("Staff Cash Advances Given")}</div>
              <div className="text-base font-extrabold text-orange-700 mt-1">
                -Rs. {cashAdvancesTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-orange-600/80 mt-0.5">{tr("Staff Cash Advances Given")}</div>
            </div>

            {/* Expected Cash */}
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
              <div className="text-sky-800 font-semibold text-[11px]">{tr("Expected Cash")}</div>
              <div className="text-base font-black text-sky-900 mt-1">
                Rs. {estimatedExpectedCash.toLocaleString()}
              </div>
              <div className="text-[10px] text-sky-600 mt-0.5">{tr("Formula calculation")}</div>
            </div>

            {/* Actual Counted Cash & Discrepancy */}
            <div
              className={`p-3 rounded-xl border ${
                isClosed
                  ? selectedDateClosing.difference === 0
                    ? 'bg-emerald-50 border-emerald-300'
                    : selectedDateClosing.difference > 0
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-rose-50 border-rose-300'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="text-stone-600 text-[11px]">
                {isClosed ? tr("Actual Counted") : tr("Status")}
              </div>
              <div className="text-base font-black text-stone-900 mt-1">
                {isClosed ? `Rs. ${selectedDateClosing.actualCash.toLocaleString()}` : tr("PENDING")}
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {isClosed ? (
                  selectedDateClosing.difference === 0 ? (
                    <span className="text-emerald-700">{tr("Balanced (Exact)")}</span>
                  ) : selectedDateClosing.difference > 0 ? (
                    <span className="text-blue-700">+Rs. {selectedDateClosing.difference} ({tr("Variance")})</span>
                  ) : (
                    <span className="text-rose-700">-Rs. {Math.abs(selectedDateClosing.difference)} ({tr("Variance")})</span>
                  )
                ) : (
                  <span className="text-amber-700">{tr("Audit unfinalized")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BANK RECONCILIATION FOR CARD & ONLINE PAYMENTS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              {tr("Bank Accounts")} ({tr("Today's Card / Online Sales")})
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {tr("TOTAL")}: <strong className="text-stone-900">Rs. {(cardTotal + onlineTotal).toLocaleString()}</strong>
          </span>
        </div>

        {Object.keys(bankBreakdown).length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            {tr("No sales recorded yet today")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(bankBreakdown).map(([accId, data]) => {
              const totalBankDeposits = data.cardAmount + data.onlineAmount;
              return (
                <div
                  key={accId}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900 truncate max-w-[180px]" title={data.name}>
                      {data.name}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {data.count} {tr("bills")}
                    </span>
                  </div>

                  <div className="text-lg font-black text-stone-900">
                    Rs. {totalBankDeposits.toLocaleString()}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] text-stone-500">
                    <span>{tr("CARD")}: <strong className="text-blue-700">Rs. {data.cardAmount.toLocaleString()}</strong></span>
                    <span>{tr("ONLINE")}: <strong className="text-violet-700">Rs. {data.onlineAmount.toLocaleString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED TRANSACTIONS LIST FOR SELECTED DATE */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              {tr("POS Cash Transactions")} ({selectedDate})
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {tr("Sales automatically synchronized with POS checkout transactions.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Method Filters */}
            <div className="flex bg-stone-100 p-0.5 rounded-xl text-xs">
              {(['ALL', 'CASH', 'CARD', 'ONLINE'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setMethodFilter(method)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    methodFilter === method
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {method === 'ALL' ? tr("All Roles") : tr(method)}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={tr("Search by food item or code...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-3 px-4">{tr("Bill #")}</th>
                <th className="py-3 px-4">{tr("Time")}</th>
                <th className="py-3 px-4">{tr("Sale Type")}</th>
                <th className="py-3 px-4 text-center">{tr("Payment Method")}</th>
                <th className="py-3 px-4">{tr("Bank Accounts")}</th>
                <th className="py-3 px-4 text-center">{tr("Quantity")}</th>
                <th className="py-3 px-4 text-right">{tr("TOTAL")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    {tr("No sales recorded yet today")}
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.billId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-stone-900">
                      {b.billNumber}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-stone-600">
                      {new Date(b.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.saleType === 'STAFF'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {tr(b.saleType)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.paymentMethod === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.paymentMethod === 'CARD'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-violet-100 text-violet-800'
                        }`}
                      >
                        {tr(b.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-stone-600 truncate max-w-xs">
                      {b.bankAccountName || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-stone-800">
                      {b.items.reduce((s, it) => s + Number(it.quantity), 0)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-stone-900 text-sm">
                      Rs. {b.total.toLocaleString()}
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
