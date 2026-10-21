import { HADABIMA_LOGO_URL } from '../constants';

export interface BillSettings {
  receiptTitle: string;
  receiptSubtitle: string;
  receiptAddress: string;
  receiptPhone: string;
  businessRegNumber: string;
  showLogo: boolean;
  paperWidth: '80mm' | '58mm';
  billPrefix: string;
  showCashierName: boolean;
  showSaleType: boolean;
  showItemPriceBreakdown: boolean;
  showDateTime: boolean;
  enableTax: boolean;
  taxRate: number; // percentage
  enableServiceCharge: boolean;
  serviceChargeRate: number; // percentage
  footerThankYouNote: string;
  footerNotice: string;
  wifiDetails: string;
  showBarcode: boolean;
  autoPrint: boolean;
  printCopies: number;
}

export interface SystemSettings {
  shopName: string;
  tagline: string;
  address: string;
  contact: string;
  contactSecondary?: string;
  email?: string;
  currency: string;
  logoUrl?: string;
  billSettings: BillSettings;
}

export const DEFAULT_BILL_SETTINGS: BillSettings = {
  receiptTitle: 'HADABIMA SRI LANKA',
  receiptSubtitle: 'AUTHENTIC FOOD SHOP MANAGEMENT',
  receiptAddress: 'No. 45, Kandy Road, Colombo',
  receiptPhone: 'Tel: +94 11 234 5678',
  businessRegNumber: 'BRN: HAD-GOV-2024/09',
  showLogo: true,
  paperWidth: '80mm',
  billPrefix: 'BILL-',
  showCashierName: true,
  showSaleType: true,
  showItemPriceBreakdown: true,
  showDateTime: true,
  enableTax: false,
  taxRate: 0,
  enableServiceCharge: false,
  serviceChargeRate: 0,
  footerThankYouNote: '*** THANK YOU FOR VISITING ***',
  footerNotice: 'HADABIMA - TASTE OF SRI LANKA',
  wifiDetails: 'Free Wi-Fi: Hadabima_Guest',
  showBarcode: true,
  autoPrint: false,
  printCopies: 1,
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  shopName: 'Hadabima Sri Lanka Food Shop',
  tagline: 'Authentic Traditional Food & Culinary Delights',
  address: 'No. 45, Kandy Road, Colombo, Sri Lanka',
  contact: '+94 11 234 5678',
  contactSecondary: '+94 81 238 8899',
  email: 'info@hadabima.gov.lk',
  currency: 'Rs.',
  logoUrl: HADABIMA_LOGO_URL,
  billSettings: DEFAULT_BILL_SETTINGS,
};
