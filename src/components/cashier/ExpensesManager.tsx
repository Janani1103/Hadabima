'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import {
  ReceiptText,
  Plus,
  Search,
  Calendar,
  Tag,
  Building2,
  CreditCard,
  Wallet,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Upload,
  FileText,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface Expense {
  expenseId: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  bankAccountId?: string;
  bankAccountName?: string;
  receiptAttachment?: string;
  addedBy: string;
  status: string;
}

interface BankAccount {
  accountId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  balance: number;
  status: string;
}

interface ExpensesManagerProps {
  currentUser: {
    fullName: string;
    employeeType: string;
  };
}

export function ExpensesManager({ currentUser }: ExpensesManagerProps) {
  const { t, tr } = useLanguage();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Create Form State
  const [category, setCategory] = useState('Packaging');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [bankAccountId, setBankAccountId] = useState('');
  const [receiptAttachment, setReceiptAttachment] = useState('');

  // Modals state
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Edit Form State
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [editBankAccountId, setEditBankAccountId] = useState('');
  const [editReceiptAttachment, setEditReceiptAttachment] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchBankAccounts();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setBankAccounts(data.accounts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-generate next sequential Expense ID: EXP0001, EXP0002, etc.
  const nextExpenseId = useMemo(() => {
    let maxNum = 0;
    expenses.forEach((e) => {
      const match = (e.expenseId || '').match(/EXP-?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `EXP${String(maxNum + 1).padStart(4, '0')}`;
  }, [expenses]);

  const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Attachment file size exceeds 3MB limit.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (isEdit) {
        setEditReceiptAttachment(result);
      } else {
        setReceiptAttachment(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && !bankAccountId) {
      setMessage({ type: 'error', text: 'Please select a company bank account for Card or Bank Transfer payment.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: nextExpenseId,
          date,
          category,
          description,
          amount: Number(amount),
          paymentMethod,
          bankAccountId: (paymentMethod === 'CARD' || paymentMethod === 'ONLINE') ? bankAccountId : '',
          receiptAttachment,
          addedBy: currentUser.fullName,
          userRole: currentUser.employeeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to record expense' });
      } else {
        setMessage({ type: 'success', text: `Expense ${data.expense?.expenseId || nextExpenseId} recorded successfully!` });
        setDescription('');
        setAmount('');
        setReceiptAttachment('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('CASH');
        setBankAccountId('');
        fetchExpenses();
        fetchBankAccounts();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditAmount(String(exp.amount));
    setEditDate(exp.date);
    setEditPaymentMethod(exp.paymentMethod as any);
    setEditBankAccountId(exp.bankAccountId || '');
    setEditReceiptAttachment(exp.receiptAttachment || '');
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    if ((editPaymentMethod === 'CARD' || editPaymentMethod === 'ONLINE') && !editBankAccountId) {
      setMessage({ type: 'error', text: 'Please select a bank account for Card or Bank Transfer payment.' });
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: editingExpense.expenseId,
          date: editDate,
          category: editCategory,
          description: editDescription,
          amount: Number(editAmount),
          paymentMethod: editPaymentMethod,
          bankAccountId: (editPaymentMethod === 'CARD' || editPaymentMethod === 'ONLINE') ? editBankAccountId : '',
          receiptAttachment: editReceiptAttachment,
          updatedBy: currentUser.fullName,
          userRole: currentUser.employeeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update expense' });
      } else {
        setMessage({ type: 'success', text: `Expense ${editingExpense.expenseId} updated successfully!` });
        setEditingExpense(null);
        fetchExpenses();
        fetchBankAccounts();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;

    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/expenses?expenseId=${encodeURIComponent(deletingExpense.expenseId)}&deletedBy=${encodeURIComponent(
          currentUser.fullName
        )}&userRole=${encodeURIComponent(currentUser.employeeType)}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to delete expense' });
      } else {
        setMessage({ type: 'success', text: `Expense ${deletingExpense.expenseId} deleted successfully!` });
        setDeletingExpense(null);
        fetchExpenses();
        fetchBankAccounts();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      (exp.expenseId && exp.expenseId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.addedBy && exp.addedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.bankAccountName && exp.bankAccountName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'ALL' || exp.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const selectedAccount = bankAccounts.find((a) => a.accountId === bankAccountId);
  const selectedEditAccount = bankAccounts.find((a) => a.accountId === editBankAccountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{tr("Expense Management")}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {tr("Operational Expenses: Track daily costs, drawer cash, card payments & bank transfers")}
          </p>
        </div>

        <div className="text-xs text-stone-700 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 flex items-center gap-2">
          <span>{tr("Total Expenses")}:</span>
          <span className="font-extrabold text-rose-600">Rs. {totalExpenseAmount.toLocaleString()}</span>
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
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-stone-400 hover:text-stone-600 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Form and Expense Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Expense Form */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm">{tr("Record Operational Expense")}</h3>
            <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">
              {nextExpenseId}
            </span>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
            {/* Expense ID (Auto-generated) */}
            <div>
              <label className="block text-stone-700 font-semibold mb-1">{tr("Expense ID")}</label>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-mono font-bold">
                <div className="flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>{nextExpenseId}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-sans font-medium bg-stone-200 px-1.5 py-0.5 rounded">
                  {tr("Auto-generated")}
                </span>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>{tr("Date")} *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-stone-700 font-semibold mb-1">{tr("Expense Category")} *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              >
                <option value="Electricity">{tr("Electricity")}</option>
                <option value="Water">{tr("Water")}</option>
                <option value="Transport">{tr("Transport")}</option>
                <option value="Packaging">{tr("Packaging")}</option>
                <option value="Maintenance">{tr("Maintenance")}</option>
                <option value="Other">{tr("Other Operational Expenses")}</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-stone-700 font-semibold mb-1">{tr("Description")} *</label>
              <input
                type="text"
                required
                placeholder={tr("Expense description...")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            {/* Amount & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">{tr("Amount")} (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">{tr("Payment Method")}</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => {
                    const method = e.target.value;
                    setPaymentMethod(method);
                    if (method === 'CASH') {
                      setBankAccountId('');
                    } else if (!bankAccountId && bankAccounts.length > 0) {
                      const activeAcc = bankAccounts.find((a) => a.status !== 'INACTIVE');
                      if (activeAcc) setBankAccountId(activeAcc.accountId);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                >
                  <option value="CASH">Cash Drawer</option>
                  <option value="CARD">Company Card</option>
                  <option value="ONLINE">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Bank Account Selection (Only for Company Card or Bank Transfer) */}
            {(paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <label className="block text-stone-800 font-semibold text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Select Company Bank Account *</span>
                </label>
                <select
                  required
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 font-medium focus:outline-hidden focus:border-amber-600"
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts
                    .filter((a) => a.status !== 'INACTIVE')
                    .map((acc) => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.bankName} - {acc.accountNumber} ({acc.accountName}) [Bal: Rs. {Number(acc.balance || 0).toLocaleString()}]
                      </option>
                    ))}
                </select>

                {selectedAccount && (
                  <div className="flex items-center justify-between text-[11px] text-stone-600 px-1 pt-1">
                    <span>Available Balance:</span>
                    <span className="font-bold text-stone-900">Rs. {Number(selectedAccount.balance || 0).toLocaleString()}</span>
                  </div>
                )}

                {bankAccounts.length === 0 && (
                  <p className="text-[11px] text-amber-800 italic">
                    No bank accounts found. Please add business bank accounts under Admin Finance.
                  </p>
                )}
              </div>
            )}

            {/* Receipt / Attachment (if applicable) Field */}
            <div>
              <label className="block text-stone-700 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                  <span>Receipt / Attachment (if applicable)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal italic">Optional</span>
              </label>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Paste receipt URL or reference..."
                    value={receiptAttachment}
                    onChange={(e) => setReceiptAttachment(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-hidden focus:border-amber-600 focus:bg-white"
                  />
                  <label className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer border border-stone-300 flex items-center space-x-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleAttachmentFileChange(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                {receiptAttachment && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                    <span className="truncate max-w-[200px] font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{receiptAttachment.startsWith('data:') ? 'Receipt file attached' : receiptAttachment}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReceiptAttachment('')}
                      className="text-rose-600 hover:underline font-bold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-bold text-stone-900 text-sm">Expenses Log</h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-800 text-xs focus:outline-hidden focus:border-amber-600"
              >
                <option value="ALL">All Categories</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Transport">Transport</option>
                <option value="Packaging">Packaging</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID, desc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-800 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">Expense ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.expenseId} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {exp.expenseId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{exp.date}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-800">{exp.category}</td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="text-stone-900 font-medium truncate" title={exp.description}>
                          {exp.description}
                        </div>
                        {exp.receiptAttachment && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingExpense(exp);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 font-bold mt-0.5 cursor-pointer bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                            title="Click to view attached receipt"
                          >
                            <Paperclip className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Receipt attached</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {exp.paymentMethod === 'CASH' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            Cash Drawer
                          </span>
                        )}
                        {exp.paymentMethod === 'CARD' && (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              Company Card
                            </span>
                            {exp.bankAccountName && (
                              <span className="text-[10px] text-stone-500 font-mono mt-0.5" title={exp.bankAccountName}>
                                {exp.bankAccountName}
                              </span>
                            )}
                          </div>
                        )}
                        {exp.paymentMethod === 'ONLINE' && (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-fit">
                              <Building2 className="w-3 h-3 text-purple-600" />
                              Bank Transfer
                            </span>
                            {exp.bankAccountName && (
                              <span className="text-[10px] text-stone-500 font-mono mt-0.5" title={exp.bankAccountName}>
                                {exp.bankAccountName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">
                        Rs. {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewingExpense(exp)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <ReceiptText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">Expense Details</h3>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Expense ID:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {viewingExpense.expenseId}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Date:</span>
                <span className="font-mono font-semibold text-stone-800">{viewingExpense.date}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Category:</span>
                <span className="font-bold text-amber-800">{viewingExpense.category}</span>
              </div>

              <div className="py-1.5 border-b border-stone-100">
                <span className="text-stone-500 block mb-1">Description:</span>
                <span className="font-medium text-stone-900 bg-stone-50 p-2.5 rounded-xl block border border-stone-200">
                  {viewingExpense.description}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Amount:</span>
                <span className="text-base font-black text-rose-600">
                  Rs. {viewingExpense.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Payment Method:</span>
                <span className="font-bold text-stone-800">
                  {viewingExpense.paymentMethod === 'CASH'
                    ? 'Cash Drawer'
                    : viewingExpense.paymentMethod === 'CARD'
                    ? 'Company Card'
                    : 'Bank Transfer'}
                </span>
              </div>

              {viewingExpense.bankAccountName && (
                <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Bank Account:</span>
                  <span className="font-mono font-semibold text-stone-800">{viewingExpense.bankAccountName}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5">
                <span className="text-stone-500">Recorded By:</span>
                <span className="font-semibold text-stone-700">{viewingExpense.addedBy}</span>
              </div>

              {/* Receipt / Attachment Preview in View Modal */}
              {viewingExpense.receiptAttachment && (
                <div className="py-2.5 border-t border-stone-100 space-y-2">
                  <div className="flex items-center space-x-1.5 text-stone-700 font-bold text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                    <span>Receipt / Attachment (if applicable):</span>
                  </div>

                  {viewingExpense.receiptAttachment.startsWith('data:image') ||
                  viewingExpense.receiptAttachment.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                    <div className="space-y-2">
                      <div className="max-h-48 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center">
                        <img
                          src={viewingExpense.receiptAttachment}
                          alt="Receipt Preview"
                          className="max-h-48 object-contain"
                        />
                      </div>
                      <a
                        href={viewingExpense.receiptAttachment}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:underline font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open receipt in full size</span>
                      </a>
                    </div>
                  ) : (
                    <a
                      href={viewingExpense.receiptAttachment}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span className="truncate max-w-xs">
                        {viewingExpense.receiptAttachment.startsWith('data:') ? 'Open Attached Document' : viewingExpense.receiptAttachment}
                      </span>
                      <ExternalLink className="w-3 h-3 text-amber-600 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-stone-900 text-base">Edit Expense - {editingExpense.expenseId}</h3>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3.5 text-xs">
              {/* Date & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>Expense Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Transport">Transport</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other Operational Expenses</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e: any) => {
                      const method = e.target.value;
                      setEditPaymentMethod(method);
                      if (method === 'CASH') {
                        setEditBankAccountId('');
                      } else if (!editBankAccountId && bankAccounts.length > 0) {
                        const activeAcc = bankAccounts.find((a) => a.status !== 'INACTIVE');
                        if (activeAcc) setEditBankAccountId(activeAcc.accountId);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="CARD">Company Card</option>
                    <option value="ONLINE">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Bank Account Selection if Card or Bank Transfer */}
              {(editPaymentMethod === 'CARD' || editPaymentMethod === 'ONLINE') && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  <label className="block text-stone-800 font-semibold text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Company Bank Account *</span>
                  </label>
                  <select
                    required
                    value={editBankAccountId}
                    onChange={(e) => setEditBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 text-stone-900 font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="">-- Select Bank Account --</option>
                    {bankAccounts
                      .filter((a) => a.status !== 'INACTIVE')
                      .map((acc) => (
                        <option key={acc.accountId} value={acc.accountId}>
                          {acc.bankName} - {acc.accountNumber} ({acc.accountName}) [Bal: Rs. {Number(acc.balance || 0).toLocaleString()}]
                        </option>
                      ))}
                  </select>

                  {selectedEditAccount && (
                    <div className="flex items-center justify-between text-[11px] text-stone-600 px-1 pt-1">
                      <span>Available Balance:</span>
                      <span className="font-bold text-stone-900">
                        Rs. {Number(selectedEditAccount.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt / Attachment in Edit Modal */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                    <span>Receipt / Attachment (if applicable)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal italic">Optional</span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste receipt URL or reference..."
                      value={editReceiptAttachment}
                      onChange={(e) => setEditReceiptAttachment(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    />
                    <label className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer border border-stone-300 flex items-center space-x-1.5 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleAttachmentFileChange(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {editReceiptAttachment && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                      <span className="truncate max-w-[200px] font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>{editReceiptAttachment.startsWith('data:') ? 'Receipt file attached' : editReceiptAttachment}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditReceiptAttachment('')}
                        className="text-rose-600 hover:underline font-bold ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-rose-200">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Delete Expense?</h3>
                <span className="font-mono text-xs font-bold text-rose-700">{deletingExpense.expenseId}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Are you sure you want to delete this expense for{' '}
              <strong className="text-stone-900">Rs. {deletingExpense.amount.toLocaleString()}</strong> ({deletingExpense.category})?
              {deletingExpense.bankAccountId && (
                <span className="block mt-1 text-amber-700 font-medium">
                  Note: The deducted amount will be refunded back to the bank account balance.
                </span>
              )}
            </p>

            <div className="pt-2 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteExpense}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
