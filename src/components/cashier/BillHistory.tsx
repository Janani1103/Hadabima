'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/lib/types/settings';
import { Badge } from '@/components/common/Badge';
import {
  Receipt,
  Search,
  Eye,
  Ban,
  X,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
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
  saleType: 'CUSTOMER' | 'STAFF';
  employeeName?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  bankAccountName?: string;
  status: 'COMPLETED' | 'VOIDED';
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  createdAt: string;
}

interface BillHistoryProps {
  currentCashier: {
    fullName: string;
    employeeType: string;
  };
}

export function BillHistory({ currentCashier }: BillHistoryProps) {
  const { t, tr } = useLanguage();

  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleType, setSelectedSaleType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // View Receipt Modal
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

  // Void Modal
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const [billsRes, settingsRes] = await Promise.all([
        fetch('/api/bills'),
        fetch('/api/settings').catch(() => null),
      ]);
      const data = await billsRes.json();
      if (data.success) {
        setBills(data.bills);
      }
      if (settingsRes && settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.success && sData.settings) {
          setSystemSettings(sData.settings);
        }
      } else {
        const local = localStorage.getItem('hadabima_system_settings');
        if (local) {
          try {
            setSystemSettings(JSON.parse(local));
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      const local = localStorage.getItem('hadabima_system_settings');
      if (local) {
        try {
          setSystemSettings(JSON.parse(local));
        } catch {}
      }
    }
  };

  const handleVoidBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingBill || !voidReason) return;

    try {
      const res = await fetch('/api/bills/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: voidingBill.billId,
          reason: voidReason,
          voidedBy: currentCashier.fullName,
          userRole: currentCashier.employeeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({
          type: 'success',
          text: `Bill ${voidingBill.billNumber} voided successfully! ${data.financialAdjustment ? `(${data.financialAdjustment})` : ''} ${
            data.restoredItems && data.restoredItems.length > 0
              ? `• Items restored to inventory: ${data.restoredItems.join(', ')}`
              : ''
          }`,
        });
        setVoidingBill(null);
        setVoidReason('');
        fetchBills();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.employeeName && b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSaleType = selectedSaleType === 'ALL' || b.saleType === selectedSaleType;
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;

    return matchesSearch && matchesSaleType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.nav.billHistory}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Rule 12: Bills are never hard deleted. Voiding preserves audit history and reasons.
          </p>
        </div>

        <div className="text-xs text-stone-500">
          Total Bills: <span className="font-bold text-stone-900">{bills.length}</span>
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

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={tr("Search bill number, employee...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">{tr("Sale Type")}:</span>
          {['ALL', 'CUSTOMER', 'STAFF'].map((saleTypeKey) => (
            <button
              key={saleTypeKey}
              onClick={() => setSelectedSaleType(saleTypeKey)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedSaleType === saleTypeKey
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {tr(saleTypeKey)}
            </button>
          ))}

          <span className="text-stone-500 font-medium ml-2">{tr("Status")}:</span>
          {['ALL', 'COMPLETED', 'VOIDED'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setSelectedStatus(statusKey)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === statusKey
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {tr(statusKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-2.5 px-3">{tr("Bill #")}</th>
                <th className="py-2.5 px-3">{tr("Date / Time")}</th>
                <th className="py-2.5 px-3">{tr("Sale Type")}</th>
                <th className="py-2.5 px-3">{tr("Cashier")}</th>
                <th className="py-2.5 px-3">{tr("Payment")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Total")} (Rs.)</th>
                <th className="py-2.5 px-3 text-center">{tr("Status")}</th>
                <th className="py-2.5 px-3 text-right">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredBills.map((b) => (
                <tr key={b.billId} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                    {b.billNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-stone-500">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge status={b.saleType} />
                    {b.employeeName && (
                      <span className="block text-[10px] text-amber-800 mt-0.5 font-medium">
                        {b.employeeName}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700">{b.cashierName}</td>
                  <td className="py-2.5 px-3 font-semibold text-stone-600">{b.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-black text-stone-900">
                    Rs. {b.total}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge status={b.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => setViewingBill(b)}
                      title="View Receipt"
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {b.status === 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setVoidingBill(b);
                          setVoidReason('');
                        }}
                        title="Void Bill"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW RECEIPT MODAL */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 text-stone-900 shadow-2xl relative">
            <button
              onClick={() => setViewingBill(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              id="printable-receipt"
              style={{
                maxWidth: systemSettings?.billSettings?.paperWidth === '58mm' ? '260px' : '340px',
                margin: '0 auto',
              }}
              className="text-black bg-white p-4 sm:p-5 rounded-lg font-mono text-xs shadow-inner mb-4 border border-stone-200"
            >
              <div className="text-center pb-2.5 border-b border-black flex flex-col items-center">
                {systemSettings?.billSettings?.showLogo !== false && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={systemSettings?.logoUrl || HADABIMA_LOGO_URL}
                    alt="Hadabima Authority Logo"
                    className="w-12 h-12 object-contain mx-auto mb-1.5"
                  />
                )}
                <div className="font-bold text-sm tracking-wider uppercase">
                  {systemSettings?.billSettings?.receiptTitle || systemSettings?.shopName || 'HADABIMA SRI LANKA'}
                </div>
                {(systemSettings?.billSettings?.receiptSubtitle || systemSettings?.tagline) && (
                  <div className="text-[10px] font-semibold text-gray-800">
                    {systemSettings?.billSettings?.receiptSubtitle || systemSettings?.tagline}
                  </div>
                )}
                {(systemSettings?.billSettings?.receiptAddress || systemSettings?.address) && (
                  <div className="text-[9px] text-gray-700 leading-tight mt-0.5">
                    {systemSettings?.billSettings?.receiptAddress || systemSettings?.address}
                  </div>
                )}
                {(systemSettings?.billSettings?.receiptPhone || systemSettings?.contact) && (
                  <div className="text-[9px] text-gray-700">
                    {systemSettings?.billSettings?.receiptPhone || systemSettings?.contact}
                  </div>
                )}
                {systemSettings?.billSettings?.businessRegNumber && (
                  <div className="text-[9px] font-bold text-gray-900 mt-0.5">
                    {systemSettings?.billSettings?.businessRegNumber}
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>{tr("Bill No")}:</span>
                  <span className="font-bold">{viewingBill.billNumber}</span>
                </div>
                {systemSettings?.billSettings?.showDateTime !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Date")}:</span>
                    <span>{new Date(viewingBill.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {systemSettings?.billSettings?.showCashierName !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Cashier")}:</span>
                    <span>{viewingBill.cashierName}</span>
                  </div>
                )}
                {systemSettings?.billSettings?.showSaleType !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Sale Type")}:</span>
                    <span className="font-bold">
                      {viewingBill.saleType === 'STAFF'
                        ? `${tr("STAFF SALE")} (${viewingBill.employeeName})`
                        : tr("CUSTOMER SALE")}
                    </span>
                  </div>
                )}
                {viewingBill.status === 'VOIDED' && (
                  <div className="text-rose-600 font-bold text-center pt-1">
                    *** {tr("VOIDED BILL")} ***
                    <div className="text-[10px] font-normal">{viewingBill.voidReason}</div>
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-black">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-black">
                      <th>{tr("Item")}</th>
                      <th className="text-center">{tr("Qty")}</th>
                      {systemSettings?.billSettings?.showItemPriceBreakdown !== false && (
                        <th className="text-right">{tr("Price")}</th>
                      )}
                      <th className="text-right">{tr("Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingBill.items?.map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-0.5">{tr(it.foodItemName)}</td>
                        <td className="text-center">{it.quantity}</td>
                        {systemSettings?.billSettings?.showItemPriceBreakdown !== false && (
                          <td className="text-right">
                            {systemSettings?.currency || 'Rs.'}{it.unitPrice}
                          </td>
                        )}
                        <td className="text-right font-semibold">
                          {systemSettings?.currency || 'Rs.'}{it.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right space-y-1 text-[11px]">
                <div>{tr("Subtotal")}: {systemSettings?.currency || 'Rs.'} {viewingBill.subtotal}</div>
                {viewingBill.discount > 0 && (
                  <div>{tr("Discount")}: -{systemSettings?.currency || 'Rs.'} {viewingBill.discount}</div>
                )}
                <div className="font-bold text-sm pt-1 border-t border-black">
                  {tr("TOTAL")}: {systemSettings?.currency || 'Rs.'} {viewingBill.total}
                </div>
                <div className="text-[10px] text-gray-600">{tr("Paid Via")}: {tr(viewingBill.paymentMethod)}</div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-black text-[10px] space-y-0.5">
                {systemSettings?.billSettings?.footerThankYouNote && (
                  <div className="font-bold">
                    {systemSettings.billSettings.footerThankYouNote}
                  </div>
                )}
                {systemSettings?.billSettings?.footerNotice && (
                  <div className="text-gray-700">
                    {systemSettings.billSettings.footerNotice}
                  </div>
                )}
                {systemSettings?.billSettings?.wifiDetails && (
                  <div className="text-gray-600 font-medium">
                    {systemSettings.billSettings.wifiDetails}
                  </div>
                )}
                {systemSettings?.billSettings?.showBarcode && (
                  <div className="pt-2 flex flex-col items-center">
                    <div className="w-28 h-5 bg-stone-900 flex items-center justify-around px-2 text-[7px] text-white font-mono tracking-widest overflow-hidden">
                      ||| | |||| | || |||||
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5 font-mono">
                      *{viewingBill.billNumber}*
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs flex items-center justify-center space-x-2 text-white shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{tr("Print")}</span>
              </button>
              <button
                onClick={() => setViewingBill(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs cursor-pointer"
              >
                {tr("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID BILL MODAL */}
      {voidingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-sm w-full p-6 text-stone-900 shadow-2xl relative">
            <button
              onClick={() => setVoidingBill(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-stone-900">{tr("Void Bill")}: {voidingBill.billNumber}</h3>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-4 space-y-2 text-[11px]">
              <div className="flex justify-between text-stone-700">
                <span>{tr("Bill Total")}:</span>
                <span className="font-bold text-stone-900">Rs. {voidingBill.total}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>{tr("Payment Method")}:</span>
                <span className="font-bold text-stone-900">{tr(voidingBill.paymentMethod)}</span>
              </div>
              <div className="pt-1 border-t border-stone-200/80 text-rose-800 space-y-1">
                <div>
                  <span className="font-bold">{tr("Financial Impact")}: </span>
                  {voidingBill.paymentMethod === 'CASH'
                    ? `${tr("Cash sales & expected drawer total will decrease by")} Rs. ${voidingBill.total}`
                    : `${tr("Bank account")} (${voidingBill.bankAccountName || tr("Selected Bank")}) ${tr("will be reduced by")} Rs. ${voidingBill.total}`}
                </div>
                <div>
                  <span className="font-bold">{tr("Inventory Impact")}: </span>
                  {tr("Restores items back to kitchen stock.")}
                </div>
              </div>
            </div>

            <form onSubmit={handleVoidBill} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Reason for Voiding *")}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={tr("Reason for voiding bill...")}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md shadow-rose-600/25 cursor-pointer"
                >
                  {tr("Confirm Void & Audit")}
                </button>
                <button
                  type="button"
                  onClick={() => setVoidingBill(null)}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs cursor-pointer"
                >
                  {tr("Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
