'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Coins,
  Calculator,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  FileCheck2,
  Utensils,
  Percent,
  Banknote,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

interface Settlement {
  settlementId: string;
  date: string;
  kitchenStaffId: string;
  kitchenStaffName: string;
  commissionRate: number;
  customerSalesValue: number;
  staffSalesValue: number;
  totalEligibleSales: number;
  grossCommission: number;
  advanceDeduction: number;
  staffPurchaseDeduction: number;
  netPayment: number;
  status: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  approvedBy?: string;
  paidAt?: string;
  notes?: string;
  paymentMethod?: string;
}

interface Employee {
  employeeId: string;
  fullName: string;
  employeeType: string;
  commissionRate: number;
  status: string;
}

interface PreparedItem {
  foodItemId: string;
  name: string;
  unit: string;
  sellingPrice: number;
  staffPrice: number;
  preparedQuantity: number;
  soldQuantity: number;
  customerSoldQty?: number;
  customerTotalSales?: number;
  staffSoldQty?: number;
  staffTotalSales?: number;
  remainingQuantity: number;
  totalSales: number;
}

interface SettlementPreview {
  kitchenStaffId: string;
  kitchenStaffName: string;
  date: string;
  defaultCommissionRate: number;
  preparedItems: PreparedItem[];
  totalEligibleSales: number;
  customerSalesValue: number;
  staffSalesValue: number;
  activeAdvances: any[];
  totalRemainingAdvance: number;
  staffPurchases: any[];
  totalStaffPurchases: number;
  existingSettlement: Settlement | null;
}

export function SettlementManager() {
  const { t, tr } = useLanguage();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [kitchenStaffList, setKitchenStaffList] = useState<Employee[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Editable fields requested by user
  const [commissionRateInput, setCommissionRateInput] = useState<string>('10');
  const [advanceDeductionInput, setAdvanceDeductionInput] = useState<string>('0');

  // Payment Confirmation Modal State
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Whenever staff or date changes, fetch preview breakdown
  useEffect(() => {
    if (selectedStaffId && selectedDate) {
      fetchPreviewAndSettlements();
    }
  }, [selectedStaffId, selectedDate]);

  const fetchInitialData = async () => {
    try {
      const [empsRes, banksRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/bank-accounts'),
      ]);
      const empsData = await empsRes.json();
      const banksData = await banksRes.json();

      if (empsData.success) {
        const kitchenEmps = empsData.employees.filter((e: Employee) => e.employeeType === 'KITCHEN');
        setKitchenStaffList(kitchenEmps);
        if (kitchenEmps.length > 0 && !selectedStaffId) {
          setSelectedStaffId(kitchenEmps[0].employeeId);
        }
      }

      if (banksData.success) {
        setBankAccounts(banksData.accounts || []);
        if (banksData.accounts && banksData.accounts.length > 0) {
          setSelectedBankAccountId(banksData.accounts[0].accountId);
        }
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  const fetchPreviewAndSettlements = async () => {
    setLoadingPreview(true);
    setMessage(null);
    try {
      const [settlesRes, previewRes] = await Promise.all([
        fetch(`/api/settlements?date=${selectedDate}`),
        fetch(`/api/settlements?date=${selectedDate}&kitchenStaffId=${selectedStaffId}&preview=true`),
      ]);

      const settlesData = await settlesRes.json();
      const prevData = await previewRes.json();

      if (settlesData.success) {
        setSettlements(settlesData.settlements || []);
      }

      if (prevData.success && prevData.preview) {
        const p: SettlementPreview = prevData.preview;
        setPreview(p);

        // Pre-fill Commission Rate
        if (p.existingSettlement) {
          setCommissionRateInput(String(p.existingSettlement.commissionRate));
          setAdvanceDeductionInput(String(p.existingSettlement.advanceDeduction));
        } else {
          setCommissionRateInput(String(p.defaultCommissionRate ?? 10));

          // Default advance deduction: full remaining advance capped at initial estimate gross commission
          const estSales = p.totalEligibleSales || 0;
          const estGross = Math.round((estSales * (p.defaultCommissionRate || 10)) / 100);
          const defaultAdvDed = p.totalRemainingAdvance > 0 ? Math.min(p.totalRemainingAdvance, estGross) : 0;
          setAdvanceDeductionInput(String(defaultAdvDed));
        }
      }
    } catch (e) {
      console.error('Error fetching preview:', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Live Math calculations based on user input
  const totalEligibleSales = preview?.totalEligibleSales || 0;
  const parsedCommissionRate = Number(commissionRateInput) || 0;
  const calculatedGross = Math.round((totalEligibleSales * parsedCommissionRate) / 100);
  const totalRemainingAdvance = preview?.totalRemainingAdvance || 0;
  const parsedAdvanceDeduction = Number(advanceDeductionInput) || 0;
  const staffPurchaseDeduction = preview?.totalStaffPurchases || 0;
  const calculatedNetPayment = Math.max(0, calculatedGross - parsedAdvanceDeduction - staffPurchaseDeduction);

  // Quick Advance Buttons
  const handleSetAdvanceDeduction = (mode: 'FULL' | 'HALF' | 'NONE') => {
    if (!preview) return;
    if (mode === 'NONE') {
      setAdvanceDeductionInput('0');
    } else if (mode === 'FULL') {
      const full = Math.min(totalRemainingAdvance, calculatedGross);
      setAdvanceDeductionInput(String(full));
    } else if (mode === 'HALF') {
      const half = Math.min(Math.round(totalRemainingAdvance / 2), calculatedGross);
      setAdvanceDeductionInput(String(half));
    }
  };

  // 1. Calculate & Save Settlement
  const handleCalculateAndSave = async () => {
    if (!selectedStaffId) {
      setMessage({ type: 'error', text: 'Please select a kitchen staff member.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitchenStaffId: selectedStaffId,
          date: selectedDate,
          commissionRate: parsedCommissionRate,
          customAdvanceDeduction: parsedAdvanceDeduction,
          actorUser: 'Janani Nethma (Admin)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to calculate settlement' });
      } else {
        setMessage({
          type: 'success',
          text: `Daily settlement for ${preview?.kitchenStaffName || 'Staff'} calculated successfully! Net Payable: Rs. ${data.settlement.netPayment}`,
        });
        fetchPreviewAndSettlements();
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Confirm Final Payment
  const handleConfirmPayment = async () => {
    const settlementId = preview?.existingSettlement?.settlementId;
    if (!settlementId) {
      setMessage({ type: 'error', text: 'Please calculate and save the settlement first.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementId,
          status: 'PAID',
          paymentMethod: payMethod,
          bankAccountId: payMethod === 'BANK' ? selectedBankAccountId : undefined,
          actorUser: 'Janani Nethma (Admin)',
          actorRole: 'ADMIN',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Settlement confirmed & paid! Advance balance and payout recorded successfully via ${payMethod}.`,
        });
        setShowPayModal(false);
        fetchPreviewAndSettlements();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedStaffObj = kitchenStaffList.find((k) => k.employeeId === selectedStaffId);
  const activeSettlement = preview?.existingSettlement;

  return (
    <div className="space-y-6">
      {/* Header & Controls: Date & Kitchen Staff Selection */}
      <div className="bg-white border border-stone-200 shadow-xs p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-stone-900">{t.settlement.title}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            {tr("Select a date and kitchen staff member to review prepared items, sales quantities, commission %, and advances.")}
          </p>
        </div>

        {/* Date & Staff Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-300 shadow-2xs">
            <User className="w-4 h-4 text-amber-600" />
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-900 focus:outline-hidden cursor-pointer"
            >
              {kitchenStaffList.map((st) => (
                <option key={st.employeeId} value={st.employeeId}>
                  {st.fullName} ({st.employeeId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPreviewAndSettlements}
            disabled={loadingPreview}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
            title="Refresh Data"
          >
            {tr("Refresh")}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: PREPARED ITEMS & SOLD QUANTITIES TABLE */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">
                {tr("Prepared Food Items & Sold Quantities")} ({preview?.kitchenStaffName || selectedStaffObj?.fullName})
              </h3>
              <p className="text-[11px] text-stone-500">
                {tr("Items assigned or prepared on")} {selectedDate} {tr("with automatic POS sales quantities")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-stone-500">
              {preview?.preparedItems.length || 0} {tr("item(s) on record")}
            </span>
            {preview && (
              <div className="hidden sm:flex items-center space-x-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  Cust: Rs. {(preview.customerSalesValue || 0).toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                  Staff: Rs. {(preview.staffSalesValue || 0).toLocaleString()}
                </span>
              </div>
            )}
            {activeSettlement && <Badge status={activeSettlement.status} />}
          </div>
        </div>

        {/* Food Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600 font-bold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{tr("Food Item")}</th>
                <th className="py-2.5 px-3 text-center">{tr("Unit")}</th>
                <th className="py-2.5 px-3 text-center">{tr("Prepared")}</th>
                <th className="py-2.5 px-3 text-center">
                  <div>{tr("Customer Sold")}</div>
                  <div className="text-[10px] text-stone-400 font-normal">Qty @ Selling Price</div>
                </th>
                <th className="py-2.5 px-3 text-center">
                  <div>{tr("Staff Sold")}</div>
                  <div className="text-[10px] text-stone-400 font-normal">Qty @ Staff Price</div>
                </th>
                <th className="py-2.5 px-3 text-center">{tr("Total Sold")}</th>
                <th className="py-2.5 px-3 text-center">{tr("Remaining")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {preview && preview.preparedItems.length > 0 ? (
                preview.preparedItems.map((item, idx) => (
                  <tr key={item.foodItemId} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-stone-900">{tr(item.name)}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{item.foodItemId}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-stone-600">{tr(item.unit)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 font-bold text-[11px]">
                        {item.preparedQuantity}
                      </span>
                    </td>
                    {/* Customer Sold */}
                    <td className="py-3 px-3 text-center">
                      {(item.customerSoldQty || 0) > 0 ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-black text-[11px]">
                            {item.customerSoldQty}
                          </span>
                          <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                            @ Rs. {item.sellingPrice} <span className="text-stone-400">(= Rs. {(item.customerTotalSales || 0).toLocaleString()})</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-stone-300 font-bold text-[11px]">0</span>
                          <div className="text-[10px] text-stone-400">@ Rs. {item.sellingPrice}</div>
                        </div>
                      )}
                    </td>
                    {/* Staff Sold */}
                    <td className="py-3 px-3 text-center">
                      {(item.staffSoldQty || 0) > 0 ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-black text-[11px]">
                            {item.staffSoldQty}
                          </span>
                          <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                            @ Rs. {item.staffPrice} <span className="text-amber-600/80">(= Rs. {(item.staffTotalSales || 0).toLocaleString()})</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-stone-300 font-bold text-[11px]">0</span>
                          <div className="text-[10px] text-stone-400">@ Rs. {item.staffPrice}</div>
                        </div>
                      )}
                    </td>
                    {/* Total Sold (POS) */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px]">
                        {item.soldQuantity}
                      </span>
                    </td>
                    {/* Remaining */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          item.remainingQuantity === 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {item.remainingQuantity}
                      </span>
                    </td>
                    {/* Total Sales */}
                    <td className="py-3 px-3 text-right font-black text-stone-900 text-sm">
                      Rs. {item.totalSales.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-stone-400">
                    {tr("No food assignments or preparation records found for this date.")}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer: Total Eligible Sales with Category Breakdown */}
            <tfoot>
              <tr className="border-t-2 border-stone-300 bg-amber-50/50 font-black text-stone-900">
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-xs text-amber-950">
                  {tr("Total Eligible Sales Value")}:
                </td>
                <td className="py-3 px-3 text-center text-xs font-black text-blue-900">
                  <span className="text-[10px] text-blue-700 block uppercase font-bold">{tr("Customer Sales Total")}</span>
                  Rs. {(preview?.customerSalesValue || 0).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center text-xs font-black text-amber-900">
                  <span className="text-[10px] text-amber-700 block uppercase font-bold">{tr("Staff Sales Total")}</span>
                  Rs. {(preview?.staffSalesValue || 0).toLocaleString()}
                </td>
                <td colSpan={2}></td>
                <td className="py-3 px-3 text-right text-base text-amber-950 font-black">
                  Rs. {totalEligibleSales.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 2 & 3: INTERACTIVE COMMISSION & ADVANCES CALCULATION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Step A: Commission Percentage Input */}
        <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-stone-900 font-extrabold text-sm pb-2 border-b border-stone-100">
              <Percent className="w-4 h-4 text-amber-600" />
              <span>{tr("Step 1: Set Commission Rate (%)")}</span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Default commission for {selectedStaffObj?.fullName} is {preview?.defaultCommissionRate ?? 10}%. You can change this manually.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-300 font-black text-lg text-stone-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
                />
                <span className="absolute right-3 top-3 font-bold text-stone-400 text-sm">%</span>
              </div>

              {/* Quick % chips */}
              <div className="flex gap-1.5">
                {[8, 10, 12, 15].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setCommissionRateInput(String(rate))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      Number(commissionRateInput) === rate
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950">{tr("Today's Gross Commission")}:</span>
            <span className="text-lg font-black text-amber-900">
              Rs. {calculatedGross.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Step B: Advances Check & Deduction Input */}
        <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-stone-900 font-extrabold text-sm pb-2 border-b border-stone-100">
              <Wallet className="w-4 h-4 text-orange-600" />
              <span>{tr("Step 2: Check & Deduct Employee Advances")}</span>
            </div>

            {totalRemainingAdvance > 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between items-center text-amber-900 font-bold">
                  <span>Outstanding Advance Found:</span>
                  <span className="text-sm font-black text-rose-600">
                    Rs. {totalRemainingAdvance.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  You can deduct fully, partially, or specify a custom repayment amount for this daily settlement.
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No active advances pending for this employee.</span>
              </div>
            )}

            {/* Advance Deduction Controls */}
            {totalRemainingAdvance > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      max={totalRemainingAdvance}
                      value={advanceDeductionInput}
                      onChange={(e) => setAdvanceDeductionInput(e.target.value)}
                      placeholder="Enter deduction"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-black text-stone-900 text-sm focus:outline-hidden focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  {/* Preset Buttons: Full / Half / None */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetAdvanceDeduction('FULL')}
                      className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                    >
                      Deduct Full
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvanceDeduction('HALF')}
                      className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvanceDeduction('NONE')}
                      className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-950">Advance Deducted Today:</span>
            <span className="text-lg font-black text-rose-700">
              -Rs. {parsedAdvanceDeduction.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: NET PAYMENT BANNER & CONFIRMATION ACTIONS */}
      <div className="p-6 rounded-3xl bg-stone-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Final Net Settlement Calculation
            </span>
            {activeSettlement && <Badge status={activeSettlement.status} />}
          </div>
          <div className="text-3xl font-black text-white">
            Rs. {calculatedNetPayment.toLocaleString()}
          </div>
          <div className="text-xs text-stone-300 flex flex-wrap gap-2 pt-1 font-medium">
            <span>Gross Commission: Rs. {calculatedGross.toLocaleString()}</span>
            <span>•</span>
            <span className="text-rose-300">Advance Ded: -Rs. {parsedAdvanceDeduction.toLocaleString()}</span>
            {staffPurchaseDeduction > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-300">Staff Purchases: -Rs. {staffPurchaseDeduction.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons: Calculate / Save & Confirm Payment */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCalculateAndSave}
            disabled={isProcessing}
            className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center space-x-2 border border-stone-700 shadow-md cursor-pointer transition-all"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>{isProcessing ? 'Processing...' : 'Calculate & Save'}</span>
          </button>

          {activeSettlement?.status !== 'PAID' ? (
            <button
              onClick={() => setShowPayModal(true)}
              disabled={isProcessing}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-stone-950" />
              <span>Confirm & Pay Now (ගෙවීම් තහවුරු කරන්න)</span>
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Paid on {activeSettlement.paidAt ? new Date(activeSettlement.paidAt).toLocaleDateString() : 'Today'}</span>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 text-stone-900 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2 text-amber-700">
                <Coins className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-stone-900">Confirm Settlement Payment</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Staff Member:</span>
                <span className="font-bold text-stone-900">{preview?.kitchenStaffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Settlement Date:</span>
                <span className="font-mono font-bold text-stone-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Eligible Sales:</span>
                <span className="font-bold text-stone-900">Rs. {totalEligibleSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Commission Rate:</span>
                <span className="font-bold text-amber-800">{parsedCommissionRate}%</span>
              </div>
              {parsedAdvanceDeduction > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Advance Deducted:</span>
                  <span className="font-bold">-Rs. {parsedAdvanceDeduction.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
                <span>Net Payment Amount:</span>
                <span className="text-amber-800">Rs. {calculatedNetPayment.toLocaleString()}</span>
              </div>
            </div>

            {/* Payout Method Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-700 block">Select Payout Source (ගෙවීම් ක්‍රමය):</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod('CASH')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    payMethod === 'CASH'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">Cash Drawer</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Disbursed from cashier counter</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('BANK')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    payMethod === 'BANK'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Bank Transfer</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Direct corporate bank account</p>
                </button>
              </div>

              {payMethod === 'BANK' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600">Company Bank Account:</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-amber-600"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.accountId} value={b.accountId}>
                        {b.bankName} - {b.accountNumber} (Bal: Rs.{Number(b.balance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 cursor-pointer transition-all"
              >
                {isProcessing ? 'Processing Payment...' : 'Confirm & Complete Payment'}
              </button>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: HISTORICAL SETTLEMENTS TABLE */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="font-extrabold text-stone-900 text-sm">Settlement Records History</h3>
          <span className="text-xs text-stone-500">{settlements.length} settlement(s) recorded</span>
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
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {settlements.map((s) => (
                <tr key={s.settlementId} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-stone-800">{s.date}</td>
                  <td className="py-3 px-3 font-extrabold text-stone-900">{s.kitchenStaffName}</td>
                  <td className="py-3 px-3 text-right font-semibold">Rs. {s.totalEligibleSales.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center font-bold text-amber-800">{s.commissionRate}%</td>
                  <td className="py-3 px-3 text-right font-black text-amber-900">Rs. {s.grossCommission.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-rose-600 font-bold">
                    {s.advanceDeduction > 0 ? `-Rs. ${s.advanceDeduction.toLocaleString()}` : 'Rs. 0'}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-stone-900 text-sm">
                    Rs. {s.netPayment.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge status={s.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.status !== 'PAID' ? (
                      <button
                        onClick={() => {
                          setSelectedDate(s.date);
                          setSelectedStaffId(s.kitchenStaffId);
                          setShowPayModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        Pay
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold">Paid</span>
                    )}
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
