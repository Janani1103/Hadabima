'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';
import { AdminOverview } from '@/components/dashboard/AdminOverview';
import { CashierOverview } from '@/components/dashboard/CashierOverview';
import { KitchenOverview } from '@/components/dashboard/KitchenOverview';
import { POSInterface } from '@/components/pos/POSInterface';
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { SettlementManager } from '@/components/admin/SettlementManager';
import { CashierPayrollView } from '@/components/admin/CashierPayrollView';
import { AdvanceManager } from '@/components/admin/AdvanceManager';
import { FinanceView } from '@/components/admin/FinanceView';
import { AuditLogsView } from '@/components/admin/AuditLogsView';
import { SystemSettingsView } from '@/components/admin/SystemSettingsView';
import { FoodItemManager } from '@/components/cashier/FoodItemManager';
import { DailyFoodAssignment } from '@/components/cashier/DailyFoodAssignment';
import { BillHistory } from '@/components/cashier/BillHistory';
import { DailyClosingView } from '@/components/cashier/DailyClosingView';
import { ExpensesManager } from '@/components/cashier/ExpensesManager';
import { PaymentReconciliationView } from '@/components/cashier/PaymentReconciliationView';
import { DailyItemsView } from '@/components/kitchen/DailyItemsView';
import { EarningsCalculator } from '@/components/kitchen/EarningsCalculator';
import { MyAdvancesView } from '@/components/kitchen/MyAdvancesView';
import { ReportsView } from '@/components/reports/ReportsView';
import {
  UtensilsCrossed,
  Shield,
  CreditCard,
  ChefHat,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';

interface AuthUser {
  employeeId: string;
  fullName: string;
  username: string;
  employeeType: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  commissionRate: number;
}

function BakeryLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Warm rising steam */}
      <path d="M25 13C25 9.5 28.5 8 28.5 5" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 15C32 10.5 35.5 9 35.5 6" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M39 13C39 9.5 42.5 8 42.5 5" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bread Loaf Base */}
      <path
        d="M10 37C10 23 20 18 32 18C44 18 54 23 54 37C54 44 46 47 32 47C18 47 10 44 10 37Z"
        fill="#ffedd5"
        stroke="#ea580c"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Crust Slash Cuts */}
      <path d="M21 26C23 31 23 35 21 40" stroke="#c2410c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M32 24C34 29 34 34 32 40" stroke="#c2410c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M43 26C45 31 45 35 43 40" stroke="#c2410c" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { language, setLanguage, t, tr } = useLanguage();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check saved session
    const savedUser = localStorage.getItem('hadabima_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('hadabima_user');
        setCurrentUser(null);
      }
    }
  }, []);

  const setDefaultUser = (role: 'ADMIN' | 'CASHIER' | 'KITCHEN') => {
    let user: AuthUser;
    if (role === 'ADMIN') {
      user = {
        employeeId: 'EMP-001',
        fullName: 'Janani Nethma',
        username: 'admin',
        employeeType: 'ADMIN',
        commissionRate: 0,
      };
      setActiveTab('overview');
    } else if (role === 'CASHIER') {
      user = {
        employeeId: 'EMP-002',
        fullName: 'Kasun Perera',
        username: 'cashier',
        employeeType: 'CASHIER',
        commissionRate: 0,
      };
      setActiveTab('pos');
    } else {
      user = {
        employeeId: 'EMP-003',
        fullName: 'Amal Silva',
        username: 'amal',
        employeeType: 'KITCHEN',
        commissionRate: 10,
      };
      setActiveTab('overview');
    }

    setCurrentUser(user);
    localStorage.setItem('hadabima_user', JSON.stringify(user));
  };

  const handleRoleSwitch = (role: 'ADMIN' | 'CASHIER' | 'KITCHEN') => {
    setDefaultUser(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('hadabima_user');
    setCurrentUser(null);
    setLoginError('');
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || t.auth.invalidCredentials);
      } else {
        setCurrentUser(data.user);
        localStorage.setItem('hadabima_user', JSON.stringify(data.user));
        setActiveTab(data.user.employeeType === 'CASHIER' ? 'pos' : 'overview');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // LOGIN VIEW IF LOGGED OUT
  if (!currentUser) {
    return (
      <div
        className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat overflow-x-hidden"
        style={{
          backgroundImage: "url('/bakery-bg.jpg')",
        }}
      >
        {/* Warm Ambient Darkening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/65 backdrop-blur-[0.5px]" />

        {/* Top-Right Floating Language Selector */}
        <div className="absolute top-4 right-4 z-20 flex items-center bg-stone-900/80 backdrop-blur-md border border-stone-700/80 rounded-2xl p-1 shadow-lg">
          <div className="flex items-center space-x-1 px-2 text-stone-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('si')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === 'si'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              සිංහල
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14 py-6">
          {/* Left Column: Bakery Hero Branding */}
          <div className="text-white space-y-4 max-w-xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <img
                src={HADABIMA_LOGO_URL}
                alt="Hadabima Authority Logo"
                className="w-16 h-16 object-contain drop-shadow-md"
              />
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white drop-shadow-lg">
                Hadabima <span className="text-orange-500">Adikariye</span>
              </h1>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-stone-200 text-sm sm:text-base font-semibold tracking-[0.25em] uppercase my-3 drop-shadow">
                <span className="w-8 h-[2px] bg-orange-400 inline-block" />
                <span>{tr("Bakery & Pastry Shop")}</span>
                <span className="w-8 h-[2px] bg-orange-400 inline-block" />
              </div>
              <p className="text-xs sm:text-sm tracking-wider text-stone-300 font-medium drop-shadow">
                {tr("Freshly Baked • Every Day")}
              </p>
            </div>


          </div>

          {/* Right Column: Floating White Login Card */}
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/60 space-y-6 text-stone-900">
            {/* Card Header */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <img
                  src={HADABIMA_LOGO_URL}
                  alt="Hadabima Authority Logo"
                  className="w-10 h-10 object-contain"
                />
                <div className="text-left leading-tight">
                  <div className="text-base font-black tracking-tight text-stone-900">
                    Hadabima <span className="text-orange-600">Adikariye</span>
                  </div>
                  <div className="text-[9px] font-extrabold tracking-[0.18em] text-stone-600 uppercase">
                    {tr("Bakery & Pastry Shop")}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {tr("Welcome Back!")}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {tr("Sign in to your account to continue")}
                </p>
              </div>
            </div>

            {/* Login Error Alert */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center font-bold">
                {loginError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleManualLogin} className="space-y-4 text-xs">
              <div>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={tr("Username or Email")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-orange-500 focus:bg-white text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={tr("Password")}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-orange-500 focus:bg-white text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>{isLoggingIn ? tr("Loading...") : tr("Login →")}</span>
              </button>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                  />
                  <span className="text-stone-600 text-xs font-medium">{tr("Remember Me")}</span>
                </label>

                <button
                  type="button"
                  onClick={() => alert('Password reset: Please contact the system administrator.')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                >
                  {tr("Forgot Password?")}
                </button>
              </div>
            </form>

            {/* Quick Demo Access Pills */}
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center">
                {tr("Quick Demo Access:")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDefaultUser('ADMIN')}
                  className="p-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-center transition-all group cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-stone-500 group-hover:text-orange-600 mx-auto mb-0.5" />
                  <span className="block text-[11px] font-bold text-stone-800">{tr("Admin")}</span>
                  <span className="block text-[9px] text-stone-500">Janani</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultUser('CASHIER')}
                  className="p-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-center transition-all group cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-stone-500 group-hover:text-orange-600 mx-auto mb-0.5" />
                  <span className="block text-[11px] font-bold text-stone-800">{tr("Cashier")}</span>
                  <span className="block text-[9px] text-stone-500">Kasun</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultUser('KITCHEN')}
                  className="p-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-center transition-all group cursor-pointer"
                >
                  <ChefHat className="w-3.5 h-3.5 text-stone-500 group-hover:text-orange-600 mx-auto mb-0.5" />
                  <span className="block text-[11px] font-bold text-stone-800">{tr("Kitchen Staff")}</span>
                  <span className="block text-[9px] text-stone-500">Amal</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-stone-400 text-center pt-2">
              Hadabima Adikariye • {tr("Bakery & Pastry Shop")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE LOGGED-IN DASHBOARD SHELL
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Sidebar */}
        <Sidebar
          role={currentUser.employeeType}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-stone-50">
          {/* ADMIN VIEWS */}
          {currentUser.employeeType === 'ADMIN' && (
            <>
              {activeTab === 'overview' && <AdminOverview onNavigateTab={setActiveTab} />}
              {activeTab === 'employees' && <EmployeeManagement />}
              {activeTab === 'settlements' && <SettlementManager />}
              {activeTab === 'payroll' && <CashierPayrollView />}
              {activeTab === 'advances' && <AdvanceManager />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'expenses' && (
                <ExpensesManager currentUser={currentUser} />
              )}
              {activeTab === 'reports' && (
                <ReportsView role="ADMIN" currentUser={currentUser} />
              )}
              {activeTab === 'audit' && <AuditLogsView />}
              {activeTab === 'settings' && <SystemSettingsView currentUser={currentUser} />}
            </>
          )}

          {/* CASHIER VIEWS */}
          {currentUser.employeeType === 'CASHIER' && (
            <>
              {activeTab === 'overview' && (
                <CashierOverview
                  currentCashier={currentUser}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'pos' && (
                <POSInterface currentCashier={currentUser} />
              )}
              {activeTab === 'foodItems' && (
                <FoodItemManager currentCashier={currentUser} />
              )}
              {activeTab === 'assignments' && (
                <DailyFoodAssignment currentCashier={currentUser} />
              )}
              {activeTab === 'bills' && <BillHistory currentCashier={currentUser} />}
              {activeTab === 'expenses' && (
                <ExpensesManager currentUser={currentUser} />
              )}
              {activeTab === 'closing' && (
                <DailyClosingView currentCashier={currentUser} />
              )}
              {activeTab === 'reconciliation' && (
                <PaymentReconciliationView
                  currentCashier={currentUser}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsView role="CASHIER" currentUser={currentUser} />
              )}
            </>
          )}

          {/* KITCHEN VIEWS */}
          {currentUser.employeeType === 'KITCHEN' && (
            <>
              {activeTab === 'overview' && (
                <KitchenOverview
                  currentStaff={currentUser}
                  onNavigateTab={setActiveTab}
                />
              )}
              {activeTab === 'myItems' && (
                <DailyItemsView currentStaff={currentUser} />
              )}
              {activeTab === 'earnings' && (
                <EarningsCalculator currentStaff={currentUser} />
              )}
              {activeTab === 'advances' && (
                <MyAdvancesView currentStaff={currentUser} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
