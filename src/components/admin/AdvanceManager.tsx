'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  HandCoins,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  User,
  PlusCircle,
  X,
  RefreshCw,
  Coins,
  Trash2,
  FileText,
  Filter,
  DollarSign,
  ShieldCheck,
  Building2,
  Banknote,
} from 'lucide-react';

interface Advance {
  advanceId: string;
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  employeeNic?: string;
  contactNumber?: string;
  date: string;
  amount: number;
  reason: string;
  approvedBy: string;
  status: 'PENDING' | 'APPROVED' | 'DEDUCTED' | 'CANCELLED';
  remainingAmount: number;
  disbursementSource?: string;
}

interface Employee {
  employeeId: string;
  fullName: string;
  employeeType: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  status: string;
  nic?: string;
}

export function AdvanceManager() {
  const { t, tr } = useLanguage();

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalGranted: 0,
    pendingRecovery: 0,
    totalDeducted: 0,
    activeCount: 0,
    settledCount: 0,
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CASHIER' | 'KITCHEN' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DEDUCTED' | 'CANCELLED'>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<Advance | null>(null);

  // Form State
  const [empId, setEmpId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [disbursementSource, setDisbursementSource] = useState<'CASH_DRAWER' | 'BANK_ACCOUNT'>('CASH_DRAWER');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdvancesAndStaff = async () => {
    setIsLoading(true);
    try {
      const [advRes, empRes, bankRes] = await Promise.all([
        fetch('/api/advances'),
        fetch('/api/employees'),
        fetch('/api/bank-accounts'),
      ]);
      const advData = await advRes.json();
      const empData = await empRes.json();
      const bankData = await bankRes.json();

      if (advData.success) {
        setAdvances(advData.advances || []);
        if (advData.summary) setSummary(advData.summary);
      }

      if (empData.success) {
        const activeEmps = (empData.employees || []).filter((e: Employee) => e.status !== 'INACTIVE');
        setEmployees(activeEmps);
        if (activeEmps.length > 0 && !empId) {
          setEmpId(activeEmps[0].employeeId);
        }
      }

      if (bankData.success && bankData.accounts) {
        setBankAccounts(bankData.accounts);
        if (bankData.accounts.length > 0 && !sourceAccountId) {
          setSourceAccountId(bankData.accounts[0].accountId);
        }
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load advances.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancesAndStaff();
  }, []);

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !amount) {
      setMessage({ type: 'error', text: 'Select an employee and enter a valid advance amount.' });
      return;
    }

    const finalReason = reason === 'Other' ? customReason : (reason || 'Personal requirement');
    if (!finalReason.trim()) {
      setMessage({ type: 'error', text: 'Please specify reason for advance.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          amount: Number(amount),
          date,
          reason: finalReason,
          disbursementSource,
          sourceAccountId: disbursementSource === 'BANK_ACCOUNT' ? sourceAccountId : '',
          approvedBy: 'Admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to grant advance.' });
      } else {
        setMessage({
          type: 'success',
          text: `Advance of Rs. ${Number(amount).toLocaleString()} granted successfully!`,
        });
        setShowAddModal(false);
        setAmount('');
        setReason('');
        setCustomReason('');
        await fetchAdvancesAndStaff();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error granting advance.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAdvance = async (advanceId: string) => {
    if (!confirm(`Are you sure you want to cancel advance ${advanceId}?`)) return;

    try {
      const res = await fetch(`/api/advances?advanceId=${advanceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Advance ${advanceId} cancelled successfully.` });
        await fetchAdvancesAndStaff();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel advance.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error cancelling advance.' });
    }
  };

  // Filter advances
  const filteredAdvances = advances.filter((adv) => {
    const matchesSearch =
      adv.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.advanceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.reason.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter !== 'ALL' && adv.employeeRole !== roleFilter) return false;
    if (statusFilter !== 'ALL' && adv.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-bold">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              {tr("Universal Staff Advances")}
            </span>
            <span className="text-stone-400 text-xs">•</span>
            <span className="text-stone-500 text-xs font-semibold">
              {tr("All Employee Roles (Cashier, Kitchen, Admin)")}
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 mt-1 tracking-tight flex items-center space-x-2">
            <HandCoins className="w-7 h-7 text-amber-600" />
            <span>{tr("Staff Salary Advances Management")}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {tr("Grant mid-month cash advances to any staff member. Advances automatically deduct from Kitchen daily settlements or Cashier monthly payroll.")}
          </p>
        </div>

        <button
          onClick={() => {
            if (employees.length > 0) setEmpId(employees[0].employeeId);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/25 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ {tr("Grant New Advance")}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Advances Granted */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
              {tr("Total Advances Granted")}
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              Rs. {summary.totalGranted.toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              {advances.length} {tr("Advance records recorded")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Recovery */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
              {tr("Pending Recovery")}
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              Rs. {summary.pendingRecovery.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {summary.activeCount} {tr("active advance(s) awaiting deduction")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Settled */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
              {tr("Settled / Deducted")}
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              Rs. {summary.totalDeducted.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {summary.settledCount} {tr("advance(s) fully recovered")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Role & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("All Roles")}
            </button>
            <button
              onClick={() => setRoleFilter('CASHIER')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'CASHIER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("Cashiers")}
            </button>
            <button
              onClick={() => setRoleFilter('KITCHEN')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'KITCHEN' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("Kitchen Staff")}
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("All")}
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'APPROVED' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("Pending Recovery")}
            </button>
            <button
              onClick={() => setStatusFilter('DEDUCTED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'DEDUCTED' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              {tr("Settled")}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={tr("Search employee, ID, reason...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[10px] uppercase font-black tracking-wider text-stone-500">
                <th className="py-3.5 px-4">{tr("Date")}</th>
                <th className="py-3.5 px-4">{tr("Staff Member")}</th>
                <th className="py-3.5 px-3">{tr("Reason")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Advance Amount")}</th>
                <th className="py-3.5 px-3 text-right">{tr("Remaining Balance")}</th>
                <th className="py-3.5 px-3 text-center">{tr("Status")}</th>
                <th className="py-3.5 px-4 text-center">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span>Loading staff advance records...</span>
                  </td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <HandCoins className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">No Advance records found.</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Click "+ Grant New Advance" to record an advance for any staff member.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.advanceId} className="hover:bg-amber-50/40 transition-colors">
                    {/* Date & Ref */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block text-[11px]">
                        {adv.advanceId}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{adv.date}</span>
                      </div>
                    </td>

                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 font-black text-xs flex items-center justify-center shrink-0 border border-stone-200">
                          {adv.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-stone-900">{adv.employeeName}</span>
                            <span className="font-mono text-[10px] text-stone-500 font-semibold">
                              ({adv.employeeId})
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <Badge status={adv.employeeRole || 'STAFF'} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-3 max-w-[200px]">
                      <span className="font-medium text-stone-800 block truncate" title={adv.reason}>
                        {adv.reason}
                      </span>
                      <span className="text-[10px] text-stone-400">Approved by: {adv.approvedBy}</span>
                    </td>

                    {/* Original Amount */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-black text-stone-900 text-sm">
                        Rs. {Number(adv.amount).toLocaleString()}
                      </div>
                      <div className="mt-0.5">
                        {adv.disbursementSource === 'BANK_ACCOUNT' ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>Bank Account</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Banknote className="w-2.5 h-2.5" />
                            <span>Cash Drawer</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3.5 px-3 text-right">
                      {Number(adv.remainingAmount ?? adv.amount) > 0 ? (
                        <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Rs. {Number(adv.remainingAmount ?? adv.amount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Fully Recovered
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      {adv.status === 'DEDUCTED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SETTLED</span>
                        </span>
                      ) : adv.status === 'CANCELLED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold border border-stone-200">
                          CANCELLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setViewingVoucher(adv)}
                          title="Print Advance Voucher"
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center space-x-1 transition-all border border-stone-200 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-600" />
                          <span>Voucher</span>
                        </button>

                        {adv.status === 'APPROVED' && (
                          <button
                            onClick={() => handleCancelAdvance(adv.advanceId)}
                            title="Cancel Advance"
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL 1: GRANT NEW ADVANCE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative space-y-4 animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-amber-700">
                <HandCoins className="w-6 h-6" />
                <h3 className="text-xl font-black text-stone-900">
                  Grant Staff Advance (අත්තිකාරම් මුදල්)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Disburse a salary advance to any employee. This advance will be deducted automatically upon their next settlement or month-end salary payout.
              </p>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Select Employee (ඕනෑම සේවකයෙකු) *
                </label>
                <select
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeType} - {emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold text-xs mb-1">
                    Advance Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-black text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold text-xs mb-1">
                    Date of Advance *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Reason / Purpose (හේතුව) *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-medium focus:outline-hidden focus:border-amber-500 mb-2 cursor-pointer"
                >
                  <option value="Personal Emergency">Personal Emergency (පෞද්ගලික හදිසි අවශ්‍යතාවක්)</option>
                  <option value="Medical Expenses">Medical Expenses (වෛද්‍ය වියදම්)</option>
                  <option value="Festival Advance">Festival / Holiday Advance (උත්සව අත්තිකාරම්)</option>
                  <option value="Family Requirement">Family Requirement (පවුලේ අවශ්‍යතාවක්)</option>
                  <option value="Travel / Transport">Travel / Transport (ගමන් වියදම්)</option>
                  <option value="Other">Other Reason (වෙනත් විශේෂ හේතුවක්)</option>
                </select>

                {reason === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Describe specific reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-amber-300 text-stone-900 text-xs font-medium focus:outline-hidden"
                  />
                )}
              </div>

              {/* Disbursement Source Selector */}
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1.5">
                  Disbursement Source (මුදල් ලබාදුන් මාර්ගය) *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setDisbursementSource('CASH_DRAWER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      disbursementSource === 'CASH_DRAWER'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Drawer (ලාච්චුවෙන්)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisbursementSource('BANK_ACCOUNT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      disbursementSource === 'BANK_ACCOUNT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Business Bank (බැංකුවෙන්)</span>
                  </button>
                </div>

                {disbursementSource === 'BANK_ACCOUNT' ? (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5 animate-fadeIn">
                    <label className="block text-blue-950 font-bold text-[11px]">
                      Select Source Business Bank Account *
                    </label>
                    <select
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-blue-300 text-xs font-bold text-stone-900 focus:outline-hidden"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.accountId} value={b.accountId}>
                          {b.bankName} - A/C {b.accountNumber} (Balance: Rs. {Number(b.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 flex items-start space-x-1.5">
                    <Banknote className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cash Drawer Outflow:</strong> Money is handed from the register. It automatically settles in today's <strong>Daily Cash Closing</strong> without double-counting as an operational expense.
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
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

      {/* MODAL 2: PRINTABLE ADVANCE RECEIPT / VOUCHER */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-8 text-stone-900 shadow-2xl relative space-y-5">
            <button
              onClick={() => setViewingVoucher(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b-2 border-stone-900 pb-3 text-center">
              <div className="flex items-center justify-center space-x-2.5 mb-1.5">
                <img
                  src="https://tse4.mm.bing.net/th/id/OIP.vgF4-6ewaExSRrRzLQSdbAHaG1?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
                  alt="Hadabima Logo"
                  className="w-10 h-10 object-contain"
                />
                <div className="text-left">
                  <h1 className="text-base font-black text-stone-900 uppercase">
                    Hadabima Adikariye Bakery & Pastry Shop
                  </h1>
                  <p className="text-[10px] text-stone-500">
                    Official Employee Salary Advance Voucher
                  </p>
                </div>
              </div>
              <div className="inline-block bg-stone-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Advance Voucher: {viewingVoucher.advanceId}
              </div>
            </div>

            {/* Voucher Details Table */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500 font-semibold">Date of Advance:</span>
                <span className="font-bold text-stone-900">{viewingVoucher.date}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500 font-semibold">Employee Name:</span>
                <span className="font-bold text-stone-900">
                  {viewingVoucher.employeeName} ({viewingVoucher.employeeId})
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500 font-semibold">Designation / Role:</span>
                <span className="font-bold text-stone-900">
                  {viewingVoucher.employeeRole || 'Staff Member'}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500 font-semibold">Reason / Purpose:</span>
                <span className="font-medium text-stone-800">{viewingVoucher.reason}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-black uppercase text-amber-950">
                  Amount Disbursed:
                </span>
                <span className="text-xl font-black text-amber-900">
                  Rs. {Number(viewingVoucher.amount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Acknowledgment Agreement Clause */}
            <div className="text-[10px] text-stone-500 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <strong>Acknowledgment Clause:</strong> I hereby acknowledge the receipt of the sum of <strong>Rs. {Number(viewingVoucher.amount).toLocaleString()}</strong> as a salary advance. I authorize Hadabima Bakery management to deduct this full or partial amount from my upcoming salary settlement.
            </div>

            {/* Signature Blocks */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-stone-300 pt-2">
                <span className="font-bold text-stone-800 block">Authorized Signature</span>
                <span className="text-[10px] text-stone-400">Shop Management</span>
              </div>
              <div className="border-t border-stone-300 pt-2">
                <span className="font-bold text-stone-800 block">Employee Signature</span>
                <span className="text-[10px] text-stone-400">Received By</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 print:hidden">
              <button
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
