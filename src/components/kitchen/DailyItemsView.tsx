'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  ChefHat,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Utensils,
  Calendar,
  ShoppingBag,
  PackageCheck,
  TrendingUp,
} from 'lucide-react';

interface FoodItem {
  foodItemId: string;
  name: string;
  shelfLifeDays: number;
}

interface Preparation {
  preparationId: string;
  date: string;
  foodItemId: string;
  foodItemName: string;
  kitchenStaffId: string;
  kitchenStaffName: string;
  preparedQuantity: number;
  soldQuantity: number;
  wastageQuantity: number;
  remainingQuantity: number;
  expiryDate: string;
  status: 'FRESH' | 'EXPIRING_TODAY' | 'EXPIRED';
}

interface Assignment {
  assignmentId: string;
  date: string;
  foodItemId: string;
  foodItemName: string;
  kitchenStaffId: string;
  kitchenStaffName: string;
  assignedQuantity: number;
}

interface DailyRowItem {
  foodItemId: string;
  foodItemName: string;
  preparedQuantity: number;
  soldQuantity: number;
  wastageQuantity: number;
  remainingQuantity: number;
  expiryDate: string;
  shelfLifeDays: number;
  status: 'FRESH' | 'EXPIRING_TODAY' | 'EXPIRED';
  preparationId?: string;
}

interface DailyItemsViewProps {
  currentStaff: {
    employeeId: string;
    fullName: string;
  };
}

export function DailyItemsView({ currentStaff }: DailyItemsViewProps) {
  const { t, tr } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Wastage Modal
  const [wastageItem, setWastageItem] = useState<DailyRowItem | null>(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteNotes, setWasteNotes] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchKitchenData(selectedDate);
  }, [selectedDate]);

  const fetchKitchenData = async (targetDate: string) => {
    setIsLoading(true);
    try {
      const [prepRes, asgRes, itemsRes, billsRes] = await Promise.all([
        fetch(`/api/preparations?date=${targetDate}&kitchenStaffId=${currentStaff.employeeId}`),
        fetch(`/api/assignments?date=${targetDate}`),
        fetch('/api/food-items'),
        fetch(`/api/bills?date=${targetDate}`),
      ]);

      const prepData = await prepRes.json();
      const asgData = await asgRes.json();
      const itemsData = await itemsRes.json();
      const billsData = await billsRes.json();

      if (prepData.success) setPreparations(prepData.preparations || []);
      if (asgData.success) {
        const myAssignments = (asgData.assignments || []).filter(
          (a: any) => a.kitchenStaffId === currentStaff.employeeId
        );
        setAssignments(myAssignments);
      }
      if (itemsData.success) setFoodItems(itemsData.foodItems || []);
      if (billsData.success) setBills(billsData.bills || []);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to load kitchen production data' });
    } finally {
      setIsLoading(false);
    }
  };

  // Compute live items linked to POS sales
  const validBills = bills.filter((b) => b.status !== 'VOIDED');

  const foodItemMap = new Map<string, FoodItem>();
  foodItems.forEach((f) => foodItemMap.set(f.foodItemId, f));

  // Collect unique food items for this chef on selectedDate
  const allItemIds = new Set<string>();
  assignments.forEach((a) => allItemIds.add(a.foodItemId));
  preparations.forEach((p) => allItemIds.add(p.foodItemId));

  const tableRows: DailyRowItem[] = Array.from(allItemIds).map((foodId) => {
    const asg = assignments.find((a) => a.foodItemId === foodId);
    const prep = preparations.find((p) => p.foodItemId === foodId);
    const meta = foodItemMap.get(foodId);

    const foodItemName = asg?.foodItemName || prep?.foodItemName || meta?.name || 'Unknown Item';
    const shelfLifeDays = meta?.shelfLifeDays || 1;

    // Prepared quantity comes from Cashier assignment or preparation batch
    const preparedQuantity = asg?.assignedQuantity ?? prep?.preparedQuantity ?? 0;

    // Calculate real-time sold quantity from POS checkout bills on this date
    let soldFromBills = 0;
    for (const bill of validBills) {
      if (bill.items && Array.isArray(bill.items)) {
        for (const item of bill.items) {
          if (item.foodItemId === foodId) {
            // Attribute to this chef if kitchenStaffId matches or if assigned to this chef
            if (!item.kitchenStaffId || item.kitchenStaffId === currentStaff.employeeId) {
              soldFromBills += Number(item.quantity) || 0;
            }
          }
        }
      }
    }

    const soldQuantity = soldFromBills;
    const wastageQuantity = prep?.wastageQuantity || 0;
    const remainingQuantity = Math.max(0, preparedQuantity - soldQuantity - wastageQuantity);

    // Compute expiry
    let expiryDate = prep?.expiryDate;
    if (!expiryDate) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + shelfLifeDays);
      expiryDate = d.toISOString().split('T')[0];
    }

    let status: 'FRESH' | 'EXPIRING_TODAY' | 'EXPIRED' = 'FRESH';
    if (expiryDate < todayStr) status = 'EXPIRED';
    else if (expiryDate === todayStr) status = 'EXPIRING_TODAY';

    return {
      foodItemId: foodId,
      foodItemName,
      preparedQuantity,
      soldQuantity,
      wastageQuantity,
      remainingQuantity,
      expiryDate,
      shelfLifeDays,
      status,
      preparationId: prep?.preparationId,
    };
  });

  // Calculate Summary metrics
  const totalPrepared = tableRows.reduce((sum, r) => sum + r.preparedQuantity, 0);
  const totalSold = tableRows.reduce((sum, r) => sum + r.soldQuantity, 0);
  const totalRemaining = tableRows.reduce((sum, r) => sum + r.remainingQuantity, 0);
  const totalWastage = tableRows.reduce((sum, r) => sum + r.wastageQuantity, 0);

  const handleLogWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wastageItem || !wasteQty) return;

    setIsSubmitting(true);
    try {
      let prepId = wastageItem.preparationId;

      // If preparation batch wasn't created yet, create it first
      if (!prepId) {
        const createRes = await fetch('/api/preparations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            foodItemId: wastageItem.foodItemId,
            kitchenStaffId: currentStaff.employeeId,
            preparedQuantity: wastageItem.preparedQuantity,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.preparation) {
          prepId = createData.preparation.preparationId;
        }
      }

      if (prepId) {
        const res = await fetch('/api/preparations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preparationId: prepId,
            wastageQuantity: Number(wasteQty),
            notes: wasteNotes,
            actorUser: currentStaff.fullName,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'Failed to record wastage' });
        } else {
          setMessage({ type: 'success', text: `Wastage recorded for ${wastageItem.foodItemName}!` });
          setWastageItem(null);
          setWasteQty('');
          setWasteNotes('');
          fetchKitchenData(selectedDate);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Selection */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.preparations.title}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {tr("Section 15, 16 & 17: Track Prepared, Sold (POS Connected), Remaining & Wastage.")}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-stone-600 font-semibold">{tr("Select Date:")}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-stone-900 font-bold focus:outline-hidden cursor-pointer"
          />
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
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prepared */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Prepared")}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{totalPrepared} <span className="text-xs font-semibold text-stone-500">{tr("Units")}</span></div>
          <div className="text-[11px] text-stone-500 mt-1">{tableRows.length} {tr("items assigned")}</div>
        </div>

        {/* Sold via POS */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-stone-500">{tr("Sold")}</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                {tr("POS Live")}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{totalSold} <span className="text-xs font-semibold text-stone-500">{tr("Units")}</span></div>
          <div className="text-[11px] text-emerald-600/80 mt-1">{tr("From Cashier checkout bills")}</div>
        </div>

        {/* Remaining */}
        <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Remaining")}</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-800 mt-2">{totalRemaining} <span className="text-xs font-semibold text-stone-500">{tr("Units")}</span></div>
          <div className="text-[11px] text-stone-500 mt-1">{tr("Available for counter sales")}</div>
        </div>

        {/* Wastage */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">{tr("Wastage")}</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{totalWastage} <span className="text-xs font-semibold text-stone-500">{tr("Units")}</span></div>
          <div className="text-[11px] text-stone-500 mt-1">{tr("Damaged or past freshness")}</div>
        </div>
      </div>

      {/* DAILY ITEMS PRODUCTION TABLE */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              {tr("Daily Items Summary for")} {selectedDate}
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {tr("Sales automatically synchronized with POS checkout transactions.")}
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
            {tableRows.length} {tr("Items Listed")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-3 px-4">{tr("Food Item")}</th>
                <th className="py-3 px-4 text-center">{tr("Prepared")}</th>
                <th className="py-3 px-4 text-center">{tr("Sold")}</th>
                <th className="py-3 px-4 text-center">{tr("Remaining")}</th>
                <th className="py-3 px-4 font-mono">{tr("Calculated Expiry")}</th>
                <th className="py-3 px-4 text-center">{tr("Status")}</th>
                <th className="py-3 px-4 text-right">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    {tr("Loading daily production summary...")}
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 space-y-1">
                    <p className="font-semibold text-stone-600">{tr("No food items assigned for")} {selectedDate}.</p>
                    <p className="text-[11px]">{tr("Cashier can assign items through the Daily Food Assignment portal.")}</p>
                  </td>
                </tr>
              ) : (
                tableRows.map((item) => (
                  <tr key={item.foodItemId} className="hover:bg-amber-50/40 transition-colors">
                    {/* Food Item */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{item.foodItemName}</div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        {tr("Shelf Life")}: {item.shelfLifeDays} {tr("day(s)")}
                      </div>
                    </td>

                    {/* Prepared */}
                    <td className="py-3 px-4 text-center font-bold text-stone-900 text-sm">
                      {item.preparedQuantity}
                    </td>

                    {/* Sold (Connected with POS) */}
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 text-sm">
                      <span className="inline-block bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {item.soldQuantity}
                      </span>
                    </td>

                    {/* Remaining */}
                    <td className="py-3 px-4 text-center font-black text-amber-800 text-sm">
                      {item.remainingQuantity}
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-4 font-mono text-stone-600 text-xs">
                      {item.expiryDate}
                    </td>

                    {/* Freshness Status */}
                    <td className="py-3 px-4 text-center">
                      <Badge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {item.remainingQuantity > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setWastageItem(item);
                            setWasteQty('');
                            setWasteNotes('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          {tr("Record Wastage")}
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">{tr("Sold Out")}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG WASTAGE MODAL */}
      {wastageItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-sm w-full p-6 text-stone-900 shadow-2xl relative">
            <button
              onClick={() => setWastageItem(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-stone-900 mb-1">
              {tr("Record Wastage")}: {wastageItem.foodItemName}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {tr("Remaining")}:{' '}
              <span className="font-bold text-stone-900">{wastageItem.remainingQuantity}</span> {tr("Units")}.
            </p>

            <form onSubmit={handleLogWastage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Waste Quantity (Units) *")}
                </label>
                <input
                  type="number"
                  min="1"
                  max={wastageItem.remainingQuantity}
                  required
                  placeholder="e.g. 2"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-rose-300 text-stone-900 font-bold focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">{tr("Reason / Damage Notes")}</label>
                <textarea
                  rows={2}
                  placeholder={tr("e.g. Broken or stale")}
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? tr("Loading...") : tr("Save Wastage Record")}
                </button>
                <button
                  type="button"
                  onClick={() => setWastageItem(null)}
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
