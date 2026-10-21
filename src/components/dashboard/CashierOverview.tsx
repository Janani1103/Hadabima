'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import {
  ShoppingCart,
  Receipt,
  Utensils,
  Lock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  CalendarDays,
  ReceiptText,
  Flame,
  Award,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface BillItem {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kitchenStaffId?: string;
}

interface Bill {
  billId: string;
  billNumber: string;
  cashierId: string;
  cashierName: string;
  saleType: string;
  paymentMethod: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
}

interface CashierOverviewProps {
  currentCashier: {
    fullName: string;
    employeeId: string;
  };
  onNavigateTab: (tab: string) => void;
}

export function CashierOverview({ currentCashier, onNavigateTab }: CashierOverviewProps) {
  const { t, tr } = useLanguage();
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    fetchCashierData();
  }, [todayStr]);

  const fetchCashierData = async () => {
    setIsLoading(true);
    try {
      const [finRes, billsRes] = await Promise.all([
        fetch(`/api/finance/summary?date=${todayStr}`),
        fetch(`/api/bills`),
      ]);
      const finData = await finRes.json();
      const billsData = await billsRes.json();

      if (finData.success) {
        setFinance(finData.summary);
      }
      if (billsData.success && Array.isArray(billsData.bills)) {
        setAllBills(billsData.bills);
      }
    } catch (e) {
      console.error('Failed to load cashier overview data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bills for today
  const todayBills = useMemo(() => {
    return allBills.filter((b) => {
      const bDate = new Date(b.createdAt).toISOString().split('T')[0];
      return bDate === todayStr && b.status !== 'VOIDED';
    });
  }, [allBills, todayStr]);

  // If today has bills use today's, else fall back to active bills to compute realistic metrics
  const activeDisplayBills = todayBills.length > 0 ? todayBills : allBills.filter((b) => b.status !== 'VOIDED');
  const isShowingAllTimeFallback = todayBills.length === 0 && allBills.length > 0;

  // 1. TODAY'S BILLS COUNT
  const todayBillsCount = todayBills.length;
  const customerBillsCount = todayBills.filter((b) => b.saleType === 'CUSTOMER').length;
  const staffBillsCount = todayBills.filter((b) => b.saleType === 'STAFF').length;

  // 2. TODAY'S TOTAL SALES
  const todaySales = todayBills.reduce((sum, b) => sum + Number(b.total || 0), 0);

  // 3. CASH SALES
  const cashSales = todayBills
    .filter((b) => b.paymentMethod === 'CASH')
    .reduce((sum, b) => sum + Number(b.total || 0), 0);

  // 4. CARD / ONLINE SALES
  const cardSales = todayBills
    .filter((b) => b.paymentMethod === 'CARD')
    .reduce((sum, b) => sum + Number(b.total || 0), 0);

  const onlineSales = todayBills
    .filter((b) => b.paymentMethod === 'ONLINE')
    .reduce((sum, b) => sum + Number(b.total || 0), 0);

  const cardOnlineTotal = cardSales + onlineSales;

  // TOP SELLING FOODS
  const topSellingFoods = useMemo(() => {
    const itemMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};

    activeDisplayBills.forEach((b) => {
      (b.items || []).forEach((item) => {
        if (!itemMap[item.foodItemId]) {
          itemMap[item.foodItemId] = {
            id: item.foodItemId,
            name: item.foodItemName,
            quantity: 0,
            revenue: 0,
          };
        }
        itemMap[item.foodItemId].quantity += Number(item.quantity || 0);
        itemMap[item.foodItemId].revenue += Number(item.total || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [activeDisplayBills]);

  const maxItemQuantity = topSellingFoods.length > 0 ? topSellingFoods[0].quantity : 1;

  // RECENT BILLS (Latest 6 bills)
  const recentBills = useMemo(() => {
    return [...allBills]
      .filter((b) => b.status !== 'VOIDED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [allBills]);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-6 sm:p-7 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-amber-100">
              {tr("Cashier Overview Station")}
            </span>
            <span className="text-[11px] font-mono text-amber-200">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
            {tr("Welcome back,")} {currentCashier.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl font-medium">
            {tr("Monitor today's transactions, manage customer/staff sales, track top-selling items, and reconcile drawer receipts.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('pos')}
            className="px-5 py-3 rounded-xl bg-white hover:bg-amber-50 text-amber-800 font-extrabold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-amber-700" />
            <span>{tr("Launch POS Terminal")}</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Bills */}
        <StatCard
          title="Today's Bills"
          value={`${todayBillsCount} ${tr("Bills")}`}
          subtitle={`${customerBillsCount} ${tr("Customer")} • ${staffBillsCount} ${tr("Staff")}`}
          icon={<Receipt className="w-5 h-5" />}
          accentColor="amber"
        />

        {/* Card 2: Today's Sales */}
        <StatCard
          title="Today's Sales"
          value={`Rs. ${todaySales.toLocaleString()}`}
          subtitle={todayBillsCount > 0 ? "Total Gross Daily Sales" : "No sales recorded yet today"}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="emerald"
        />

        {/* Card 3: Cash Sales */}
        <StatCard
          title="Cash Sales"
          value={`Rs. ${cashSales.toLocaleString()}`}
          subtitle="Physical cash in drawer"
          icon={<Banknote className="w-5 h-5" />}
          accentColor="emerald"
        />

        {/* Card 4: Card/Online Sales */}
        <StatCard
          title="Card / Online Sales"
          value={`Rs. ${cardOnlineTotal.toLocaleString()}`}
          subtitle={`Card: Rs. ${cardSales.toLocaleString()} • QR: Rs. ${onlineSales.toLocaleString()}`}
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Main Content Grid: Top Selling Foods & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (2 cols): Top Selling Foods */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <h3 className="font-extrabold text-stone-900 text-sm">{tr("Top Selling Foods")}</h3>
            </div>
            {isShowingAllTimeFallback && (
              <span className="text-[10px] text-stone-400 font-medium">{tr("Recent Overall")}</span>
            )}
          </div>

          {topSellingFoods.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              {tr("No food sales recorded yet.")}
            </div>
          ) : (
            <div className="space-y-3.5">
              {topSellingFoods.map((item, index) => {
                const percent = Math.round((item.quantity / maxItemQuantity) * 100);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            index === 0
                              ? 'bg-amber-100 text-amber-800'
                              : index === 1
                              ? 'bg-stone-200 text-stone-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-bold text-stone-800 truncate max-w-[140px] sm:max-w-[180px]">
                          {tr(item.name)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-stone-900">{item.quantity} {tr("sold")}</span>
                        <span className="text-[11px] text-stone-500 ml-1.5 font-medium">
                          (Rs. {item.revenue.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0
                            ? 'bg-amber-600'
                            : index === 1
                            ? 'bg-orange-500'
                            : index === 2
                            ? 'bg-amber-500'
                            : 'bg-stone-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-stone-100">
            <button
              onClick={() => onNavigateTab('foodItems')}
              className="w-full py-2 rounded-xl text-center text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>{tr("View All Food Items & Pricing")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (3 cols): Recent Bills Table */}
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-stone-900 text-sm">{tr("Recent Bills")}</h3>
            </div>

            <button
              onClick={() => onNavigateTab('bills')}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer flex items-center gap-1"
            >
              <span>{tr("View Full History")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">{tr("Bill #")}</th>
                  <th className="py-2.5 px-3">{tr("Type")}</th>
                  <th className="py-2.5 px-3">{tr("Items")}</th>
                  <th className="py-2.5 px-3">{tr("Payment")}</th>
                  <th className="py-2.5 px-3 text-right">{tr("Total")} (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 text-xs">
                      {tr("No bills found.")}
                    </td>
                  </tr>
                ) : (
                  recentBills.map((b) => {
                    const itemsSummary = (b.items || [])
                      .map((i) => `${tr(i.foodItemName)} x${i.quantity}`)
                      .join(', ');

                    return (
                      <tr key={b.billId} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-stone-900">{b.billNumber}</div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <Badge status={b.saleType} />
                        </td>

                        <td className="py-2.5 px-3 text-stone-800 max-w-xs truncate" title={itemsSummary}>
                          {itemsSummary || 'N/A'}
                        </td>

                        <td className="py-2.5 px-3">
                          {b.paymentMethod === 'CASH' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Banknote className="w-3 h-3 text-emerald-600" />
                              {tr("Cash")}
                            </span>
                          )}
                          {b.paymentMethod === 'CARD' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              {tr("Card")}
                            </span>
                          )}
                          {b.paymentMethod === 'ONLINE' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              <QrCode className="w-3 h-3 text-purple-600" />
                              {tr("Online")}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-black text-stone-900">
                          Rs. {Number(b.total).toLocaleString()}
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

      {/* Quick Action Station Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('pos')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-amber-700">{tr("POS Terminal")}</div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Issue customer or staff bill")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>

        <button
          onClick={() => onNavigateTab('assignments')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-orange-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-orange-700">{tr("Food Assignment")}</div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Assign food to kitchen staff")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>

        <button
          onClick={() => onNavigateTab('expenses')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 group-hover:scale-110 transition-transform">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-amber-700">{tr("Daily Expenses")}</div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Record drawer / card cost")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>

        <button
          onClick={() => onNavigateTab('closing')}
          className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 hover:shadow-md flex items-center justify-between text-left group transition-all shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 group-hover:text-stone-900">{tr("Daily Closing")}</div>
              <div className="text-[11px] text-stone-500 font-medium">{tr("Drawer cash reconciliation")}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
        </button>
      </div>
    </div>
  );
}
