'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/lib/types/settings';
import { Badge } from '@/components/common/Badge';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  Percent,
  Building2,
  RotateCcw,
  Utensils,
} from 'lucide-react';

interface FoodItem {
  foodItemId: string;
  name: string;
  sellingPrice: number;
  staffPrice: number;
  unit: string;
  shelfLifeDays: number;
  status: string;
  imageUrl?: string;
}

interface CartItem {
  foodItemId: string;
  name: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  staffPrice: number;
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
 
interface PreparationBatch {
  preparationId: string;
  foodItemId: string;
  foodItemName: string;
  kitchenStaffId?: string;
  date: string;
  expiryDate: string;
  preparedQuantity: number;
  soldQuantity: number;
  wastageQuantity: number;
  remainingQuantity: number;
  status: string;
}

interface POSInterfaceProps {
  currentCashier: {
    employeeId: string;
    fullName: string;
  };
  onBillCompleted?: () => void;
}

export function POSInterface({ currentCashier, onBillCompleted }: POSInterfaceProps) {
  const { t, tr } = useLanguage();

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [preparations, setPreparations] = useState<PreparationBatch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Staff sale logic state
  const [isStaffSale, setIsStaffSale] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [bankAccountId, setBankAccountId] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedBill, setCompletedBill] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [itemsRes, bankRes, settingsRes, prepsRes] = await Promise.all([
        fetch('/api/food-items'),
        fetch('/api/bank-accounts'),
        fetch('/api/settings').catch(() => null),
        fetch('/api/preparations').catch(() => null),
      ]);
      const itemsData = await itemsRes.json();
      const bankData = await bankRes.json();

      if (itemsData.success) {
        setFoodItems(itemsData.foodItems.filter((i: FoodItem) => i.status === 'ACTIVE'));
      }
      if (bankData.success && Array.isArray(bankData.accounts)) {
        setBankAccounts(bankData.accounts);
      }
      if (prepsRes && prepsRes.ok) {
        const prepsData = await prepsRes.json();
        if (prepsData.success && Array.isArray(prepsData.preparations)) {
          setPreparations(prepsData.preparations);
        }
      }
      if (settingsRes && settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setSystemSettings(settingsData.settings);
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
      console.error('Error fetching POS data', e);
      const local = localStorage.getItem('hadabima_system_settings');
      if (local) {
        try {
          setSystemSettings(JSON.parse(local));
        } catch {}
      }
    }
  };

  // Calculate sellable fresh stock vs expired blocked stock per food item
  const getItemStockInfo = (foodItemId: string) => {
    const itemBatches = preparations.filter((p) => p.foodItemId === foodItemId);
    if (itemBatches.length === 0) {
      return { hasBatches: false, freshStock: Infinity, expiredQty: 0, isOutOfStock: false };
    }

    const freshStock = itemBatches
      .filter((p) => (p.remainingQuantity || 0) > 0 && p.expiryDate >= todayStr)
      .reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

    const expiredQty = itemBatches
      .filter((p) => (p.remainingQuantity || 0) > 0 && p.expiryDate < todayStr)
      .reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

    return {
      hasBatches: true,
      freshStock,
      expiredQty,
      isOutOfStock: freshStock <= 0,
    };
  };

  const addToCart = (item: FoodItem) => {
    const stockInfo = getItemStockInfo(item.foodItemId);
    if (stockInfo.hasBatches) {
      if (stockInfo.freshStock <= 0) {
        if (stockInfo.expiredQty > 0) {
          setErrorMessage(
            `${tr(item.name)}: ${tr("All available stock is expired and blocked from sale.")} (${stockInfo.expiredQty} ${tr("units blocked")})`
          );
        } else {
          setErrorMessage(`${tr(item.name)}: ${t.pos.outOfStock}`);
        }
        return;
      }

      const existingInCart = cart.find((i) => i.foodItemId === item.foodItemId);
      const currentQty = existingInCart ? existingInCart.quantity : 0;
      if (currentQty + 1 > stockInfo.freshStock) {
        setErrorMessage(
          `${tr(item.name)}: ${tr("Cannot exceed available fresh stock")} (${stockInfo.freshStock} ${tr("fresh units available")}${
            stockInfo.expiredQty > 0 ? `, ${stockInfo.expiredQty} ${tr("expired units blocked")}` : ''
          })`
        );
        return;
      }
    }

    setErrorMessage('');
    setCart((prev) => {
      const existing = prev.find((i) => i.foodItemId === item.foodItemId);
      if (existing) {
        return prev.map((i) =>
          i.foodItemId === item.foodItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          foodItemId: item.foodItemId,
          name: item.name,
          quantity: 1,
          unit: item.unit,
          sellingPrice: item.sellingPrice,
          staffPrice: item.staffPrice,
        },
      ];
    });
  };

  const updateQuantity = (foodItemId: string, delta: number) => {
    if (delta > 0) {
      const stockInfo = getItemStockInfo(foodItemId);
      if (stockInfo.hasBatches) {
        const existing = cart.find((i) => i.foodItemId === foodItemId);
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty + delta > stockInfo.freshStock) {
          const item = foodItems.find((f) => f.foodItemId === foodItemId);
          const itemName = item ? tr(item.name) : '';
          setErrorMessage(
            `${itemName}: ${tr("Cannot exceed available fresh stock")} (${stockInfo.freshStock} ${tr("fresh units available")}${
              stockInfo.expiredQty > 0 ? `, ${stockInfo.expiredQty} ${tr("expired units blocked")}` : ''
            })`
          );
          return;
        }
      }
    }

    setErrorMessage('');
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.foodItemId === foodItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (foodItemId: string) => {
    setCart((prev) => prev.filter((i) => i.foodItemId !== foodItemId));
  };

  const clearCart = () => {
    setCart([]);
    setIsStaffSale(false);
    setPaymentMethod('CASH');
    setTenderedAmount('');
    setBankAccountId('');
    setErrorMessage('');
  };

  const getEffectiveUnitPrice = (item: CartItem) => {
    return isStaffSale ? item.staffPrice : item.sellingPrice;
  };

  const subtotal = cart.reduce((sum, item) => sum + getEffectiveUnitPrice(item) * item.quantity, 0);
  const totalAmount = subtotal;
  const cashGiven = Number(tenderedAmount) || 0;
  const changeDue = paymentMethod === 'CASH' && cashGiven >= totalAmount ? cashGiven - totalAmount : 0;

  const handleCheckout = async () => {
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage(t.pos.emptyCart);
      return;
    }

    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && !bankAccountId) {
      setErrorMessage('Please select a company bank account for Card or Online payment.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
        })),
        saleType: isStaffSale ? 'STAFF' : 'CUSTOMER',
        cashierId: currentCashier.employeeId,
        cashierName: currentCashier.fullName,
        paymentMethod,
        bankAccountId: (paymentMethod === 'CARD' || paymentMethod === 'ONLINE') ? bankAccountId : undefined,
        discount: 0,
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Checkout failed');
        setIsLoading(false);
        return;
      }

      setCompletedBill(data.bill);
      setShowReceiptModal(true);
      clearCart();
      fetchInitialData();
      if (onBillCompleted) onBillCompleted();

      if (systemSettings?.billSettings?.autoPrint) {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = foodItems.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Left Column: Food Items Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 shadow-xs rounded-2xl p-5 overflow-hidden">
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={t.pos.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
            <span>{filteredItems.length} {tr("items available")}</span>
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredItems.map((item) => {
            const effectivePrice = isStaffSale ? item.staffPrice : item.sellingPrice;
            const stockInfo = getItemStockInfo(item.foodItemId);
            const isOutOfFresh = stockInfo.hasBatches && stockInfo.freshStock <= 0;

            return (
              <div
                key={item.foodItemId}
                onClick={() => {
                  if (isOutOfFresh) {
                    if (stockInfo.expiredQty > 0) {
                      setErrorMessage(
                        `${tr(item.name)}: ${tr("All available stock is expired and blocked from sale.")} (${stockInfo.expiredQty} ${tr("units blocked")})`
                      );
                    } else {
                      setErrorMessage(`${tr(item.name)}: ${t.pos.outOfStock}`);
                    }
                    return;
                  }
                  addToCart(item);
                }}
                className={`group relative p-3 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                  isOutOfFresh
                    ? 'bg-stone-50/80 border border-stone-200 opacity-80 cursor-not-allowed'
                    : 'bg-white border border-stone-200 hover:border-amber-400 hover:shadow-lg cursor-pointer hover:scale-[1.01]'
                }`}
              >
                <div>
                  {/* Food Item Image & Unit Badge */}
                  <div className="w-full h-28 rounded-xl mb-2.5 overflow-hidden bg-stone-100 flex items-center justify-center relative shadow-inner">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isOutOfFresh ? 'grayscale-[50%]' : 'group-hover:scale-105'
                        }`}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100/50 text-amber-700/50">
                        <Utensils className="w-7 h-7 opacity-40" />
                        <span className="text-[10px] font-medium text-stone-400 mt-1">{tr("No Image")}</span>
                      </div>
                    )}

                    {isOutOfFresh && (
                      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-black text-white px-2 py-1 rounded-md bg-stone-900/85 uppercase tracking-wide">
                          {stockInfo.expiredQty > 0 ? tr("Expired (Blocked)") : tr("Out of Fresh Stock")}
                        </span>
                      </div>
                    )}

                    <span className="absolute top-2 right-2 text-[10px] font-bold text-amber-900 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs border border-amber-200 shadow-2xs">
                      {item.unit}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-tight line-clamp-2 mb-1">
                    {tr(item.name)}
                  </h4>

                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mb-1.5 font-medium">
                    <span>{tr("Shelf")}: {item.shelfLifeDays}d</span>
                  </div>

                  {/* Batch Stock Indicator: Fresh stock vs Expired blocked */}
                  {stockInfo.hasBatches && (
                    <div className="flex flex-col gap-1 mb-2">
                      {stockInfo.freshStock > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{tr("Fresh")}: {stockInfo.freshStock} {item.unit}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 border border-stone-300 w-fit">
                          {tr("Out of Fresh Stock")}
                        </span>
                      )}

                      {stockInfo.expiredQty > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 w-fit"
                          title={`${stockInfo.expiredQty} units expired and blocked from sale`}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{stockInfo.expiredQty} {tr("Expired (Blocked)")}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      Rs. {effectivePrice}
                    </div>
                    {isStaffSale ? (
                      <span className="text-[10px] text-rose-500 font-bold line-through">
                        Rs. {item.sellingPrice}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {tr("Staff")}: Rs. {item.staffPrice}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={isOutOfFresh}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOutOfFresh) {
                        if (stockInfo.expiredQty > 0) {
                          setErrorMessage(
                            `${tr(item.name)}: ${tr("All available stock is expired and blocked from sale.")} (${stockInfo.expiredQty} ${tr("units blocked")})`
                          );
                        } else {
                          setErrorMessage(`${tr(item.name)}: ${t.pos.outOfStock}`);
                        }
                        return;
                      }
                      addToCart(item);
                    }}
                    className={`p-2 rounded-lg text-white shadow-xs transition-colors ${
                      isOutOfFresh
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                    }`}
                    title={
                      isOutOfFresh
                        ? stockInfo.expiredQty > 0
                          ? tr("All available stock is expired and blocked from sale.")
                          : t.pos.outOfStock
                        : tr("Add to Bill")
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Order Cart & Checkout Terminal */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white border border-slate-200 shadow-xs rounded-2xl p-5 shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-stone-900 text-base">{t.pos.currentBill}</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors"
            >
              {t.pos.clearCart}
            </button>
          )}
        </div>

        {/* STAFF SALE TOGGLE */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isStaffSale}
              onChange={(e) => setIsStaffSale(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 bg-white border-stone-300 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-extrabold text-amber-950">
              {t.pos.staffSaleToggle}
            </span>
          </label>

          {isStaffSale && (
            <p className="text-[10px] text-amber-800 font-semibold mt-1.5 pl-6 flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{t.pos.priceNoticeStaff}</span>
            </p>
          )}
        </div>

        {/* Error / Validation Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2">
          {cart.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-amber-500" />
              <span>{t.pos.emptyCart}</span>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice = getEffectiveUnitPrice(item);
              const total = unitPrice * item.quantity;
              return (
                <div
                  key={item.foodItemId}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{tr(item.name)}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Rs. {unitPrice} x {item.quantity} {item.unit}
                    </div>
                    {(() => {
                      const stockInfo = getItemStockInfo(item.foodItemId);
                      if (!stockInfo.hasBatches) return null;
                      return (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                          <span>{tr("Fresh Stock")}: {stockInfo.freshStock}</span>
                          {item.quantity >= stockInfo.freshStock && (
                            <span className="text-amber-700 font-bold">({tr("Max")})</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {(() => {
                      const stockInfo = getItemStockInfo(item.foodItemId);
                      const isAtMax = stockInfo.hasBatches && item.quantity >= stockInfo.freshStock;
                      return (
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-xs">
                          <button
                            onClick={() => updateQuantity(item.foodItemId, -1)}
                            className="p-1 hover:text-rose-600 text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-900 text-xs">{item.quantity}</span>
                          <button
                            disabled={isAtMax}
                            onClick={() => updateQuantity(item.foodItemId, 1)}
                            className={`p-1 transition-colors ${
                              isAtMax
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:text-emerald-600 text-slate-600 cursor-pointer'
                            }`}
                            title={isAtMax ? tr("Cannot exceed available fresh stock") : undefined}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })()}

                    <div className="w-16 text-right font-black text-slate-900">
                      Rs. {total}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.foodItemId)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Payment Method */}
        <div className="pt-3 border-t border-stone-200/90 space-y-2.5 text-xs">
          <div className="flex justify-between text-stone-600 font-medium">
            <span>{t.pos.subtotal}</span>
            <span className="font-bold text-stone-900 tabular-nums">Rs. {Number(subtotal).toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-stone-200/90">
            <span className="text-xs uppercase font-extrabold tracking-wider text-stone-500">{t.pos.total}</span>
            <span className="text-amber-700 text-2xl font-black tabular-nums">Rs. {Number(totalAmount).toLocaleString()}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 pt-1.5">
            <button
              onClick={() => {
                setPaymentMethod('CASH');
                setBankAccountId('');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Banknote className="w-4 h-4 shrink-0" />
              <span>{t.pos.cash}</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('CARD');
                if (!bankAccountId && bankAccounts.length > 0) {
                  const activeAcc = bankAccounts.find((a) => a.status !== 'INACTIVE');
                  if (activeAcc) setBankAccountId(activeAcc.accountId);
                }
              }}
              className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'CARD'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{t.pos.card}</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('ONLINE');
                if (!bankAccountId && bankAccounts.length > 0) {
                  const activeAcc = bankAccounts.find((a) => a.status !== 'INACTIVE');
                  if (activeAcc) setBankAccountId(activeAcc.accountId);
                }
              }}
              className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === 'ONLINE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>{t.pos.online}</span>
            </button>
          </div>

          {/* Bank Account Selection for Card / Online */}
          {(paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-1.5 shadow-2xs">
              <label className="block text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{tr("Select Company Bank Account *")}</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-amber-600 shadow-2xs"
              >
                <option value="">-- {tr("Choose Business Bank Account")} --</option>
                {bankAccounts
                  .filter((a) => a.status !== 'INACTIVE')
                  .map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.bankName} - {acc.accountNumber} ({acc.accountName})
                    </option>
                  ))}
              </select>
              {(() => {
                const selectedAcc = bankAccounts.find((a) => a.accountId === bankAccountId);
                return selectedAcc ? (
                  <div className="flex items-center justify-between text-[10px] text-stone-600 px-0.5 pt-0.5 font-medium">
                    <span>{tr("Available Balance:")}</span>
                    <span className="font-extrabold text-stone-900 tabular-nums">
                      Rs. {Number(selectedAcc.balance || 0).toLocaleString()}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Cash Tendered / Change Due */}
          {paymentMethod === 'CASH' && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] text-stone-500 font-bold block mb-1">{t.pos.tenderedAmount}</label>
                <input
                  type="number"
                  placeholder="Rs."
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold tabular-nums focus:outline-hidden focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 font-bold block mb-1">{t.pos.changeDue}</label>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tabular-nums">
                  Rs. {Number(changeDue).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Cancel & Complete Bill */}
          <div className="flex gap-2.5 mt-3 pt-1">
            <button
              type="button"
              onClick={clearCart}
              disabled={isLoading || (cart.length === 0 && !isStaffSale && !tenderedAmount && !bankAccountId)}
              className={`px-4 py-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                cart.length === 0 && !isStaffSale && !tenderedAmount && !bankAccountId
                  ? 'bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs active:scale-[0.98]'
              }`}
              title="Cancel and Clear Current Order"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{tr("Cancel")}</span>
            </button>

            <button
              onClick={handleCheckout}
              disabled={isLoading || cart.length === 0}
              className={`flex-1 py-3.5 rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-[0.99] ${
                cart.length === 0 || isLoading
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35'
              }`}
            >
              {isLoading ? (
                <span>{t.common.loading}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.pos.completeBill}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {showReceiptModal && completedBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Thermal Receipt Card */}
            <div
              id="printable-receipt"
              style={{
                maxWidth: systemSettings?.billSettings?.paperWidth === '58mm' ? '260px' : '340px',
                margin: '0 auto',
              }}
              className="text-black bg-white p-4 sm:p-5 rounded-lg font-mono text-xs border border-slate-200 shadow-inner"
            >
              <div className="text-center pb-3 border-b border-black flex flex-col items-center">
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
                  <span className="font-bold">{completedBill.billNumber}</span>
                </div>
                {systemSettings?.billSettings?.showDateTime !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Date")}:</span>
                    <span>{new Date(completedBill.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {systemSettings?.billSettings?.showCashierName !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Cashier")}:</span>
                    <span>{completedBill.cashierName}</span>
                  </div>
                )}
                {systemSettings?.billSettings?.showSaleType !== false && (
                  <div className="flex justify-between">
                    <span>{tr("Sale Type")}:</span>
                    <span className="font-bold">
                      {completedBill.saleType === 'STAFF'
                        ? completedBill.employeeName
                          ? `${tr("STAFF SALE")} (${completedBill.employeeName})`
                          : tr("STAFF SALE")
                        : tr("CUSTOMER SALE")}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-black">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="pb-1">{tr("Item")}</th>
                      <th className="pb-1 text-center">{tr("Qty")}</th>
                      {systemSettings?.billSettings?.showItemPriceBreakdown !== false && (
                        <th className="pb-1 text-right">{tr("Price")}</th>
                      )}
                      <th className="pb-1 text-right">{tr("Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBill.items?.map((it: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-1 font-semibold">{tr(it.foodItemName)}</td>
                        <td className="py-1 text-center">{it.quantity}</td>
                        {systemSettings?.billSettings?.showItemPriceBreakdown !== false && (
                          <td className="py-1 text-right">
                            {systemSettings?.currency || 'Rs.'}{it.unitPrice}
                          </td>
                        )}
                        <td className="py-1 text-right">
                          {systemSettings?.currency || 'Rs.'}{it.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>{tr("Subtotal")}:</span>
                  <span>{systemSettings?.currency || 'Rs.'} {completedBill.subtotal}</span>
                </div>
                {completedBill.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{tr("Discount")}:</span>
                    <span>-{systemSettings?.currency || 'Rs.'} {completedBill.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>{tr("TOTAL")}:</span>
                  <span>{systemSettings?.currency || 'Rs.'} {completedBill.total}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>{tr("Payment")}:</span>
                  <span>{tr(completedBill.paymentMethod)}</span>
                </div>
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
                      *{completedBill.billNumber}*
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs flex items-center justify-center space-x-2 text-white shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.pos.printReceipt}</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
