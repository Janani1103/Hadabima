'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import {
  UtensilsCrossed,
  Globe,
  User,
  LogOut,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentUser?: {
    fullName: string;
    username: string;
    employeeType: 'ADMIN' | 'CASHIER' | 'KITCHEN';
    commissionRate?: number;
  };
  onRoleSwitch?: (role: 'ADMIN' | 'CASHIER' | 'KITCHEN') => void;
  onLogout?: () => void;
}

export function Navbar({ currentUser, onRoleSwitch, onLogout }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all sample data to default seed state?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const roleLabel = {
    ADMIN: t.roles.admin,
    CASHIER: t.roles.cashier,
    KITCHEN: t.roles.kitchen,
  }[currentUser?.employeeType || 'ADMIN'];

  const roleColor = {
    ADMIN: 'bg-amber-100 text-amber-900 border-amber-300',
    CASHIER: 'bg-orange-100 text-orange-900 border-orange-300',
    KITCHEN: 'bg-stone-100 text-stone-800 border-stone-300',
  }[currentUser?.employeeType || 'ADMIN'];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs px-4 lg:px-8 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center p-1 shadow-2xs overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HADABIMA_LOGO_URL}
              alt="Hadabima Authority Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider text-stone-900">HADABIMA</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                SRI LANKA
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block font-medium">{t.tagline}</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-50/80 border border-stone-200/80 text-xs font-semibold text-stone-600 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="tabular-nums">{timeStr || 'Loading...'}</span>
        </div>

        {/* Actions Right */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-stone-100/90 rounded-xl p-1 border border-stone-200/90 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-amber-600 ml-2 mr-1.5 hidden sm:block" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('si')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'si'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              සිංහල
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              தமிழ்
            </button>
          </div>



          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            title={language === 'si' ? 'නැවත මුල සිට සකසන්න' : language === 'ta' ? 'மீட்டமைக்க' : 'Reset to fresh demo dataset'}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all"
          >
            {resetSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">{language === 'si' ? 'සාර්ථකයි!' : language === 'ta' ? 'வெற்றி!' : 'Seeded!'}</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{language === 'si' ? 'දත්ත නැවත සකසන්න' : language === 'ta' ? 'மீட்டமைக்க' : 'Reset Demo'}</span>
              </>
            )}
          </button>

          {/* User Profile & Sign Out */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.fullName || 'Janani Nethma'}
              </div>
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleColor}`}>
                  {roleLabel}
                </span>
                {currentUser?.employeeType === 'KITCHEN' && currentUser.commissionRate && (
                  <span className="text-[10px] text-amber-800 font-extrabold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    {currentUser.commissionRate}%
                  </span>
                )}
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title={t.nav.logout}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
