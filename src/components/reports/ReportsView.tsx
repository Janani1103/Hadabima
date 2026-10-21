'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Search,
  RefreshCw,
  ShoppingBag,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Users,
  HandCoins,
  Receipt,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';

interface ReportsViewProps {
  role: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  currentUser: {
    employeeId: string;
    fullName: string;
  };
}

export type ReportType =
  | 'DAILY_SALES'
  | 'MONTHLY_SALES'
  | 'EXPENSES'
  | 'PROFIT_LOSS'
  | 'EMPLOYEES'
  | 'ADVANCES'
  | 'BILLS'
  | 'AUDIT';

export function ReportsView({ role, currentUser }: ReportsViewProps) {
  const { t, tr, language } = useLanguage();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const [activeReport, setActiveReport] = useState<ReportType>('DAILY_SALES');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bills, setBills] = useState<any[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);

  // Load report data whenever parameters change
  useEffect(() => {
    loadData();
  }, [activeReport, selectedDate, selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeReport === 'DAILY_SALES' || activeReport === 'PROFIT_LOSS') {
        const [billsRes, finRes, expRes, settleRes] = await Promise.all([
          fetch(`/api/bills?date=${selectedDate}`),
          fetch(`/api/finance/summary?date=${selectedDate}`),
          fetch(`/api/expenses?date=${selectedDate}`),
          fetch(`/api/settlements?date=${selectedDate}`),
        ]);
        const bData = await billsRes.json();
        const fData = await finRes.json();
        const eData = await expRes.json();
        const sData = await settleRes.json();

        if (bData.success) setBills(bData.bills || []);
        if (fData.success) setFinanceSummary(fData.summary || {});
        if (eData.success) setExpenses(eData.expenses || []);
        if (sData.success) setSettlements(sData.settlements || []);
      } else if (activeReport === 'MONTHLY_SALES') {
        const [mBillsRes, allExpRes, allSettleRes] = await Promise.all([
          fetch(`/api/bills?month=${selectedMonth}`),
          fetch('/api/expenses'),
          fetch('/api/settlements'),
        ]);
        const mbData = await mBillsRes.json();
        const aeData = await allExpRes.json();
        const asData = await allSettleRes.json();

        if (mbData.success) setMonthlyBills(mbData.bills || []);
        if (aeData.success) setExpenses(aeData.expenses || []);
        if (asData.success) setSettlements(asData.settlements || []);
      } else if (activeReport === 'EXPENSES') {
        const expRes = await fetch('/api/expenses');
        const expData = await expRes.json();
        if (expData.success) setExpenses(expData.expenses || []);
      } else if (activeReport === 'EMPLOYEES') {
        const [empRes, allBillsRes, allSettleRes, advRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/bills'),
          fetch('/api/settlements'),
          fetch('/api/advances'),
        ]);
        const empData = await empRes.json();
        const bData = await allBillsRes.json();
        const sData = await allSettleRes.json();
        const aData = await advRes.json();

        if (empData.success) setEmployees(empData.employees || []);
        if (bData.success) setBills(bData.bills || []);
        if (sData.success) setSettlements(sData.settlements || []);
        if (aData.success) setAdvances(aData.advances || []);
      } else if (activeReport === 'ADVANCES') {
        const advRes = await fetch('/api/advances');
        const advData = await advRes.json();
        if (advData.success) setAdvances(advData.advances || []);
      } else if (activeReport === 'BILLS') {
        const billsRes = await fetch('/api/bills');
        const billsData = await billsRes.json();
        if (billsData.success) setBills(billsData.bills || []);
      } else if (activeReport === 'AUDIT') {
        const auditRes = await fetch('/api/audit-logs');
        const auditData = await auditRes.json();
        if (auditData.success) setAuditLogs(auditData.auditLogs || []);
      }
    } catch (e) {
      console.error('Error loading report data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // CSV Export utility
  const handleExportCSV = () => {
    let filename = `hadabima_${activeReport.toLowerCase()}_${selectedDate || selectedMonth}.csv`;
    let csvContent = '';

    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    if (activeReport === 'DAILY_SALES') {
      const headers = ['Bill Number', 'Time', 'Sale Type', 'Cashier', 'Payment Method', 'Items Count', 'Subtotal', 'Discount', 'Total'];
      const rows = bills.map((b) => [
        escapeCsv(b.billNumber),
        escapeCsv(new Date(b.createdAt).toLocaleTimeString()),
        escapeCsv(b.saleType),
        escapeCsv(b.cashierName),
        escapeCsv(b.paymentMethod),
        escapeCsv(b.items?.length || 0),
        escapeCsv(b.subtotal || b.total),
        escapeCsv(b.discount || 0),
        escapeCsv(b.total),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'MONTHLY_SALES') {
      const headers = ['Date', 'Total Bills', 'Gross Revenue (Rs.)', 'Customer Sales (Rs.)', 'Staff Sales (Rs.)'];
      const grouped: Record<string, { count: number; total: number; customer: number; staff: number }> = {};
      monthlyBills.forEach((b) => {
        if (b.status === 'VOIDED') return;
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        if (!grouped[d]) grouped[d] = { count: 0, total: 0, customer: 0, staff: 0 };
        grouped[d].count += 1;
        grouped[d].total += Number(b.total || 0);
        if (b.saleType === 'STAFF') grouped[d].staff += Number(b.total || 0);
        else grouped[d].customer += Number(b.total || 0);
      });
      const rows = Object.entries(grouped).map(([d, g]) => [
        escapeCsv(d),
        escapeCsv(g.count),
        escapeCsv(g.total),
        escapeCsv(g.customer),
        escapeCsv(g.staff),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'EXPENSES') {
      const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Payment Method', 'Amount (Rs.)', 'Recorded By', 'Status'];
      const rows = expenses.map((e) => [
        escapeCsv(e.expenseId),
        escapeCsv(e.date),
        escapeCsv(e.category),
        escapeCsv(e.description),
        escapeCsv(e.paymentMethod),
        escapeCsv(e.amount),
        escapeCsv(e.addedBy),
        escapeCsv(e.status),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'PROFIT_LOSS') {
      const rev = Number(financeSummary?.totalRevenue || 0);
      const custRev = Number(financeSummary?.customerSalesValue || 0);
      const staffRev = Number(financeSummary?.staffSalesValue || 0);
      const exp = Number(financeSummary?.totalExpenses || 0);
      const settles = Number(financeSummary?.totalSettlementsPaid || 0);
      const net = rev - exp - settles;
      const rows = [
        ['Section', 'Category / Item', 'Amount (Rs.)'],
        ['1. REVENUE', 'Customer Sales', custRev],
        ['1. REVENUE', 'Staff Sales (Subsidized)', staffRev],
        ['1. REVENUE', 'TOTAL GROSS REVENUE', rev],
        ['2. PRODUCTION / COMMISSIONS', 'Kitchen Staff Commission Settlements', settles],
        ['2. PRODUCTION / COMMISSIONS', 'GROSS MARGIN AFTER SETTLEMENTS', rev - settles],
        ['3. OPERATIONAL EXPENSES', 'Utility, Packaging & Store Expenses', exp],
        ['4. NET OPERATING PROFIT', 'NET BUSINESS PROFIT / LOSS', net],
      ];
      csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    } else if (activeReport === 'EMPLOYEES') {
      const headers = ['Employee ID', 'Full Name', 'Role', 'NIC', 'Contact', 'Basic Salary (Rs.)', 'Commission Rate %', 'Status'];
      const rows = employees.map((emp) => [
        escapeCsv(emp.employeeId),
        escapeCsv(emp.fullName),
        escapeCsv(emp.employeeType),
        escapeCsv(emp.nic),
        escapeCsv(emp.contactNumber || emp.contactNumber1),
        escapeCsv(emp.basicSalary),
        escapeCsv(emp.commissionRate || 0),
        escapeCsv(emp.status),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'ADVANCES') {
      const headers = ['Advance ID', 'Date Granted', 'Employee ID', 'Employee Name', 'Role', 'Total Granted (Rs.)', 'Deducted (Rs.)', 'Remaining Balance (Rs.)', 'Status'];
      const rows = advances.map((a) => [
        escapeCsv(a.advanceId),
        escapeCsv(a.date),
        escapeCsv(a.employeeId),
        escapeCsv(a.employeeName),
        escapeCsv(a.employeeRole),
        escapeCsv(a.amount),
        escapeCsv(a.deductedAmount || (a.status === 'DEDUCTED' ? a.amount : 0)),
        escapeCsv(a.remainingAmount ?? (a.status === 'DEDUCTED' ? 0 : a.amount)),
        escapeCsv(a.status),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'BILLS') {
      const headers = ['Bill Number', 'Date', 'Time', 'Sale Type', 'Cashier', 'Payment Method', 'Items Count', 'Total (Rs.)', 'Status'];
      const rows = bills.map((b) => [
        escapeCsv(b.billNumber),
        escapeCsv(new Date(b.createdAt).toISOString().split('T')[0]),
        escapeCsv(new Date(b.createdAt).toLocaleTimeString()),
        escapeCsv(b.saleType),
        escapeCsv(b.cashierName),
        escapeCsv(b.paymentMethod),
        escapeCsv(b.items?.length || 0),
        escapeCsv(b.total),
        escapeCsv(b.status),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeReport === 'AUDIT') {
      const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Record ID', 'Changes / Details'];
      const rows = auditLogs.map((log) => [
        escapeCsv(log.logId),
        escapeCsv(new Date(log.timestamp).toLocaleString()),
        escapeCsv(log.user),
        escapeCsv(log.role),
        escapeCsv(log.action),
        escapeCsv(log.module),
        escapeCsv(log.recordId),
        escapeCsv(log.details || log.newValue || ''),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Report tabs configuration
  const reportTabs: { id: ReportType; label: string; icon: any }[] = [
    { id: 'DAILY_SALES', label: tr('Daily Sales'), icon: ShoppingBag },
    { id: 'MONTHLY_SALES', label: tr('Monthly Sales'), icon: BarChart3 },
    { id: 'EXPENSES', label: tr('Expenses'), icon: ReceiptText },
    { id: 'PROFIT_LOSS', label: tr('Profit & Loss'), icon: TrendingUp },
    { id: 'EMPLOYEES', label: tr('Employee Roster'), icon: Users },
    { id: 'ADVANCES', label: tr('Staff Advances'), icon: HandCoins },
    { id: 'BILLS', label: tr('Bill Register'), icon: Receipt },
    { id: 'AUDIT', label: tr('Audit Trail'), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-200 shadow-2xs">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                {tr('Reports Center')}
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {tr('Operational, sales, staff performance, P&L, advance and compliance audit reports')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Picker (for Daily, P&L, Bills) */}
          {(activeReport === 'DAILY_SALES' || activeReport === 'PROFIT_LOSS' || activeReport === 'BILLS') && (
            <div className="flex items-center space-x-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/90 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-stone-900 font-bold focus:outline-hidden cursor-pointer"
              />
            </div>
          )}

          {/* Month Picker (for Monthly Sales) */}
          {activeReport === 'MONTHLY_SALES' && (
            <div className="flex items-center space-x-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/90 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-stone-900 font-bold focus:outline-hidden cursor-pointer"
              />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/90 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
            title={tr('Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-stone-700" />
            <span>{tr('Export CSV')}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{tr('Print / PDF')}</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReport(tab.id);
                setSearchTerm('');
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-600/20 translate-y-[-1px]'
                  : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-950 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-stone-200/80 p-3 rounded-2xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={tr('Search report records...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filter for Expenses */}
        {activeReport === 'EXPENSES' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-stone-500 font-semibold">{tr('Category')}:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden"
            >
              <option value="ALL">{tr('All Categories')}</option>
              <option value="UTILITY">Utility (Electricity/Water)</option>
              <option value="SUPPLIES">Supplies & Ingredients</option>
              <option value="DRAWER">Cash Drawer Operational</option>
              <option value="PACKAGING">Packaging & Bags</option>
              <option value="TRANSPORT">Transport & Delivery</option>
              <option value="OTHER">Other Miscellaneous</option>
            </select>
          </div>
        )}

        {/* Role Filter for Employees and Advances */}
        {(activeReport === 'EMPLOYEES' || activeReport === 'ADVANCES') && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-stone-500 font-semibold">{tr('Filter by Role')}:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden"
            >
              <option value="ALL">{tr('All Roles')}</option>
              <option value="CASHIER">{t.roles.cashier}</option>
              <option value="KITCHEN">{t.roles.kitchen}</option>
              <option value="ADMIN">{t.roles.admin}</option>
            </select>
          </div>
        )}

        {/* Status Filter for Bills and Advances */}
        {(activeReport === 'BILLS' || activeReport === 'ADVANCES') && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-stone-500 font-semibold">{tr('Filter by Status')}:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden"
            >
              <option value="ALL">{tr('All')}</option>
              {activeReport === 'BILLS' ? (
                <>
                  <option value="COMPLETED">{tr('COMPLETED')}</option>
                  <option value="VOIDED">{tr('VOIDED')}</option>
                </>
              ) : (
                <>
                  <option value="APPROVED">{tr('ACTIVE')}</option>
                  <option value="DEDUCTED">{tr('CLEARED')}</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SCREEN REPORT CONTENT                                          */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {/* REPORT 1: DAILY SALES */}
        {activeReport === 'DAILY_SALES' && (
          <DailySalesReport
            bills={bills}
            financeSummary={financeSummary}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 2: MONTHLY SALES */}
        {activeReport === 'MONTHLY_SALES' && (
          <MonthlySalesReport
            monthlyBills={monthlyBills}
            selectedMonth={selectedMonth}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 3: EXPENSES */}
        {activeReport === 'EXPENSES' && (
          <ExpensesReport
            expenses={expenses}
            filterCategory={filterCategory}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 4: PROFIT & LOSS */}
        {activeReport === 'PROFIT_LOSS' && (
          <ProfitLossReport
            financeSummary={financeSummary}
            selectedDate={selectedDate}
            expenses={expenses}
            settlements={settlements}
          />
        )}

        {/* REPORT 5: EMPLOYEES */}
        {activeReport === 'EMPLOYEES' && (
          <EmployeesReport
            employees={employees}
            bills={bills}
            settlements={settlements}
            filterRole={filterRole}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 6: ADVANCES */}
        {activeReport === 'ADVANCES' && (
          <AdvancesReport
            advances={advances}
            filterRole={filterRole}
            filterStatus={filterStatus}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 7: BILL REGISTER */}
        {activeReport === 'BILLS' && (
          <BillRegisterReport
            bills={bills}
            filterStatus={filterStatus}
            searchTerm={searchTerm}
          />
        )}

        {/* REPORT 8: AUDIT TRAIL */}
        {activeReport === 'AUDIT' && (
          <AuditTrailReport
            auditLogs={auditLogs}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* ============================================================== */}
      {/* PRINT-ONLY FORMAL DOCUMENT VIEW (#printable-report)            */}
      {/* ============================================================== */}
      <div id="printable-report" className="hidden">
        {/* Letterhead */}
        <div className="border-b-2 border-stone-800 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-wider">HADABIMA FOOD SHOP</h1>
            <p className="text-[10px] text-stone-600">Agricultural Development Authority Management Portal</p>
            <p className="text-[9px] text-stone-500">Official Operational & Financial Record</p>
          </div>
          <div className="text-right text-[10px]">
            <div className="font-bold text-stone-900 uppercase">
              {reportTabs.find((t) => t.id === activeReport)?.label}
            </div>
            <div className="text-stone-500">Generated: {new Date().toLocaleString()}</div>
            <div className="text-stone-500">Generated By: {currentUser.fullName} ({role})</div>
            <div className="text-stone-600 font-semibold">Filter: {selectedDate || selectedMonth}</div>
          </div>
        </div>

        {/* Report Table for Print */}
        <div className="mt-4">
          {activeReport === 'DAILY_SALES' && (
            <table className="w-full text-left text-[10px] border border-stone-300">
              <thead className="bg-stone-100 border-b border-stone-300">
                <tr>
                  <th className="p-1.5">Bill #</th>
                  <th className="p-1.5">Time</th>
                  <th className="p-1.5">Sale Type</th>
                  <th className="p-1.5">Cashier</th>
                  <th className="p-1.5">Payment</th>
                  <th className="p-1.5 text-right">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {bills.map((b) => (
                  <tr key={b.billId}>
                    <td className="p-1.5 font-mono font-bold">{b.billNumber}</td>
                    <td className="p-1.5">{new Date(b.createdAt).toLocaleTimeString()}</td>
                    <td className="p-1.5">{b.saleType}</td>
                    <td className="p-1.5">{b.cashierName}</td>
                    <td className="p-1.5">{b.paymentMethod}</td>
                    <td className="p-1.5 text-right font-bold">Rs. {Number(b.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'EXPENSES' && (
            <table className="w-full text-left text-[10px] border border-stone-300">
              <thead className="bg-stone-100 border-b border-stone-300">
                <tr>
                  <th className="p-1.5">Expense ID</th>
                  <th className="p-1.5">Date</th>
                  <th className="p-1.5">Category</th>
                  <th className="p-1.5">Description</th>
                  <th className="p-1.5">Payment</th>
                  <th className="p-1.5">Recorded By</th>
                  <th className="p-1.5 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {expenses.map((e) => (
                  <tr key={e.expenseId}>
                    <td className="p-1.5 font-mono font-bold">{e.expenseId}</td>
                    <td className="p-1.5">{e.date}</td>
                    <td className="p-1.5">{e.category}</td>
                    <td className="p-1.5">{e.description}</td>
                    <td className="p-1.5">{e.paymentMethod}</td>
                    <td className="p-1.5">{e.addedBy}</td>
                    <td className="p-1.5 text-right font-bold">Rs. {Number(e.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'PROFIT_LOSS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 border border-stone-300 p-2 bg-stone-50 text-[10px]">
                <div>Gross Revenue: <strong>Rs. {Number(financeSummary?.totalRevenue || 0).toLocaleString()}</strong></div>
                <div>Expenses: <strong>Rs. {Number(financeSummary?.totalExpenses || 0).toLocaleString()}</strong></div>
                <div>Net Operating Result: <strong>Rs. {Number(financeSummary?.netProfit || 0).toLocaleString()}</strong></div>
              </div>
            </div>
          )}

          {activeReport === 'ADVANCES' && (
            <table className="w-full text-left text-[10px] border border-stone-300">
              <thead className="bg-stone-100 border-b border-stone-300">
                <tr>
                  <th className="p-1.5">Advance ID</th>
                  <th className="p-1.5">Date</th>
                  <th className="p-1.5">Employee</th>
                  <th className="p-1.5">Role</th>
                  <th className="p-1.5 text-right">Granted</th>
                  <th className="p-1.5 text-right">Deducted</th>
                  <th className="p-1.5 text-right">Balance</th>
                  <th className="p-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {advances.map((a) => (
                  <tr key={a.advanceId}>
                    <td className="p-1.5 font-mono font-bold">{a.advanceId}</td>
                    <td className="p-1.5">{a.date}</td>
                    <td className="p-1.5">{a.employeeName}</td>
                    <td className="p-1.5">{a.employeeRole}</td>
                    <td className="p-1.5 text-right">Rs. {Number(a.amount).toLocaleString()}</td>
                    <td className="p-1.5 text-right">Rs. {Number(a.deductedAmount || (a.status === 'DEDUCTED' ? a.amount : 0)).toLocaleString()}</td>
                    <td className="p-1.5 text-right font-bold">Rs. {Number(a.remainingAmount ?? (a.status === 'DEDUCTED' ? 0 : a.amount)).toLocaleString()}</td>
                    <td className="p-1.5">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'AUDIT' && (
            <table className="w-full text-left text-[9px] border border-stone-300">
              <thead className="bg-stone-100 border-b border-stone-300">
                <tr>
                  <th className="p-1.5">Timestamp</th>
                  <th className="p-1.5">User</th>
                  <th className="p-1.5">Action</th>
                  <th className="p-1.5">Module</th>
                  <th className="p-1.5">Record</th>
                  <th className="p-1.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {auditLogs.map((log) => (
                  <tr key={log.logId}>
                    <td className="p-1.5 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-1.5 font-bold">{log.user} ({log.role})</td>
                    <td className="p-1.5">{log.action}</td>
                    <td className="p-1.5">{log.module}</td>
                    <td className="p-1.5 font-mono">{log.recordId}</td>
                    <td className="p-1.5">{log.details || log.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formal Signature Footer */}
        <div className="mt-12 pt-6 border-t border-stone-300 grid grid-cols-3 text-center text-[10px]">
          <div>
            <div className="border-b border-stone-400 w-32 mx-auto mb-1"></div>
            <div>Prepared By</div>
          </div>
          <div>
            <div className="border-b border-stone-400 w-32 mx-auto mb-1"></div>
            <div>Reviewed By (Accountant)</div>
          </div>
          <div>
            <div className="border-b border-stone-400 w-32 mx-auto mb-1"></div>
            <div>Approved By (Administrator)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: 1. DAILY SALES REPORT
// =========================================================================
function DailySalesReport({
  bills,
  financeSummary,
  selectedDate,
  searchTerm,
}: {
  bills: any[];
  financeSummary: any;
  selectedDate: string;
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const activeBills = bills.filter((b) => b.status !== 'VOIDED');
  const totalRev = activeBills.reduce((s, b) => s + Number(b.total || 0), 0);
  const customerRev = activeBills.filter((b) => b.saleType !== 'STAFF').reduce((s, b) => s + Number(b.total || 0), 0);
  const staffRev = activeBills.filter((b) => b.saleType === 'STAFF').reduce((s, b) => s + Number(b.total || 0), 0);
  const cashRev = activeBills.filter((b) => b.paymentMethod === 'CASH').reduce((s, b) => s + Number(b.total || 0), 0);
  const cardRev = activeBills.filter((b) => b.paymentMethod === 'CARD').reduce((s, b) => s + Number(b.total || 0), 0);
  const onlineRev = activeBills.filter((b) => b.paymentMethod === 'ONLINE').reduce((s, b) => s + Number(b.total || 0), 0);

  const filteredBills = bills.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.billNumber || '').toLowerCase().includes(term) ||
      (b.cashierName || '').toLowerCase().includes(term) ||
      (b.paymentMethod || '').toLowerCase().includes(term) ||
      (b.saleType || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">{tr('Gross Sales Revenue')}</span>
          <div className="text-xl font-black text-stone-900 mt-1 tabular-nums">Rs. {totalRev.toLocaleString()}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">{activeBills.length} {tr('bills issued')}</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">{tr('Customer Sales Total')}</span>
          <div className="text-xl font-black text-amber-700 mt-1 tabular-nums">Rs. {customerRev.toLocaleString()}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Normal price orders</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">{tr('Staff Sales Total')}</span>
          <div className="text-xl font-black text-orange-700 mt-1 tabular-nums">Rs. {staffRev.toLocaleString()}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Staff subsidized orders</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Cash In Drawer</span>
          <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">Rs. {cashRev.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Physical currency</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Card POS Total</span>
          <div className="text-xl font-black text-sky-700 mt-1 tabular-nums">Rs. {cardRev.toLocaleString()}</div>
          <div className="text-[10px] text-sky-600 mt-0.5">Bank direct credit</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Online / QR Total</span>
          <div className="text-xl font-black text-indigo-700 mt-1 tabular-nums">Rs. {onlineRev.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Instant transfers</div>
        </div>
      </div>

      {/* Daily Bills Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm">
              {tr('Daily Sales')} • {selectedDate}
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {filteredBills.length} records found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Sale Type</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No sales recorded for this date.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.billId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{b.billNumber}</td>
                    <td className="py-3 px-4 font-mono text-stone-500">
                      {new Date(b.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.saleType === 'STAFF' ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-stone-100 text-stone-800'}`}>
                        {b.saleType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{b.cashierName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-900">{b.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-medium">{b.items?.length || 0} items</td>
                    <td className="py-3 px-4 text-right font-black text-stone-900 tabular-nums">
                      Rs. {Number(b.total).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={b.status} />
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

// =========================================================================
// SUB-COMPONENT: 2. MONTHLY SALES REPORT
// =========================================================================
function MonthlySalesReport({
  monthlyBills,
  selectedMonth,
  searchTerm,
}: {
  monthlyBills: any[];
  selectedMonth: string;
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const activeBills = monthlyBills.filter((b) => b.status !== 'VOIDED');
  const totalRev = activeBills.reduce((s, b) => s + Number(b.total || 0), 0);
  const customerRev = activeBills.filter((b) => b.saleType !== 'STAFF').reduce((s, b) => s + Number(b.total || 0), 0);
  const staffRev = activeBills.filter((b) => b.saleType === 'STAFF').reduce((s, b) => s + Number(b.total || 0), 0);

  // Group by day of month
  const dailyBreakdown = useMemo(() => {
    const map: Record<string, { date: string; billCount: number; total: number; customer: number; staff: number; cash: number; card: number; online: number }> = {};
    monthlyBills.forEach((b) => {
      if (b.status === 'VOIDED') return;
      const d = new Date(b.createdAt).toISOString().split('T')[0];
      if (!map[d]) {
        map[d] = { date: d, billCount: 0, total: 0, customer: 0, staff: 0, cash: 0, card: 0, online: 0 };
      }
      map[d].billCount += 1;
      map[d].total += Number(b.total || 0);
      if (b.saleType === 'STAFF') map[d].staff += Number(b.total || 0);
      else map[d].customer += Number(b.total || 0);

      if (b.paymentMethod === 'CASH') map[d].cash += Number(b.total || 0);
      else if (b.paymentMethod === 'CARD') map[d].card += Number(b.total || 0);
      else if (b.paymentMethod === 'ONLINE') map[d].online += Number(b.total || 0);
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthlyBills]);

  const filteredDays = dailyBreakdown.filter((d) => {
    if (!searchTerm) return true;
    return d.date.includes(searchTerm);
  });

  return (
    <div className="space-y-5">
      {/* Monthly Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Monthly Gross Turnover</span>
          <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">Rs. {totalRev.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">{activeBills.length} Total orders across month</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Customer Sales</span>
          <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">Rs. {customerRev.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            {totalRev > 0 ? ((customerRev / totalRev) * 100).toFixed(1) : 0}% of turnover
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Staff Sales</span>
          <div className="text-2xl font-black text-orange-700 mt-1 tabular-nums">Rs. {staffRev.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            {totalRev > 0 ? ((staffRev / totalRev) * 100).toFixed(1) : 0}% subsidized
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Average Daily Turnover</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
            Rs. {dailyBreakdown.length > 0 ? Math.round(totalRev / dailyBreakdown.length).toLocaleString() : 0}
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Across {dailyBreakdown.length} active trade days</p>
        </div>
      </div>

      {/* Day by Day Aggregate Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Monthly Sales')} Daily Aggregation • {selectedMonth}
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{dailyBreakdown.length} trading days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Customer (Rs.)</th>
                <th className="py-3 px-4 text-right">Staff (Rs.)</th>
                <th className="py-3 px-4 text-right">Cash (Rs.)</th>
                <th className="py-3 px-4 text-right">Card/Online (Rs.)</th>
                <th className="py-3 px-4 text-right">Day Gross (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredDays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No sales recorded for this month.
                  </td>
                </tr>
              ) : (
                filteredDays.map((d) => (
                  <tr key={d.date} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{d.date}</td>
                    <td className="py-3 px-4 text-center font-bold text-stone-600">{d.billCount}</td>
                    <td className="py-3 px-4 text-right font-medium text-amber-800 tabular-nums">
                      Rs. {d.customer.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-orange-800 tabular-nums">
                      Rs. {d.staff.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-800 tabular-nums">
                      Rs. {d.cash.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-sky-800 tabular-nums">
                      Rs. {(d.card + d.online).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-stone-900 tabular-nums">
                      Rs. {d.total.toLocaleString()}
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

// =========================================================================
// SUB-COMPONENT: 3. EXPENSES REPORT
// =========================================================================
function ExpensesReport({
  expenses,
  filterCategory,
  searchTerm,
}: {
  expenses: any[];
  filterCategory: string;
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.expenseId || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.category || '').toLowerCase().includes(term) ||
      (e.addedBy || '').toLowerCase().includes(term)
    );
  });

  const totalAmount = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const cashExpenses = filteredExpenses.filter((e) => e.paymentMethod === 'CASH').reduce((s, e) => s + Number(e.amount || 0), 0);
  const bankExpenses = filteredExpenses.filter((e) => e.paymentMethod !== 'CASH').reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Expenses KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Expenses Recorded</span>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">Rs. {totalAmount.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">{filteredExpenses.length} expense transactions</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Cash Drawer Expenses</span>
          <div className="text-2xl font-black text-amber-800 mt-1 tabular-nums">Rs. {cashExpenses.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Direct physical drawer payouts</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Bank / Card Paid Expenses</span>
          <div className="text-2xl font-black text-sky-800 mt-1 tabular-nums">Rs. {bankExpenses.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Bank account transfers / card costs</p>
        </div>
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Expenses')} Ledger
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{filteredExpenses.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.expenseId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{e.expenseId}</td>
                    <td className="py-3 px-4 font-mono text-stone-600">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">{e.description}</td>
                    <td className="py-3 px-4 font-semibold text-stone-600">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-stone-500">{e.addedBy || 'Cashier'}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-700 tabular-nums">
                      Rs. {Number(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={e.status || 'ACTIVE'} />
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

// =========================================================================
// SUB-COMPONENT: 4. PROFIT & LOSS REPORT
// =========================================================================
function ProfitLossReport({
  financeSummary,
  selectedDate,
  expenses,
  settlements,
}: {
  financeSummary: any;
  selectedDate: string;
  expenses: any[];
  settlements: any[];
}) {
  const { tr } = useLanguage();

  const totalRev = Number(financeSummary?.totalRevenue || 0);
  const custRev = Number(financeSummary?.customerSalesValue || 0);
  const staffRev = Number(financeSummary?.staffSalesValue || 0);
  const totalExp = Number(financeSummary?.totalExpenses || 0);
  const totalSettles = Number(financeSummary?.totalSettlementsPaid || 0);
  const netProfit = totalRev - totalExp - totalSettles;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-5">
      {/* P&L Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">1. Gross Revenue</span>
          <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">Rs. {totalRev.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Customer + Staff billings</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">2. Kitchen Settlements</span>
          <div className="text-2xl font-black text-orange-700 mt-1 tabular-nums">-Rs. {totalSettles.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Commission payouts</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">3. Operating Expenses</span>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">-Rs. {totalExp.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Store & drawer costs</p>
        </div>

        <div className={`border p-5 rounded-2xl shadow-2xs ${isProfit ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
          <span className="text-[10px] font-extrabold uppercase text-stone-500">4. Net Profit / Loss</span>
          <div className={`text-2xl font-black mt-1 tabular-nums ${isProfit ? 'text-emerald-800' : 'text-rose-800'}`}>
            Rs. {netProfit.toLocaleString()}
          </div>
          <p className="text-xs font-semibold mt-1">
            {totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0}% Net Margin
          </p>
        </div>
      </div>

      {/* Formal P&L Statement Grid */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="font-black text-stone-900 text-base border-b border-stone-200/80 pb-3 flex items-center justify-between">
          <span>{tr('Profit & Loss')} Financial Statement</span>
          <span className="text-xs font-mono font-normal text-stone-500">{selectedDate}</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Revenue */}
          <div className="space-y-2">
            <div className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] bg-stone-100 p-2 rounded-lg">
              1. Operating Sales Revenue
            </div>
            <div className="flex justify-between px-3 text-stone-600">
              <span>Customer Regular Sales</span>
              <span className="font-bold text-stone-900 tabular-nums">Rs. {custRev.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 text-stone-600">
              <span>Staff Subsidized Food Sales</span>
              <span className="font-bold text-stone-900 tabular-nums">Rs. {staffRev.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 font-black text-stone-900 border-t border-stone-200 pt-1.5">
              <span>TOTAL GROSS REVENUE</span>
              <span className="tabular-nums">Rs. {totalRev.toLocaleString()}</span>
            </div>
          </div>

          {/* Cost of Production / Commissions */}
          <div className="space-y-2">
            <div className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] bg-stone-100 p-2 rounded-lg">
              2. Cost of Production & Kitchen Settlements
            </div>
            <div className="flex justify-between px-3 text-stone-600">
              <span>Kitchen Staff Daily Commission Settlements</span>
              <span className="font-bold text-rose-700 tabular-nums">-Rs. {totalSettles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 font-bold text-stone-900 border-t border-stone-200 pt-1.5">
              <span>GROSS OPERATING PROFIT</span>
              <span className="tabular-nums">Rs. {(totalRev - totalSettles).toLocaleString()}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2">
            <div className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] bg-stone-100 p-2 rounded-lg">
              3. Operating & Administrative Expenses
            </div>
            <div className="flex justify-between px-3 text-stone-600">
              <span>Store & Drawer Operational Expenses</span>
              <span className="font-bold text-rose-700 tabular-nums">-Rs. {totalExp.toLocaleString()}</span>
            </div>
          </div>

          {/* Net Result */}
          <div className={`p-4 rounded-xl border flex items-center justify-between font-black text-sm ${isProfit ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-rose-50 text-rose-950 border-rose-300'}`}>
            <span>NET OPERATING {isProfit ? 'PROFIT' : 'LOSS'}</span>
            <span className="text-xl tabular-nums">Rs. {netProfit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: 5. EMPLOYEES REPORT
// =========================================================================
function EmployeesReport({
  employees,
  bills,
  settlements,
  filterRole,
  searchTerm,
}: {
  employees: any[];
  bills: any[];
  settlements: any[];
  filterRole: string;
  searchTerm: string;
}) {
  const { tr, t } = useLanguage();

  const filtered = employees.filter((emp) => {
    if (filterRole !== 'ALL' && emp.employeeType !== filterRole) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (emp.fullName || '').toLowerCase().includes(term) ||
      (emp.employeeId || '').toLowerCase().includes(term) ||
      (emp.nic || '').toLowerCase().includes(term) ||
      (emp.username || '').toLowerCase().includes(term)
    );
  });

  const totalBasicSalaries = filtered.reduce((s, e) => s + Number(e.basicSalary || 0), 0);
  const cashierCount = filtered.filter((e) => e.employeeType === 'CASHIER').length;
  const kitchenCount = filtered.filter((e) => e.employeeType === 'KITCHEN').length;

  return (
    <div className="space-y-5">
      {/* Employee KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Staff Roster</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{filtered.length}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Registered Hadabima staff</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Front Desk Cashiers</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{cashierCount}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Fixed basic salary staff</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Kitchen Staff Chefs</span>
          <div className="text-2xl font-black text-orange-700 mt-1">{kitchenCount}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Daily commission based</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Basic Payroll</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">Rs. {totalBasicSalaries.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Monthly commitment</p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Employee Roster')} & Performance
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{filtered.length} staff members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">NIC & Contact</th>
                <th className="py-3 px-4 text-right">Basic Salary</th>
                <th className="py-3 px-4 text-center">Commission %</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">{emp.employeeId}</td>
                  <td className="py-3 px-4 font-extrabold text-stone-900">{emp.fullName}</td>
                  <td className="py-3 px-4">
                    <Badge status={emp.employeeType} />
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    <div>{emp.nic || '—'}</div>
                    <div className="text-[10px]">{emp.contactNumber || emp.contactNumber1 || '—'}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-stone-900 tabular-nums">
                    Rs. {Number(emp.basicSalary || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-800">
                    {emp.commissionRate ? `${emp.commissionRate}%` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={emp.status} />
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

// =========================================================================
// SUB-COMPONENT: 6. ADVANCES REPORT
// =========================================================================
function AdvancesReport({
  advances,
  filterRole,
  filterStatus,
  searchTerm,
}: {
  advances: any[];
  filterRole: string;
  filterStatus: string;
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const filtered = advances.filter((a) => {
    if (filterRole !== 'ALL' && a.employeeRole !== filterRole) return false;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'APPROVED' && a.status !== 'APPROVED' && a.status !== 'PENDING') return false;
      if (filterStatus === 'DEDUCTED' && a.status !== 'DEDUCTED') return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.advanceId || '').toLowerCase().includes(term) ||
      (a.employeeName || '').toLowerCase().includes(term) ||
      (a.reason || '').toLowerCase().includes(term)
    );
  });

  const totalGranted = filtered.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalDeducted = filtered.reduce((s, a) => s + Number(a.deductedAmount || (a.status === 'DEDUCTED' ? a.amount : 0)), 0);
  const outstanding = filtered.reduce((s, a) => s + Number(a.remainingAmount ?? (a.status === 'DEDUCTED' ? 0 : a.amount)), 0);

  return (
    <div className="space-y-5">
      {/* Advances KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Advances Granted</span>
          <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">Rs. {totalGranted.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">{filtered.length} advance records</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Recovered via Deductions</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">Rs. {totalDeducted.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Settlements & payroll deductions</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Outstanding Balance</span>
          <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">Rs. {outstanding.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Pending deduction recovery</p>
        </div>
      </div>

      {/* Advances Ledger Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Staff Advances')} Ledger
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{filtered.length} advance records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Advance ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Granted</th>
                <th className="py-3 px-4 text-right">Deducted</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((a) => {
                const rem = Number(a.remainingAmount ?? (a.status === 'DEDUCTED' ? 0 : a.amount));
                const ded = Number(a.deductedAmount || (a.status === 'DEDUCTED' ? a.amount : 0));
                return (
                  <tr key={a.advanceId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{a.advanceId}</td>
                    <td className="py-3 px-4 font-mono text-stone-600">{a.date}</td>
                    <td className="py-3 px-4 font-extrabold text-stone-900">{a.employeeName}</td>
                    <td className="py-3 px-4">
                      <Badge status={a.employeeRole || 'STAFF'} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                      Rs. {Number(a.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold tabular-nums">
                      Rs. {ded.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-900 tabular-nums">
                      Rs. {rem.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{a.reason || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: 7. BILL REGISTER REPORT
// =========================================================================
function BillRegisterReport({
  bills,
  filterStatus,
  searchTerm,
}: {
  bills: any[];
  filterStatus: string;
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const filtered = bills.filter((b) => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.billNumber || '').toLowerCase().includes(term) ||
      (b.cashierName || '').toLowerCase().includes(term) ||
      (b.saleType || '').toLowerCase().includes(term) ||
      (b.paymentMethod || '').toLowerCase().includes(term)
    );
  });

  const totalBilled = filtered.filter((b) => b.status !== 'VOIDED').reduce((s, b) => s + Number(b.total || 0), 0);
  const voidedTotal = filtered.filter((b) => b.status === 'VOIDED').reduce((s, b) => s + Number(b.total || 0), 0);

  return (
    <div className="space-y-5">
      {/* Bill Register Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Billed Volume</span>
          <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">Rs. {totalBilled.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">{filtered.filter((b) => b.status !== 'VOIDED').length} active bills</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Voided Invoices</span>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">Rs. {voidedTotal.toLocaleString()}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">{filtered.filter((b) => b.status === 'VOIDED').length} voided bills</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Bill Records</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{filtered.length}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Logged in transaction ledger</p>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Bill Register')} Master Ledger
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{filtered.length} bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Sale Type</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total (Rs.)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((b) => (
                <tr key={b.billId} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">{b.billNumber}</td>
                  <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.saleType === 'STAFF' ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-stone-100 text-stone-800'}`}>
                      {b.saleType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{b.cashierName}</td>
                  <td className="py-3 px-4 font-bold text-stone-800">{b.paymentMethod}</td>
                  <td className="py-3 px-4 text-stone-600">{b.items?.length || 0}</td>
                  <td className="py-3 px-4 text-right font-medium tabular-nums text-stone-600">
                    Rs. {Number(b.subtotal || b.total).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-medium tabular-nums text-rose-600">
                    {b.discount ? `-Rs. ${Number(b.discount).toLocaleString()}` : '0'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-stone-900 tabular-nums">
                    Rs. {Number(b.total).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={b.status} />
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

// =========================================================================
// SUB-COMPONENT: 8. AUDIT TRAIL REPORT
// =========================================================================
function AuditTrailReport({
  auditLogs,
  searchTerm,
}: {
  auditLogs: any[];
  searchTerm: string;
}) {
  const { tr } = useLanguage();

  const filtered = auditLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.logId || '').toLowerCase().includes(term) ||
      (log.user || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.module || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      (log.recordId || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Audit KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Total Audit Events</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{filtered.length}</div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Immutable compliance records</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Security & Void Actions</span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {filtered.filter((l) => (l.action || '').includes('VOID') || (l.action || '').includes('DELETE')).length}
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Voids, reversals, and deletions</p>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-stone-400">Financial Settlements</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {filtered.filter((l) => (l.action || '').includes('SETTLEMENT') || (l.action || '').includes('PAYROLL')).length}
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">Payouts and salary events</p>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm">
            {tr('Audit Trail')} Activity Log
          </h3>
          <span className="text-xs text-stone-500 font-semibold">{filtered.length} audit logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((log) => (
                <tr key={log.logId} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">{log.logId}</td>
                  <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-stone-900">{log.user}</td>
                  <td className="py-3 px-4">
                    <Badge status={log.role} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-600">{log.module}</td>
                  <td className="py-3 px-4 font-mono text-stone-500">{log.recordId || '—'}</td>
                  <td className="py-3 px-4 text-stone-600 max-w-sm truncate">
                    {log.details || log.newValue || '—'}
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
