'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Scale,
  ReceiptText,
  Calendar,
  Wallet,
  Coins,
  Building2,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Landmark,
  Utensils,
  Paperclip,
  ExternalLink,
  FileText,
  PieChart,
  Layers,
  ArrowRight,
  Clock,
  Eye,
} from 'lucide-react';

interface FinanceSummary {
  totalRevenue: number;
  customerSalesValue: number;
  staffSalesValue: number;
  totalExpenses: number;
  totalSettlementsPaid: number;
  netProfit: number;
  reconciliation: {
    cash: number;
    card: number;
    online: number;
    total: number;
  };
  treasury?: {
    bankAccounts: any[];
    totalBankBalance: number;
    estimatedCashInDrawer: number;
    totalLiquidAssets: number;
  };
  topItems: { name: string; quantity: number; revenue: number }[];
  totalBillsCount: number;
}

type FinanceTab = 'overview' | 'cash' | 'banking' | 'kitchen' | 'expenses';

export function FinanceView() {
  const { t, tr } = useLanguage();

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Financial Data State
  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0,
    customerSalesValue: 0,
    staffSalesValue: 0,
    totalExpenses: 0,
    totalSettlementsPaid: 0,
    netProfit: 0,
    reconciliation: {
      cash: 0,
      card: 0,
      online: 0,
      total: 0,
    },
    topItems: [],
    totalBillsCount: 0,
  });

  // Additional Sub-module Data
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [advancesSummary, setAdvancesSummary] = useState<{ totalGranted: number; pendingRecovery: number; totalDeducted: number }>({
    totalGranted: 0,
    pendingRecovery: 0,
    totalDeducted: 0,
  });
  const [expensesList, setExpensesList] = useState<any[]>([]);

  // Modals
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Form States
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);

  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [depositDesc, setDepositDesc] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all finance modules
  const fetchAllFinanceData = async () => {
    setLoading(true);
    try {
      const summaryUrl = selectedDate ? `/api/finance/summary?date=${selectedDate}` : '/api/finance/summary';
      const closingsUrl = '/api/closings';
      const settlementsUrl = selectedDate ? `/api/settlements?date=${selectedDate}` : '/api/settlements';
      const advancesUrl = '/api/advances';
      const expensesUrl = selectedDate ? `/api/expenses?date=${selectedDate}` : '/api/expenses';
      const banksUrl = '/api/bank-accounts';

      const [summaryRes, banksRes, closingsRes, settlementsRes, advancesRes, expensesRes] = await Promise.all([
        fetch(summaryUrl),
        fetch(banksUrl),
        fetch(closingsUrl),
        fetch(settlementsUrl),
        fetch(advancesUrl),
        fetch(expensesUrl),
      ]);

      const [summaryData, banksData, closingsData, settlementsData, advancesData, expensesData] = await Promise.all([
        summaryRes.json(),
        banksRes.json(),
        closingsRes.json(),
        settlementsRes.json(),
        advancesRes.json(),
        expensesRes.json(),
      ]);

      if (summaryData.success && summaryData.summary) {
        setSummary(summaryData.summary);
      }
      if (banksData.success) {
        setBankAccounts(banksData.accounts || []);
        setBankTransactions(banksData.transactions || []);
        if (banksData.accounts?.length > 0 && !depositAccountId) {
          setDepositAccountId(banksData.accounts[0].accountId);
        }
      }
      if (closingsData.success) {
        setClosings(closingsData.closings || []);
      }
      if (settlementsData.success) {
        setSettlements(settlementsData.settlements || []);
      }
      if (advancesData.success) {
        setAdvances(advancesData.advances || []);
        setAdvancesSummary({
          totalGranted: advancesData.totalGranted || 0,
          pendingRecovery: advancesData.pendingRecovery || 0,
          totalDeducted: advancesData.totalDeducted || 0,
        });
      }
      if (expensesData.success) {
        setExpensesList(expensesData.expenses || []);
      }
    } catch (err: any) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFinanceData();
  }, [selectedDate]);

  // Create Bank Account
  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newAccountNumber || !newBranch) {
      setMessage({ type: 'error', text: 'Please fill in Bank Name, Account Number, and Branch.' });
      return;
    }

    setIsAddingBank(true);
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: newBankName,
          accountName: newAccountName || `${newBankName} Corporate Account`,
          accountNumber: newAccountNumber,
          branch: newBranch,
          balance: Number(newInitialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add bank account' });
      } else {
        setMessage({ type: 'success', text: `Bank Account for ${newBankName} added successfully!` });
        setShowAddBankModal(false);
        setNewBankName('');
        setNewAccountName('');
        setNewAccountNumber('');
        setNewBranch('');
        setNewInitialBalance('');
        fetchAllFinanceData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsAddingBank(false);
    }
  };

  // Record Deposit
  const handleRecordDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAccountId || !depositAmount) {
      setMessage({ type: 'error', text: 'Select bank account and enter deposit amount.' });
      return;
    }

    setIsDepositing(true);
    try {
      const res = await fetch('/api/bank-accounts/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: depositAccountId,
          amount: Number(depositAmount),
          reference: depositRef || `DEP-${Date.now().toString().slice(-6)}`,
          description: depositDesc || 'Cash Drawer Deposit to Bank',
          performedBy: 'Janani Nethma (Admin)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to record deposit' });
      } else {
        setMessage({ type: 'success', text: `Deposit of Rs. ${Number(depositAmount).toLocaleString()} recorded!` });
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositRef('');
        setDepositDesc('');
        fetchAllFinanceData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsDepositing(false);
    }
  };

  const {
    totalRevenue,
    customerSalesValue,
    staffSalesValue,
    totalExpenses,
    totalSettlementsPaid,
    netProfit,
    reconciliation,
    treasury,
  } = summary;

  const totalBankBalance = treasury?.totalBankBalance ?? 0;
  const estimatedCashInDrawer = treasury?.estimatedCashInDrawer ?? reconciliation.cash;
  const totalLiquidAssets = treasury?.totalLiquidAssets ?? (totalBankBalance + estimatedCashInDrawer);
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Calculations for Petty Cash & Drawer Tab
  const latestClosing = closings.length > 0 ? closings[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Header: Title, Global Date Filter & Action Buttons */}
      <div className="bg-white border border-stone-200 shadow-xs p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700 border border-amber-200">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Financial Hub & Treasury Management</h2>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Executive profit & loss, cash drawer balances, bank accounts, kitchen settlements & expense ledgers.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-900 focus:outline-hidden"
              title="Filter by specific date"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[10px] bg-stone-200 hover:bg-stone-300 px-1.5 py-0.5 rounded text-stone-700 font-bold ml-1 cursor-pointer"
                title="Clear date filter"
              >
                All
              </button>
            )}
          </div>

          <button
            onClick={fetchAllFinanceData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 cursor-pointer transition-colors shadow-2xs"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border font-bold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-stone-400 hover:text-stone-700 p-1">
            ✕
          </button>
        </div>
      )}

      {/* 5-TAB NAVIGATION BAR */}
      <div className="bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/80 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <PieChart className="w-4 h-4 text-amber-600" />
          <span>1. {tr("P&L & Overview")}</span>
        </button>

        <button
          onClick={() => setActiveTab('cash')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'cash'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>2. {tr("Petty Cash & Drawer")}</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'banking'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Landmark className="w-4 h-4 text-blue-600" />
          <span>3. {tr("Bank Accounts")}</span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'kitchen'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Coins className="w-4 h-4 text-orange-600" />
          <span>4. {tr("Kitchen Payouts & Advances")}</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <ReceiptText className="w-4 h-4 text-rose-600" />
          <span>5. {tr("Operating Expenses")}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: P&L & EXECUTIVE FINANCIAL OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{tr("Gross Sales Revenue")}</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-stone-900">Rs. {totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">
                {summary.totalBillsCount} {tr("completed orders")}
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{tr("Total Operating Expenses")}</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  <ReceiptText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600">Rs. {totalExpenses.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Utilities, packaging, logistics</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kitchen Settlements</span>
                <div className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700">Rs. {totalSettlementsPaid.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Commissions paid out to kitchen staff</p>
            </div>

            <div className="bg-stone-900 text-white p-5 rounded-3xl shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Net Operating Profit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {profitMargin}% Margin
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400">Rs. {netProfit.toLocaleString()}</div>
              <p className="text-[11px] text-stone-400 font-medium">Revenue - Expenses - Settlements</p>
            </div>
          </div>

          {/* Formal P&L Statement Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-stone-100 rounded-xl text-stone-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">Profit & Loss Statement (ආදායම් වියදම් ප්‍රකාශය)</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Financial performance statement for {selectedDate || 'all-time transactions'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Row 1: Gross Sales */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-stone-900 text-sm">1. Gross Sales Revenue (මුළු විකුණුම් ආදායම)</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Customer Retail (Rs. {customerSalesValue.toLocaleString()}) + Staff Purchases (Rs. {staffSalesValue.toLocaleString()})
                  </div>
                </div>
                <div className="text-base font-black text-stone-900">Rs. {totalRevenue.toLocaleString()}</div>
              </div>

              {/* Row 2: Production Cost (Kitchen Settlements) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-950">2. Less: Kitchen Staff Settlements (කුස්සියේ කාර්ය මණ්ඩල කොමිස්)</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">Cost of food preparation commissions paid to staff</div>
                </div>
                <div className="text-sm font-black text-amber-800">- Rs. {totalSettlementsPaid.toLocaleString()}</div>
              </div>

              {/* Row 3: Gross Profit */}
              <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-300 flex items-center justify-between font-bold">
                <span className="text-stone-800 text-xs uppercase tracking-wider">= Gross Operational Profit (දළ ලාභය)</span>
                <span className="text-base font-black text-stone-900">
                  Rs. {(totalRevenue - totalSettlementsPaid).toLocaleString()}
                </span>
              </div>

              {/* Row 4: Operating Expenses */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-950">3. Less: Operating Expenses (දෛනික මෙහෙයුම් වියදම්)</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">Packaging, utilities, transport, repairs, maintenance</div>
                </div>
                <div className="text-sm font-black text-rose-600">- Rs. {totalExpenses.toLocaleString()}</div>
              </div>

              {/* Row 5: Final Net Operating Profit */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    = Final Net Operating Profit (ශුද්ධ ලාභය)
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">Rs. {netProfit.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-100">Profit Margin</div>
                  <div className="text-xl font-black text-white">{profitMargin}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Channels Split & Top Items Sold */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales Channel Split */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-stone-900 text-sm">Payment Channels Split (ගෙවීම් ක්‍රම අනුව විකුණුම්)</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Physical Cash Sales</div>
                      <div className="text-[10px] text-stone-500">Collected in cash drawer</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-stone-900">Rs. {reconciliation.cash.toLocaleString()}</div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Card POS Terminals</div>
                      <div className="text-[10px] text-stone-500">Deposited to company bank account</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-stone-900">Rs. {reconciliation.card.toLocaleString()}</div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Online & LankaQR</div>
                      <div className="text-[10px] text-stone-500">Instant digital settlements</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-stone-900">Rs. {reconciliation.online.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Top Items Sold Table */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="font-extrabold text-stone-900 text-sm">Item-wise Sales Breakdown</h3>
                <span className="text-xs text-stone-500">{summary.topItems.length} active items</span>
              </div>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50/60">
                      <th className="py-2 px-2.5">Food Item</th>
                      <th className="py-2 px-2.5 text-center">Qty Sold</th>
                      <th className="py-2 px-2.5 text-right">Revenue (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {summary.topItems.slice(0, 6).map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-2.5 font-bold text-stone-900">{item.name}</td>
                        <td className="py-2.5 px-2.5 text-center font-bold text-stone-700">{item.quantity}</td>
                        <td className="py-2.5 px-2.5 text-right font-black text-amber-900">
                          Rs. {item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CASH DRAWER & PETTY CASH MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {/* Drawer Balance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Physical Cash Sales</span>
              <div className="text-2xl font-black text-stone-900">Rs. {reconciliation.cash.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500">Collected directly at counter</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Estimated Cash in Drawer</span>
              <div className="text-2xl font-black text-emerald-600">Rs. {estimatedCashInDrawer.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500">Opening + Cash Sales - Drawer Payouts</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Latest Closing Count</span>
              <div className="text-2xl font-black text-stone-900">
                Rs. {latestClosing ? Number(latestClosing.actualCash || 0).toLocaleString() : 'N/A'}
              </div>
              <p className="text-[11px] text-stone-500">
                {latestClosing ? `Reported on ${latestClosing.date} by ${latestClosing.cashierName}` : 'No closing recorded'}
              </p>
            </div>
          </div>

          {/* Cashier Daily Closing Audit Table */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">Cashier Daily Cash Closings & Reconciliations</h3>
                <p className="text-xs text-stone-500 font-medium">
                  Verified cash register closing logs submitted by cashiers at end of shift.
                </p>
              </div>
              <span className="text-xs text-stone-500 font-bold">{closings.length} closing record(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Cashier</th>
                    <th className="py-2.5 px-3 text-right">Opening Cash</th>
                    <th className="py-2.5 px-3 text-right">Cash Sales</th>
                    <th className="py-2.5 px-3 text-right">Cash Expenses</th>
                    <th className="py-2.5 px-3 text-right">Expected Drawer</th>
                    <th className="py-2.5 px-3 text-right">Actual Count</th>
                    <th className="py-2.5 px-3 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {closings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-stone-400">
                        No cash closing records found.
                      </td>
                    </tr>
                  ) : (
                    closings.map((c) => {
                      const diff = Number(c.difference || 0);
                      return (
                        <tr key={c.closingId} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-stone-800">{c.date}</td>
                          <td className="py-3 px-3 font-extrabold text-stone-900">{c.cashierName}</td>
                          <td className="py-3 px-3 text-right font-medium">Rs. {Number(c.openingCash || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            Rs. {Number(c.cashSales || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-rose-600">
                            -Rs. {Number(c.cashExpenses || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-stone-900">
                            Rs. {Number(c.expectedCash || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-stone-900">
                            Rs. {Number(c.actualCash || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                                diff === 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : diff > 0
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {diff > 0 ? `+Rs. ${diff}` : diff < 0 ? `-Rs. ${Math.abs(diff)}` : 'Exact (Rs. 0)'}
                            </span>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BANK ACCOUNTS & TREASURY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'banking' && (
        <div className="space-y-6">
          {/* Bank Accounts Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Corporate Bank Accounts & Balances</h3>
              <p className="text-xs text-stone-500 font-medium">
                Combined Bank Balance: <span className="font-black text-stone-900">Rs. {totalBankBalance.toLocaleString()}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4 text-stone-950" />
                <span>Deposit Cash to Bank</span>
              </button>

              <button
                onClick={() => setShowAddBankModal(true)}
                className="px-4 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Add Bank Account</span>
              </button>
            </div>
          </div>

          {/* Bank Accounts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((acc) => (
              <div
                key={acc.accountId}
                className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-stone-900 text-sm">{acc.bankName}</div>
                      <div className="text-[11px] text-stone-500 font-medium">{acc.branch} Branch</div>
                    </div>
                  </div>
                  <Badge status={acc.status || 'ACTIVE'} />
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="text-[11px] font-mono text-stone-500">{acc.accountNumber}</div>
                  <div className="text-xs font-bold text-stone-700 truncate">{acc.accountName}</div>
                  <div className="pt-1 flex items-baseline justify-between">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Available Balance:</span>
                    <span className="text-lg font-black text-stone-900">
                      Rs. {Number(acc.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Bank Transactions Ledger */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">Recent Business Bank Transactions</h3>
              <span className="text-xs text-stone-500">{bankTransactions.length} transaction(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bank Account</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {bankTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-400">
                        No bank transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    bankTransactions.slice(0, 15).map((txn) => (
                      <tr key={txn.transactionId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-stone-500">{txn.date}</td>
                        <td className="py-3 px-3 font-extrabold text-stone-900">{txn.bankName}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              txn.type === 'DEPOSIT'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : txn.type === 'SALARY_PAYOUT'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {txn.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-800">{txn.description}</td>
                        <td className="py-3 px-3 text-right font-black text-stone-900">
                          Rs. {Number(txn.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-stone-600">
                          Rs. {Number(txn.balanceAfter || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KITCHEN STAFF SETTLEMENTS & ADVANCES */}
      {/* ========================================================================= */}
      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          {/* Top 4 Kitchen & Advances Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Settlements Paid</span>
              <div className="text-2xl font-black text-amber-700">Rs. {totalSettlementsPaid.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Commissions settled to chefs</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Advances Granted</span>
              <div className="text-2xl font-black text-stone-900">Rs. {advancesSummary.totalGranted.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Disbursed to employees</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Advances Recovered</span>
              <div className="text-2xl font-black text-emerald-600">Rs. {advancesSummary.totalDeducted.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Deducted from daily commissions</p>
            </div>

            <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Outstanding Recovery</span>
              <div className="text-2xl font-black text-rose-600">Rs. {advancesSummary.pendingRecovery.toLocaleString()}</div>
              <p className="text-[11px] text-stone-500 font-medium">Remaining to be deducted</p>
            </div>
          </div>

          {/* Kitchen Settlements History */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">Kitchen Staff Daily Settlements History</h3>
                <p className="text-xs text-stone-500 font-medium">Commissions, advance deductions, and net payouts</p>
              </div>
              <span className="text-xs text-stone-500 font-bold">{settlements.length} settlement(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Kitchen Staff</th>
                    <th className="py-2.5 px-3 text-right">Eligible Sales</th>
                    <th className="py-2.5 px-3 text-center">Comm %</th>
                    <th className="py-2.5 px-3 text-right">Gross Comm</th>
                    <th className="py-2.5 px-3 text-right">Advance Ded.</th>
                    <th className="py-2.5 px-3 text-right">Net Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-stone-400">
                        No settlements recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((s) => (
                      <tr key={s.settlementId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-stone-800">{s.date}</td>
                        <td className="py-3 px-3 font-extrabold text-stone-900">{s.kitchenStaffName}</td>
                        <td className="py-3 px-3 text-right font-semibold">Rs. {Number(s.totalEligibleSales || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-center font-bold text-amber-800">{s.commissionRate}%</td>
                        <td className="py-3 px-3 text-right font-black text-amber-900">
                          Rs. {Number(s.grossCommission || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 font-bold">
                          {s.advanceDeduction > 0 ? `-Rs. ${Number(s.advanceDeduction).toLocaleString()}` : 'Rs. 0'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-stone-900 text-sm">
                          Rs. {Number(s.netPayment || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge status={s.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advances Ledger */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">Staff Advances & Recovery Status</h3>
              <span className="text-xs text-stone-500 font-bold">{advances.length} advance(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Granted (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Remaining (Rs.)</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-stone-400">
                        No advances recorded.
                      </td>
                    </tr>
                  ) : (
                    advances.map((a) => (
                      <tr key={a.advanceId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-stone-600">{a.date}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">{a.employeeName}</td>
                        <td className="py-3 px-3 text-stone-600 font-medium">{a.employeeRole}</td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">
                          Rs. {Number(a.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-600">
                          Rs. {Number(a.remainingAmount ?? a.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-stone-600 max-w-xs truncate">{a.reason}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge status={a.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OPERATING EXPENSES LEDGER & RECEIPTS */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">Operating Expenses Log & Attachment Audit</h3>
                <p className="text-xs text-stone-500 font-medium">
                  Total Operational Expenditure: <span className="font-black text-rose-600">Rs. {totalExpenses.toLocaleString()}</span>
                </p>
              </div>
              <span className="text-xs text-stone-500 font-bold">{expensesList.length} recorded expense(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Expense ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {expensesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-stone-400">
                        No expenses recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    expensesList.map((exp) => (
                      <tr key={exp.expenseId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-800">{exp.expenseId}</td>
                        <td className="py-3 px-3 font-mono text-stone-600">{exp.date}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">{exp.category}</td>
                        <td className="py-3 px-3 text-stone-800 max-w-xs truncate" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[11px] text-stone-700">
                            {exp.paymentMethod === 'CASH'
                              ? 'Cash Drawer'
                              : exp.paymentMethod === 'CARD'
                              ? `Company Card (${exp.bankAccountName || 'Bank'})`
                              : `Bank Transfer (${exp.bankAccountName || 'Bank'})`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-600">
                          Rs. {Number(exp.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {exp.receiptAttachment ? (
                            <button
                              onClick={() => setViewingReceipt(exp.receiptAttachment)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200 cursor-pointer transition-colors"
                              title="Click to view attached receipt"
                            >
                              <Paperclip className="w-3 h-3 text-amber-700" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">No receipt</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2 text-amber-700">
                <Paperclip className="w-5 h-5" />
                <h3 className="font-black text-stone-900 text-base">Receipt / Attachment Viewer</h3>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {viewingReceipt.startsWith('data:image') || viewingReceipt.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <div className="space-y-2">
                  <div className="max-h-80 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center p-2">
                    <img
                      src={viewingReceipt}
                      alt="Receipt Attachment"
                      className="max-h-72 object-contain rounded-xl"
                    />
                  </div>
                  <div className="text-right">
                    <a
                      href={viewingReceipt}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:underline font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open full image in new tab</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-center">
                  <FileText className="w-10 h-10 text-amber-700 mx-auto" />
                  <div className="text-xs font-bold text-stone-800 truncate max-w-sm mx-auto">
                    {viewingReceipt}
                  </div>
                  <a
                    href={viewingReceipt}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-sm transition-all"
                  >
                    <span>Open Document Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BANK ACCOUNT MODAL */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 text-stone-900 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2 text-blue-700">
                <Landmark className="w-5 h-5" />
                <h3 className="font-black text-stone-900 text-base">Add Corporate Bank Account</h3>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBankAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Ceylon / Commercial Bank"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 00123456789"
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Branch *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kandy / Colombo 07"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Initial Balance (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Account Holder / Reference Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hadabima Authority Corporate Account"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isAddingBank}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  {isAddingBank ? 'Saving...' : 'Add Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT CASH TO BANK MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 text-stone-900 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2 text-amber-700">
                <ArrowDownRight className="w-5 h-5" />
                <h3 className="font-black text-stone-900 text-base">Deposit Cash to Bank</h3>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDeposit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Target Bank Account *</label>
                <select
                  required
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-amber-600 cursor-pointer"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.accountId} value={b.accountId}>
                      {b.bankName} - {b.accountNumber} (Bal: Rs.{Number(b.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Deposit Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-black text-sm focus:outline-hidden focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Deposit Reference / Slip No.</label>
                <input
                  type="text"
                  placeholder="e.g. CDM-DEP-9941"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600 focus:bg-white font-mono"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                >
                  {isDepositing ? 'Processing...' : 'Confirm Deposit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
