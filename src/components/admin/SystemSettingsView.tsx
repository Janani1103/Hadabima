'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { HADABIMA_LOGO_URL } from '@/lib/constants';
import {
  SystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_BILL_SETTINGS,
} from '@/lib/types/settings';
import {
  Settings,
  Save,
  Store,
  Receipt,
  Printer,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Percent,
  QrCode,
  Eye,
  Wifi,
  Phone,
  MapPin,
  Building,
  Tag,
  Info,
  Layers,
  Sparkles,
  DollarSign,
  FileCheck,
} from 'lucide-react';

interface SystemSettingsViewProps {
  currentUser?: {
    fullName: string;
    employeeType: string;
  };
}

export function SystemSettingsView({ currentUser }: SystemSettingsViewProps) {
  const { t, tr, language } = useLanguage();

  const [activeSection, setActiveSection] = useState<'all' | 'general' | 'bill'>('all');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewPaperWidth, setPreviewPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data.settings,
          billSettings: {
            ...DEFAULT_BILL_SETTINGS,
            ...(data.settings.billSettings || {}),
          },
        });
        if (data.settings.billSettings?.paperWidth) {
          setPreviewPaperWidth(data.settings.billSettings.paperWidth);
        }
      } else {
        // Fallback to localStorage if any
        const local = localStorage.getItem('hadabima_system_settings');
        if (local) {
          try {
            setSettings(JSON.parse(local));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
      const local = localStorage.getItem('hadabima_system_settings');
      if (local) {
        try {
          setSettings(JSON.parse(local));
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillSettingChange = (field: keyof typeof DEFAULT_BILL_SETTINGS, value: any) => {
    setSettings((prev) => {
      const nextBill = {
        ...prev.billSettings,
        [field]: value,
      };
      if (field === 'paperWidth') {
        setPreviewPaperWidth(value);
      }
      return {
        ...prev,
        billSettings: nextBill,
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save to localStorage immediately for instant cross-tab sync
      localStorage.setItem('hadabima_system_settings', JSON.stringify(settings));

      // Persist to database via API
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          updatedBy: currentUser?.fullName || 'Admin',
          userRole: currentUser?.employeeType || 'ADMIN',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Still show success if local storage worked
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to restore default System & Bill settings?')) {
      setSettings(DEFAULT_SYSTEM_SETTINGS);
      setPreviewPaperWidth(DEFAULT_BILL_SETTINGS.paperWidth);
    }
  };

  const handlePrintTestReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200/80 shadow-xs p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-700 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {t.nav.settings}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'si'
                  ? 'වෙළඳසැල් තොරතුරු, මූලික මුදල් ඒකකය සහ POS බිල්පත් ආකෘති සැකසුම්'
                  : language === 'ta'
                  ? 'கடை சுயவிவரம், நாணயம் மற்றும் POS பில் கட்டமைப்புகள்'
                  : 'Configure food shop business profile, currency, and POS bill & thermal receipt templates'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr('All Settings')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSection === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>{tr('Store Profile')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('bill')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSection === 'bill'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.nav.billSettings}</span>
          </button>
        </div>
      </div>

      {/* SAVE SUCCESS BANNER */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs flex items-center justify-between font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-950">Settings Saved Successfully!</div>
              <p className="text-[11px] text-emerald-800">
                System profile and bill/receipt configurations are synced and active for all POS registers.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800 font-mono">
            Synced
          </span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT FORM + RIGHT LIVE PREVIEW */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SETTINGS FORM (7 or 8 columns on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* SECTION 1: GENERAL SYSTEM & STORE PROFILE */}
          {(activeSection === 'all' || activeSection === 'general') && (
            <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {tr('Store Identity & Profile')}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{tr('Business Details')}</span>
              </div>

              {/* Authority Brand Logo */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/60 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-amber-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logoUrl || HADABIMA_LOGO_URL}
                    alt="Hadabima Authority Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>Hadabima Authority Brand</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {tr('Official Brand')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'si'
                      ? 'POS පාරිභෝගික රිසිට්පත් සහ බිල්පත් ශීර්ෂය සඳහා නිල ලාංඡනය මුද්‍රණය වේ.'
                      : language === 'ta'
                      ? 'POS வாடிக்கையாளர் ரசீதுகள் மற்றும் பில் தலைப்புகளில் அச்சிடப்படும் அதிகாரப்பூர்வ சின்னம்.'
                      : 'Official emblem printed on POS thermal customer receipts and bill headers.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Custom Logo Image URL (optional)"
                      value={settings.logoUrl || ''}
                      onChange={(e) => handleGeneralChange('logoUrl', e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-200/90 text-slate-800 placeholder-slate-400 w-full max-w-md focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Food Shop Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.shopName}
                    onChange={(e) => handleGeneralChange('shopName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-semibold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Tagline / Sub-heading')}
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => handleGeneralChange('tagline', e.target.value)}
                    placeholder="e.g. Authentic Traditional Sri Lankan Food"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Store Physical Address')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.address}
                    onChange={(e) => handleGeneralChange('address', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Primary Contact Number')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.contact}
                    onChange={(e) => handleGeneralChange('contact', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Secondary Contact / Landline')}
                  </label>
                  <input
                    type="text"
                    value={settings.contactSecondary || ''}
                    onChange={(e) => handleGeneralChange('contactSecondary', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Official Business Email')}
                  </label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleGeneralChange('email', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {tr('Base Currency Label / Symbol')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.currency}
                    onChange={(e) => handleGeneralChange('currency', e.target.value)}
                    placeholder="e.g. Rs. or LKR"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-bold transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: BILL & RECEIPT SETTINGS (බිල්පත් සැකසුම්) */}
          {(activeSection === 'all' || activeSection === 'bill') && (
            <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {t.nav.billSettings}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {tr('Thermal POS Active')}
                </span>
              </div>

              {/* SUBSECTION A: RECEIPT HEADER DETAILS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 text-stone-700">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{tr('Receipt Header Information')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Business Title on Receipt')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.billSettings.receiptTitle}
                      onChange={(e) => handleBillSettingChange('receiptTitle', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-bold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Receipt Subtitle / Unit')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.receiptSubtitle}
                      onChange={(e) => handleBillSettingChange('receiptSubtitle', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-semibold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Store Address on Receipt')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.receiptAddress}
                      onChange={(e) => handleBillSettingChange('receiptAddress', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Telephone on Receipt')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.receiptPhone}
                      onChange={(e) => handleBillSettingChange('receiptPhone', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Business Reg. / Tax (VAT) Number')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.businessRegNumber}
                      onChange={(e) => handleBillSettingChange('businessRegNumber', e.target.value)}
                      placeholder="e.g. BRN: W/12345 or VAT-987654"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Bill Sequence Prefix')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.billPrefix}
                      onChange={(e) => handleBillSettingChange('billPrefix', e.target.value)}
                      placeholder="e.g. BILL- or HAD-"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-bold font-mono transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SUBSECTION B: PAPER & LAYOUT PREFERENCES */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>{tr('Thermal Paper Roll & Layout')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Paper Width Selection */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <label className="block text-slate-800 font-bold">
                      {tr('Receipt Paper Width')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBillSettingChange('paperWidth', '80mm')}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          settings.billSettings.paperWidth === '80mm'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{tr('80mm Thermal')}</span>
                        <span className="text-[10px] font-normal text-slate-500">{tr('Standard POS')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBillSettingChange('paperWidth', '58mm')}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          settings.billSettings.paperWidth === '58mm'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{tr('58mm Thermal')}</span>
                        <span className="text-[10px] font-normal text-slate-500">{tr('Compact / Mini')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Print Copies */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <label className="block text-slate-800 font-bold">
                      {tr('Default Print Copies')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBillSettingChange('printCopies', 1)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          settings.billSettings.printCopies === 1
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{tr('1 Copy')}</span>
                        <span className="text-[10px] font-normal text-slate-500">{tr('Customer Only')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBillSettingChange('printCopies', 2)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          settings.billSettings.printCopies === 2
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{tr('2 Copies')}</span>
                        <span className="text-[10px] font-normal text-slate-500">{tr('Merchant + Customer')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISIBILITY SWITCHES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Print Logo on Receipt')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'හදබිම නිල ලාංඡනය බිල්පතේ මුද්‍රණය' : language === 'ta' ? 'ரசீதில் லோகோ அச்சிடுக' : 'Show Hadabima Authority emblem'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showLogo}
                      onChange={(e) => handleBillSettingChange('showLogo', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Show Cashier Name')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'මුදල් අයකැමිගේ අනන්‍යතාවය මුද්‍රණය' : language === 'ta' ? 'காசாளர் பெயரை அச்சிடுக' : 'Print cashier identity on bill'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showCashierName}
                      onChange={(e) => handleBillSettingChange('showCashierName', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Show Sale Type (Staff/Customer)')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'කාර්ය මණ්ඩල හෝ පාරිභෝගික විකිණීමක්ද යන්න' : language === 'ta' ? 'விற்பனை வகையைக் குறிக்க' : 'Indicate if staff discounted sale'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showSaleType}
                      onChange={(e) => handleBillSettingChange('showSaleType', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Show Date & Timestamp')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'ගනුදෙනුව සිදු වූ දිනය සහ වේලාව' : language === 'ta' ? 'பரிவர்த்தனை நிகழ்ந்த நேரம்' : 'Exact time transaction occurred'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showDateTime}
                      onChange={(e) => handleBillSettingChange('showDateTime', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Item Price Breakdown')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'ඒකක මිල සහ මුළු මිල තීරු' : language === 'ta' ? 'அலகு விலை மற்றும் மொத்த விலை' : 'Print unit price and total column'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showItemPriceBreakdown}
                      onChange={(e) =>
                        handleBillSettingChange('showItemPriceBreakdown', e.target.checked)
                      }
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Auto-Print on Checkout')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'බිල්පත සම්පූර්ණ කළ සැනින් මුද්‍රණය' : language === 'ta' ? 'தானியங்கி அச்சு' : 'Immediately open print dialog'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.autoPrint}
                      onChange={(e) => handleBillSettingChange('autoPrint', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors sm:col-span-2">
                    <div>
                      <span className="font-bold text-slate-800">{tr('Show Barcode / Security Hash')}</span>
                      <p className="text-[11px] text-slate-500">
                        {language === 'si' ? 'බිල්පතේ පහළින් Barcode සලකුණ පෙන්වීම' : language === 'ta' ? 'ரசீதின் கீழே பார்கோடு காட்டு' : 'Include barcode tracking token at the bottom of the bill'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billSettings.showBarcode}
                      onChange={(e) => handleBillSettingChange('showBarcode', e.target.checked)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                  </label>
                </div>
              </div>

              {/* SUBSECTION C: TAX & SERVICE CHARGES */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-blue-600" />
                  <span>{tr('Tax, VAT & Service Charges')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{tr('Enable Tax / VAT')}</span>
                      <input
                        type="checkbox"
                        checked={settings.billSettings.enableTax}
                        onChange={(e) => handleBillSettingChange('enableTax', e.target.checked)}
                        className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                      />
                    </div>
                    {settings.billSettings.enableTax && (
                      <div>
                        <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                          {tr('Tax Rate (%)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={settings.billSettings.taxRate}
                          onChange={(e) =>
                            handleBillSettingChange('taxRate', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{tr('Enable Service Charge')}</span>
                      <input
                        type="checkbox"
                        checked={settings.billSettings.enableServiceCharge}
                        onChange={(e) =>
                          handleBillSettingChange('enableServiceCharge', e.target.checked)
                        }
                        className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 accent-amber-600"
                      />
                    </div>
                    {settings.billSettings.enableServiceCharge && (
                      <div>
                        <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                          {tr('Service Charge Rate (%)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={settings.billSettings.serviceChargeRate}
                          onChange={(e) =>
                            handleBillSettingChange(
                              'serviceChargeRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SUBSECTION D: FOOTER & CUSTOMER MESSAGES */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>{tr('Receipt Footer & Customer Notes')}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Primary Thank You Message')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.footerThankYouNote}
                      onChange={(e) =>
                        handleBillSettingChange('footerThankYouNote', e.target.value)
                      }
                      placeholder="e.g. *** THANK YOU FOR VISITING ***"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Secondary Footer Notice / Policy')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.footerNotice}
                      onChange={(e) => handleBillSettingChange('footerNotice', e.target.value)}
                      placeholder="e.g. HADABIMA - TASTE OF SRI LANKA / EXCHANGE WITHIN 24 HOURS"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {tr('Customer Wi-Fi / Promotional Notice')}
                    </label>
                    <input
                      type="text"
                      value={settings.billSettings.wifiDetails}
                      onChange={(e) => handleBillSettingChange('wifiDetails', e.target.value)}
                      placeholder="e.g. Free Wi-Fi: Hadabima_Guest / Pass: CeylonFood2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white flex items-center space-x-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? tr('Loading...') : tr('Save System & Bill Settings')}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{tr('Reset Defaults')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintTestReceipt}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{tr('Test Print Preview')}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE THERMAL BILL PREVIEW (Sticky 4 or 5 columns on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-xs tracking-wide uppercase text-slate-200">
                  {tr('Live Bill Preview')}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    previewPaperWidth === '80mm'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    previewPaperWidth === '58mm'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  58mm
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Real-time thermal receipt representation based on your current settings.
            </p>

            {/* REALISTIC THERMAL BILL SHEET */}
            <div className="bg-slate-200 p-3 sm:p-4 rounded-xl flex justify-center overflow-x-auto">
              <div
                id="printable-receipt"
                style={{
                  width: previewPaperWidth === '58mm' ? '240px' : '310px',
                }}
                className="bg-white text-black p-4 rounded-sm shadow-md font-mono text-[11px] border border-stone-300 transition-all select-none"
              >
                {/* Header */}
                <div className="text-center pb-2.5 border-b border-dashed border-black flex flex-col items-center">
                  {settings.billSettings.showLogo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={settings.logoUrl || HADABIMA_LOGO_URL}
                      alt="Receipt Logo"
                      className="w-12 h-12 object-contain mx-auto mb-1.5"
                    />
                  )}
                  <div className="font-extrabold text-sm tracking-wider uppercase">
                    {settings.billSettings.receiptTitle || settings.shopName}
                  </div>
                  {settings.billSettings.receiptSubtitle && (
                    <div className="text-[9px] font-bold text-gray-700 tracking-tight">
                      {settings.billSettings.receiptSubtitle}
                    </div>
                  )}
                  {settings.billSettings.receiptAddress && (
                    <div className="text-[9px] text-gray-600 mt-0.5 leading-tight">
                      {settings.billSettings.receiptAddress}
                    </div>
                  )}
                  {settings.billSettings.receiptPhone && (
                    <div className="text-[9px] text-gray-600">
                      {settings.billSettings.receiptPhone}
                    </div>
                  )}
                  {settings.billSettings.businessRegNumber && (
                    <div className="text-[9px] font-bold text-gray-800 mt-0.5">
                      {settings.billSettings.businessRegNumber}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Bill No:</span>
                    <span className="font-bold">
                      {settings.billSettings.billPrefix || 'BILL-'}20261020-0042
                    </span>
                  </div>

                  {settings.billSettings.showDateTime && (
                    <div className="flex justify-between">
                      <span>Date/Time:</span>
                      <span>2026-10-20 12:45 PM</span>
                    </div>
                  )}

                  {settings.billSettings.showCashierName && (
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span>{currentUser?.fullName || 'Kasun Perera'}</span>
                    </div>
                  )}

                  {settings.billSettings.showSaleType && (
                    <div className="flex justify-between font-bold">
                      <span>Sale Type:</span>
                      <span>CUSTOMER SALE</span>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="py-2 border-b border-dashed border-black">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-black text-[9px]">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-center">Qty</th>
                        {settings.billSettings.showItemPriceBreakdown && (
                          <th className="pb-1 text-right">Price</th>
                        )}
                        <th className="pb-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-1 font-semibold leading-tight">Pol Roti (Plain)</td>
                        <td className="py-1 text-center">3</td>
                        {settings.billSettings.showItemPriceBreakdown && (
                          <td className="py-1 text-right">80</td>
                        )}
                        <td className="py-1 text-right font-bold">240.00</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold leading-tight">Lunu Miris Cup</td>
                        <td className="py-1 text-center">1</td>
                        {settings.billSettings.showItemPriceBreakdown && (
                          <td className="py-1 text-right">50</td>
                        )}
                        <td className="py-1 text-right font-bold">50.00</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold leading-tight">Plain Tea (Ceylon)</td>
                        <td className="py-1 text-center">2</td>
                        {settings.billSettings.showItemPriceBreakdown && (
                          <td className="py-1 text-right">40</td>
                        )}
                        <td className="py-1 text-right font-bold">80.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="py-2 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{settings.currency} 370.00</span>
                  </div>

                  {settings.billSettings.enableTax && (
                    <div className="flex justify-between text-gray-700">
                      <span>Tax / VAT ({settings.billSettings.taxRate}%):</span>
                      <span>
                        {settings.currency}{' '}
                        {((370 * settings.billSettings.taxRate) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {settings.billSettings.enableServiceCharge && (
                    <div className="flex justify-between text-gray-700">
                      <span>Service ({settings.billSettings.serviceChargeRate}%):</span>
                      <span>
                        {settings.currency}{' '}
                        {((370 * settings.billSettings.serviceChargeRate) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-black">
                    <span>TOTAL:</span>
                    <span>
                      {settings.currency}{' '}
                      {(
                        370 +
                        (settings.billSettings.enableTax
                          ? (370 * settings.billSettings.taxRate) / 100
                          : 0) +
                        (settings.billSettings.enableServiceCharge
                          ? (370 * settings.billSettings.serviceChargeRate) / 100
                          : 0)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-0.5 text-gray-700">
                    <span>Paid Via:</span>
                    <span className="font-bold">CASH</span>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="text-center pt-2.5 border-t border-dashed border-black space-y-1 text-[9px]">
                  {settings.billSettings.footerThankYouNote && (
                    <div className="font-bold text-gray-900">
                      {settings.billSettings.footerThankYouNote}
                    </div>
                  )}
                  {settings.billSettings.footerNotice && (
                    <div className="text-gray-600 leading-tight">
                      {settings.billSettings.footerNotice}
                    </div>
                  )}
                  {settings.billSettings.wifiDetails && (
                    <div className="text-gray-700 font-semibold pt-0.5">
                      {settings.billSettings.wifiDetails}
                    </div>
                  )}

                  {settings.billSettings.showBarcode && (
                    <div className="pt-2 flex flex-col items-center">
                      <div className="w-32 h-6 bg-stone-900 flex items-center justify-around px-2 text-[7px] text-white font-mono tracking-widest overflow-hidden">
                        ||| | |||| | || |||||
                      </div>
                      <span className="text-[8px] text-gray-500 mt-0.5 tracking-tighter">
                        *HAD-B20261020-0042*
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handlePrintTestReceipt}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Test Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
