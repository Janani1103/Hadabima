'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  HandCoins,
  Info,
  Layers,
  MapPin,
  Pencil,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  User,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';

interface PayrollItem {
  payrollId: string;
  employeeId: string;
  employeeName: string;
  fullName?: string;
  employeeNic?: string;
  nic?: string;
  contactNumber?: string;
  employeeStatus?: string;
  month: string;
  basicSalary: number;
  allowances: number;
  advanceDeductions: number;
  otherDeductions: number;
  netSalary: number;
  paymentMethod: 'CASH' | 'BANK';
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankReference?: string;
  status: 'PENDING' | 'PAID';
  paidAt?: string | null;
  paidBy?: string;
  notes?: string;
  isDraft?: boolean;
  pendingAdvancesList?: any[];
}

interface PayrollSummary {
  totalBasic: number;
  totalNet: number;
  totalPaid: number;
  totalAdvances: number;
  paidCount: number;
  pendingCount: number;
  cashierCount: number;
}

export function CashierPayrollView() {
  const { t, tr } = useLanguage();

  const getCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalBasic: 0,
    totalNet: 0,
    totalPaid: 0,
    totalAdvances: 0,
    paidCount: 0,
    pendingCount: 0,
    cashierCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'PAID' | 'CASH' | 'BANK'>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [payingItem, setPayingItem] = useState<PayrollItem | null>(null);
  const [viewingSlip, setViewingSlip] = useState<PayrollItem | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showBankSheetModal, setShowBankSheetModal] = useState(false);

  // Payment Modal Form State
  const [payBasic, setPayBasic] = useState<number>(0);
  const [payAllowances, setPayAllowances] = useState<number>(0);
  const [payAdvanceDeduction, setPayAdvanceDeduction] = useState<number>(0);
  const [payOtherDeduction, setPayOtherDeduction] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [payBankName, setPayBankName] = useState('');
  const [payBankBranch, setPayBankBranch] = useState('');
  const [payBankAccountNumber, setPayBankAccountNumber] = useState('');
  const [payBankAccountName, setPayBankAccountName] = useState('');
  const [payBankReference, setPayBankReference] = useState('');
  const [paySourceAccountId, setPaySourceAccountId] = useState('');
  const [adminBankAccounts, setAdminBankAccounts] = useState<any[]>([]);
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Grant Advance Modal Form State
  const [advanceEmpId, setAdvanceEmpId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      const [payrollRes, bankRes] = await Promise.all([
        fetch(`/api/payroll?month=${selectedMonth}`),
        fetch('/api/bank-accounts'),
      ]);
      const data = await payrollRes.json();
      const bankData = await bankRes.json();

      if (data.success) {
        setPayrollItems(data.items || []);
        setSummary(data.summary || {
          totalBasic: 0,
          totalNet: 0,
          totalPaid: 0,
          totalAdvances: 0,
          paidCount: 0,
          pendingCount: 0,
          cashierCount: 0,
        });
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to load payroll records.' });
      }

      if (bankData.success && bankData.accounts) {
        setAdminBankAccounts(bankData.accounts);
        if (bankData.accounts.length > 0 && !paySourceAccountId) {
          const defaultAcc = bankData.accounts.find((a: any) => a.isDefault) || bankData.accounts[0];
          setPaySourceAccountId(defaultAcc.accountId);
        }
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message || 'Error loading payroll.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const openPaymentModal = (item: PayrollItem) => {
    setPayingItem(item);
    setPayBasic(Number(item.basicSalary || 0));
    setPayAllowances(Number(item.allowances || 0));
    setPayAdvanceDeduction(Number(item.advanceDeductions || 0));
    setPayOtherDeduction(Number(item.otherDeductions || 0));
    setPayMethod(item.paymentMethod || 'CASH');
    setPayBankName(item.bankName || '');
    setPayBankBranch(item.bankBranch || '');
    setPayBankAccountNumber(item.bankAccountNumber || '');
    setPayBankAccountName(item.bankAccountName || item.employeeName || '');
    setPayBankReference(item.bankReference || '');
    setPayNotes(item.notes || '');
  };

  const calculateModalNet = () => {
    const net = Number(payBasic) + Number(payAllowances) - Number(payAdvanceDeduction) - Number(payOtherDeduction);
    return Math.max(0, net);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;

    if (payMethod === 'BANK' && !payBankReference.trim()) {
      setNotification({
        type: 'error',
        text: 'Please provide Bank Transfer Reference / Transaction ID for bank transfers.',
      });
      return;
    }

    setIsSubmittingPay(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: payingItem.employeeId,
          month: selectedMonth,
          basicSalary: payBasic,
          allowances: payAllowances,
          advanceDeductions: payAdvanceDeduction,
          otherDeductions: payOtherDeduction,
          paymentMethod: payMethod,
          bankName: payBankName,
          bankBranch: payBankBranch,
          bankAccountNumber: payBankAccountNumber,
          bankAccountName: payBankAccountName,
          bankReference: payBankReference,
          sourceAccountId: payMethod === 'BANK' ? paySourceAccountId : '',
          notes: payNotes,
          paidBy: 'Admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', text: data.error || 'Failed to process salary payment.' });
      } else {
        setNotification({
          type: 'success',
          text: `Salary of Rs.${calculateModalNet().toLocaleString()} successfully paid to ${payingItem.employeeName}!`,
        });
        setPayingItem(null);
        await fetchPayrollData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Payment processing failed.' });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleGrantAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceEmpId || !advanceAmount) {
      setNotification({ type: 'error', text: 'Select cashier and enter valid advance amount.' });
      return;
    }

    setIsSubmittingAdvance(true);
    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: advanceEmpId,
          amount: Number(advanceAmount),
          reason: advanceReason || 'Salary advance',
          date: advanceDate,
          approvedBy: 'Admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', text: data.error || 'Failed to grant advance.' });
      } else {
        setNotification({
          type: 'success',
          text: `Advance of Rs.${Number(advanceAmount).toLocaleString()} granted successfully!`,
        });
        setShowAdvanceModal(false);
        setAdvanceAmount('');
        setAdvanceReason('');
        await fetchPayrollData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to grant advance.' });
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification({ type: 'success', text: `Copied ${label} to clipboard!` });
  };

  const formatMonthName = (mStr: string) => {
    try {
      const [y, m] = mStr.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mStr;
    }
  };

  // Filter items
  const filteredItems = payrollItems.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.bankName && item.bankName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'PENDING') return item.status !== 'PAID';
    if (filterTab === 'PAID') return item.status === 'PAID';
    if (filterTab === 'CASH') return item.paymentMethod === 'CASH';
    if (filterTab === 'BANK') return item.paymentMethod === 'BANK';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-bold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header & Month Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              {tr("Monthly Cashier Payroll")}
            </span>
            <span className="text-stone-400 text-xs">•</span>
            <span className="text-stone-500 text-xs font-semibold">
              {payrollItems.length} {tr("Registered Cashier(s)")}
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1 tracking-tight flex items-center space-x-2">
            <Banknote className="w-7 h-7 text-amber-600" />
            <span>{tr("Cashier Monthly Payroll & Settlements")}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {tr("Process monthly basic salaries for Cashiers, deduct advances, configure cash vouchers or bank transfers, and generate official pay slips.")}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Switcher Pill */}
          <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 bg-transparent text-xs font-black text-stone-800 focus:outline-hidden cursor-pointer"
            />
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payroll */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
              {tr("Total Monthly Payroll")}
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              Rs. {summary.totalNet.toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              {tr("Basic Salaries")}: Rs. {summary.totalBasic.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Paid Salaries */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
              {tr("Paid Salaries")} ({summary.paidCount})
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              Rs. {summary.totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {summary.paidCount} / {summary.cashierCount} {tr("Settled")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
              {tr("Pending Recovery")} ({summary.pendingCount})
            </span>
            <div className="text-2xl font-black text-orange-700 mt-1">
              Rs. {(summary.totalNet - summary.totalPaid).toLocaleString()}
            </div>
            <span className="text-[11px] text-orange-600 font-semibold">
              {tr("PENDING")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Deducted Advances */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
              {tr("Total Advances Deducted")}
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              Rs. {summary.totalAdvances.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {tr("Settled / Deducted")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Cashiers ({payrollItems.length})
          </button>
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Pending ({summary.pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'PAID'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Paid ({summary.paidCount})
          </button>
          <button
            onClick={() => setFilterTab('BANK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'BANK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🏦 Bank Transfer
          </button>
          <button
            onClick={() => setFilterTab('CASH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'CASH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            💵 Cash in Hand
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search cashier name, ID, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Cashiers Payroll Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[10px] uppercase font-black tracking-wider text-stone-500">
                <th className="py-3.5 px-4">{tr("Staff Member")}</th>
                <th className="py-3.5 px-3">{tr("Payment Method")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Basic Salaries")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Allowances", "Allowances")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Advance (Rs.)")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Deductions Applied")}</th>
                <th className="py-3.5 px-4 text-right">{tr("Net Payable")}</th>
                <th className="py-3.5 px-3 text-center">{tr("Status")}</th>
                <th className="py-3.5 px-4 text-center">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span>Loading payroll calculations for {formatMonthName(selectedMonth)}...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <Info className="w-6 h-6 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">No Cashiers found for this criteria.</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Check if employees are registered with role Cashier in Employee Management.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.employeeId}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-xs shrink-0">
                          {item.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-stone-900 text-xs">
                              {item.employeeName}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {item.employeeId}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5 flex items-center space-x-2">
                            <span>NIC: {item.employeeNic || item.nic || 'N/A'}</span>
                            {item.contactNumber && (
                              <>
                                <span>•</span>
                                <span>{item.contactNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-3">
                      {item.paymentMethod === 'BANK' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>Bank Account</span>
                          </span>
                          <div className="text-[11px] font-bold text-stone-800 truncate max-w-[140px]">
                            {item.bankName || 'Bank Name Not Set'}
                          </div>
                          <div className="text-[10px] font-mono text-stone-500">
                            A/C: {item.bankAccountNumber || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>Cash in Hand</span>
                          </span>
                          <div className="text-[10px] text-stone-500 mt-0.5">Physical Cash Voucher</div>
                        </div>
                      )}
                    </td>

                    {/* Basic Salary */}
                    <td className="py-3.5 px-3 text-right font-semibold text-stone-900">
                      Rs. {Number(item.basicSalary).toLocaleString()}
                    </td>

                    {/* Allowances */}
                    <td className="py-3.5 px-3 text-right font-medium text-emerald-700">
                      {Number(item.allowances) > 0 ? `+ Rs. ${Number(item.allowances).toLocaleString()}` : '-'}
                    </td>

                    {/* Advance Deductions */}
                    <td className="py-3.5 px-3 text-right">
                      {Number(item.advanceDeductions) > 0 ? (
                        <div>
                          <span className="font-bold text-rose-700">
                            - Rs. {Number(item.advanceDeductions).toLocaleString()}
                          </span>
                          {item.pendingAdvancesList && item.pendingAdvancesList.length > 0 && (
                            <span className="block text-[9px] font-medium text-rose-500">
                              ({item.pendingAdvancesList.length} advance
                              {item.pendingAdvancesList.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>

                    {/* Other Deductions */}
                    <td className="py-3.5 px-3 text-right font-medium text-stone-600">
                      {Number(item.otherDeductions) > 0 ? `- Rs. ${Number(item.otherDeductions).toLocaleString()}` : '-'}
                    </td>

                    {/* Net Payable */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-black text-amber-900 bg-amber-50/80 px-2 py-1 rounded-xl border border-amber-200 block">
                        Rs. {Number(item.netSalary).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      {item.status === 'PAID' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {item.status !== 'PAID' ? (
                          <button
                            onClick={() => openPaymentModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>Pay Salary</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setViewingSlip(item)}
                              title="Print / View Official Pay Slip"
                              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center space-x-1 transition-all border border-stone-200 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-stone-600" />
                              <span>Pay Slip</span>
                            </button>
                            <button
                              onClick={() => openPaymentModal(item)}
                              title="View Payment Details"
                              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PROCESS SALARY PAYMENT MODAL */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            <button
              onClick={() => setPayingItem(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {payingItem.employeeId}
                </span>
                <span className="text-xs font-bold text-stone-500">
                  Month: {formatMonthName(selectedMonth)}
                </span>
                {payingItem.status === 'PAID' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-md">
                    ALREADY PAID
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-stone-900 mt-1">
                {payingItem.status === 'PAID' ? 'Salary Payment Summary' : 'Process Month-End Salary'}
              </h3>
              <p className="text-xs text-stone-500">
                Cashier: <strong className="text-stone-800">{payingItem.employeeName}</strong> • NIC: {payingItem.employeeNic || payingItem.nic || 'N/A'}
              </p>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Earnings & Deductions Breakdown Box */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="text-[11px] uppercase font-bold text-amber-900 flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                  <span>Salary Structure & Deductions</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Basic Salary */}
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Basic Salary (Rs.)
                    </label>
                    <input
                      type="number"
                      required
                      disabled={payingItem.status === 'PAID'}
                      value={payBasic}
                      onChange={(e) => setPayBasic(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 font-bold text-stone-900"
                    />
                  </div>

                  {/* Allowances */}
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Allowances / Bonus (Rs.)
                    </label>
                    <input
                      type="number"
                      disabled={payingItem.status === 'PAID'}
                      value={payAllowances}
                      onChange={(e) => setPayAllowances(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 font-bold text-emerald-700"
                    />
                  </div>

                  {/* Salary Advances Deductions */}
                  <div>
                    <label className="block text-rose-800 font-semibold mb-1">
                      Advances Deducted (Rs.)
                    </label>
                    <input
                      type="number"
                      disabled={payingItem.status === 'PAID'}
                      value={payAdvanceDeduction}
                      onChange={(e) => setPayAdvanceDeduction(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 font-bold text-rose-700"
                    />
                  </div>

                  {/* Other Deductions */}
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Other Deductions (Rs.)
                    </label>
                    <input
                      type="number"
                      disabled={payingItem.status === 'PAID'}
                      value={payOtherDeduction}
                      onChange={(e) => setPayOtherDeduction(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 font-bold text-stone-700"
                    />
                  </div>
                </div>

                {/* Net Payable Highlight */}
                <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase">
                    Net Payable Salary:
                  </span>
                  <span className="text-lg font-black text-amber-900">
                    Rs. {calculateModalNet().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector & Bank Details */}
              <div className="space-y-3">
                <label className="block text-stone-700 font-bold text-xs">
                  Disbursement Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={payingItem.status === 'PAID'}
                    onClick={() => setPayMethod('CASH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      payMethod === 'CASH'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash in Hand (අත්පිට)</span>
                  </button>

                  <button
                    type="button"
                    disabled={payingItem.status === 'PAID'}
                    onClick={() => setPayMethod('BANK')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      payMethod === 'BANK'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer (බැංකුව)</span>
                  </button>
                </div>

                {/* Bank Account Details Card (if Bank) */}
                {payMethod === 'BANK' && (
                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>Cashier Bank Account Details</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `Bank: ${payBankName}\nBranch: ${payBankBranch}\nAccount: ${payBankAccountNumber}\nHolder: ${payBankAccountName}\nAmount: Rs.${calculateModalNet()}`,
                            'Bank Transfer Details'
                          )
                        }
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy All Details</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-stone-400 block font-semibold">Bank Name</span>
                        <span className="font-bold text-stone-900">{payBankName || 'Not Set'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-stone-400 block font-semibold">Branch</span>
                        <span className="font-bold text-stone-900">{payBankBranch || 'Not Set'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-stone-400 block font-semibold">Account Number</span>
                        <span className="font-mono font-bold text-blue-950">{payBankAccountNumber || 'Not Set'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-stone-400 block font-semibold">Account Holder</span>
                        <span className="font-bold text-stone-900">{payBankAccountName || payingItem.employeeName}</span>
                      </div>
                    </div>

                    {/* Source Admin Bank Account (From which account to pay) */}
                    <div>
                      <label className="block text-blue-950 font-bold text-[11px] mb-1">
                        Disburse From Admin Business Account (මුදල් ගෙවන ආයතනික ගිණුම) *
                      </label>
                      <select
                        disabled={payingItem.status === 'PAID'}
                        value={paySourceAccountId}
                        onChange={(e) => setPaySourceAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 text-stone-900 font-bold text-xs focus:outline-hidden"
                      >
                        {adminBankAccounts.map((acc) => (
                          <option key={acc.accountId} value={acc.accountId}>
                            {acc.bankName} - A/C {acc.accountNumber} (Available: Rs.{Number(acc.balance).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bank Reference Input */}
                    <div>
                      <label className="block text-blue-950 font-bold text-[11px] mb-1">
                        Bank Transfer Reference / Cheque No *
                      </label>
                      <input
                        type="text"
                        required={payMethod === 'BANK' && payingItem.status !== 'PAID'}
                        disabled={payingItem.status === 'PAID'}
                        placeholder="e.g. BOC-TXN-902183 or Cheque #8839"
                        value={payBankReference}
                        onChange={(e) => setPayBankReference(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 text-stone-900 font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Cash in Hand Notice */}
                {payMethod === 'CASH' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Cash Disbursement Voucher</span>
                      Disburse physical cash of <strong>Rs. {calculateModalNet().toLocaleString()}</strong> from drawer/petty cash and collect signature on the official Pay Slip.
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Payment Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  disabled={payingItem.status === 'PAID'}
                  placeholder="e.g. October monthly salary paid on time"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>

                {payingItem.status !== 'PAID' ? (
                  <button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-600/25 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPay ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      Confirm & Pay (Rs. {calculateModalNet().toLocaleString()})
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingSlip(payingItem);
                      setPayingItem(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>View Official Pay Slip</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE OFFICIAL PAY SLIP */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-8 text-stone-900 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setViewingSlip(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pay Slip Document Header */}
            <div className="border-b-2 border-stone-900 pb-4 text-center relative">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <img
                  src="https://tse4.mm.bing.net/th/id/OIP.vgF4-6ewaExSRrRzLQSdbAHaG1?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
                  alt="Hadabima Logo"
                  className="w-12 h-12 object-contain"
                />
                <div className="text-left">
                  <h1 className="text-lg font-black text-stone-900 tracking-tight leading-tight uppercase">
                    Hadabima Adikariye Bakery & Pastry Shop
                  </h1>
                  <p className="text-[10px] text-stone-500 font-semibold">
                    Food Shop Management System • Official Salary Pay Slip
                  </p>
                </div>
              </div>
              <div className="inline-block bg-stone-900 text-white text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full mt-1">
                Month-End Employee Pay Slip
              </div>
            </div>

            {/* Employee & Period Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Employee ID & Name
                </span>
                <span className="font-bold text-stone-900">
                  {viewingSlip.employeeId} - {viewingSlip.employeeName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Pay Period / Month
                </span>
                <span className="font-bold text-stone-900">
                  {formatMonthName(viewingSlip.month || selectedMonth)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  NIC & Role
                </span>
                <span className="font-semibold text-stone-800">
                  {viewingSlip.employeeNic || viewingSlip.nic || 'N/A'} (Cashier)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Payment Status & Date
                </span>
                <span className="font-semibold text-emerald-800">
                  PAID on{' '}
                  {viewingSlip.paidAt
                    ? new Date(viewingSlip.paidAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="space-y-4 text-xs">
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-100 text-[10px] uppercase font-bold text-stone-600 border-b border-stone-200">
                      <th className="p-2.5">Earnings Item</th>
                      <th className="p-2.5 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-2.5 font-medium text-stone-800">Basic Monthly Salary</td>
                      <td className="p-2.5 text-right font-bold text-stone-900">
                        {Number(viewingSlip.basicSalary).toLocaleString()}
                      </td>
                    </tr>
                    {Number(viewingSlip.allowances) > 0 && (
                      <tr>
                        <td className="p-2.5 font-medium text-stone-800">Allowances / Bonuses</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          +{Number(viewingSlip.allowances).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-stone-50/50 font-bold">
                      <td className="p-2.5 text-stone-700">Gross Total Earnings</td>
                      <td className="p-2.5 text-right text-stone-900">
                        Rs. {(Number(viewingSlip.basicSalary) + Number(viewingSlip.allowances || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-100 text-[10px] uppercase font-bold text-stone-600 border-b border-stone-200">
                      <th className="p-2.5">Deductions Item</th>
                      <th className="p-2.5 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-2.5 font-medium text-stone-800">Salary Advances Deducted</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">
                        {Number(viewingSlip.advanceDeductions) > 0
                          ? `-${Number(viewingSlip.advanceDeductions).toLocaleString()}`
                          : '0'}
                      </td>
                    </tr>
                    {Number(viewingSlip.otherDeductions) > 0 && (
                      <tr>
                        <td className="p-2.5 font-medium text-stone-800">Other Deductions / No-Pay</td>
                        <td className="p-2.5 text-right font-bold text-rose-700">
                          -{Number(viewingSlip.otherDeductions).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-stone-50/50 font-bold">
                      <td className="p-2.5 text-stone-700">Total Deductions</td>
                      <td className="p-2.5 text-right text-rose-700">
                        Rs. {(Number(viewingSlip.advanceDeductions || 0) + Number(viewingSlip.otherDeductions || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Payable Callout */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 block">
                  Net Salary Paid
                </span>
                <span className="text-xs text-stone-600 font-medium">
                  Disbursed via {viewingSlip.paymentMethod === 'BANK' ? 'Bank Transfer' : 'Cash in Hand'}
                </span>
              </div>
              <div className="text-2xl font-black text-amber-950">
                Rs. {Number(viewingSlip.netSalary).toLocaleString()}
              </div>
            </div>

            {/* Payment Details Note */}
            <div className="text-[11px] text-stone-600 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div>
                <strong>Payment Method:</strong>{' '}
                {viewingSlip.paymentMethod === 'BANK'
                  ? `Bank Transfer (${viewingSlip.bankName} - ${viewingSlip.bankBranch}, A/C: ${viewingSlip.bankAccountNumber})`
                  : 'Cash in Hand (Physical Voucher)'}
              </div>
              {viewingSlip.bankReference && (
                <div>
                  <strong>Transaction / Ref:</strong> {viewingSlip.bankReference}
                </div>
              )}
              {viewingSlip.notes && (
                <div>
                  <strong>Remarks:</strong> {viewingSlip.notes}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-stone-300 pt-2">
                <span className="font-bold text-stone-800 block">Authorized Signature</span>
                <span className="text-[10px] text-stone-400">Hadabima Administration</span>
              </div>
              <div className="border-t border-stone-300 pt-2">
                <span className="font-bold text-stone-800 block">Employee Signature</span>
                <span className="text-[10px] text-stone-400">Cashier Confirmation</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100 print:hidden">
              <button
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pay Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GRANT ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 text-stone-900 shadow-2xl relative space-y-4 animate-fadeIn">
            <button
              onClick={() => setShowAdvanceModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-amber-700">
              <HandCoins className="w-5 h-5" />
              <h3 className="text-lg font-black text-stone-900">
                Grant Salary Advance (අත්තිකාරම්)
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Record a mid-month salary advance for a cashier. This amount will be automatically deducted during month-end payroll settlement.
            </p>

            <form onSubmit={handleGrantAdvance} className="space-y-3.5">
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Select Cashier *
                </label>
                <select
                  required
                  value={advanceEmpId}
                  onChange={(e) => setAdvanceEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold focus:outline-hidden focus:border-amber-500"
                >
                  {payrollItems.map((c) => (
                    <option key={c.employeeId} value={c.employeeId}>
                      {c.employeeId} - {c.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Advance Amount (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-black focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Date Granted *
                </label>
                <input
                  type="date"
                  required
                  value={advanceDate}
                  onChange={(e) => setAdvanceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Reason / Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency family expense"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvance}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdvance ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Grant Advance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BANK ADVICE TRANSFER SHEET */}
      {showBankSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 text-stone-900 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button
              onClick={() => setShowBankSheetModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-xl font-black text-stone-900">
                  Bank Transfer Advice Sheet
                </h3>
                <p className="text-xs text-stone-500">
                  Cashiers paid through bank transfer for {formatMonthName(selectedMonth)}.
                </p>
              </div>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-[10px] uppercase font-bold text-stone-600 border-b border-stone-200">
                    <th className="p-3">Cashier Name</th>
                    <th className="p-3">Bank & Branch</th>
                    <th className="p-3">Account Number</th>
                    <th className="p-3 text-right">Net Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payrollItems.filter((i) => i.paymentMethod === 'BANK').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-400">
                        No cashiers configured with Bank Account payment method.
                      </td>
                    </tr>
                  ) : (
                    payrollItems
                      .filter((i) => i.paymentMethod === 'BANK')
                      .map((item) => (
                        <tr key={item.employeeId} className="hover:bg-stone-50">
                          <td className="p-3 font-bold text-stone-900">
                            {item.employeeName}
                            <span className="block font-mono text-[10px] text-stone-400">
                              {item.employeeId}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-stone-800">{item.bankName || 'N/A'}</span>
                            <span className="block text-[10px] text-stone-500">{item.bankBranch || 'N/A'}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-900">
                            {item.bankAccountNumber || 'N/A'}
                          </td>
                          <td className="p-3 text-right font-black text-stone-900">
                            Rs. {Number(item.netSalary).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            {item.status === 'PAID' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                                PAID
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-black">
                                PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-500 font-semibold">
                Total Bank Transfer Payout:{' '}
                <strong className="text-stone-900">
                  Rs.{' '}
                  {payrollItems
                    .filter((i) => i.paymentMethod === 'BANK')
                    .reduce((sum, i) => sum + Number(i.netSalary), 0)
                    .toLocaleString()}
                </strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBankSheetModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Advice Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
