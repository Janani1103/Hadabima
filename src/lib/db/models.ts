import mongoose, { Schema } from 'mongoose';

// Employee Schema
const EmployeeSchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    nic: { type: String, required: true },
    contactNumber: { type: String, default: '' },
    contactNumber1: { type: String, default: '' },
    contactNumber2: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    address: { type: String, required: true },
    employeeType: { type: String, enum: ['ADMIN', 'CASHIER', 'KITCHEN'], required: true, index: true },
    joinDate: { type: String, required: true },
    basicSalary: { type: Number, default: 0 },
    salaryPaymentMethod: { type: String, enum: ['CASH', 'BANK'], default: 'CASH' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    commissionRate: { type: Number, default: 10 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

// Food Item Schema
const FoodItemSchema = new Schema(
  {
    foodItemId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    staffPrice: { type: Number, required: true },
    unit: { type: String, default: 'Piece' },
    shelfLifeDays: { type: Number, default: 1 },
    imageUrl: { type: String, default: '' },
    priceHistory: [
      {
        sellingPrice: { type: Number, required: true },
        staffPrice: { type: Number, required: true },
        effectiveDate: { type: String, required: true },
        changedBy: { type: String, default: 'Cashier' },
      },
    ],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

// Daily Food Assignment Schema
const DailyFoodAssignmentSchema = new Schema(
  {
    assignmentId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    foodItemId: { type: String, required: true, index: true },
    foodItemName: { type: String, required: true },
    kitchenStaffId: { type: String, required: true, index: true },
    kitchenStaffName: { type: String, required: true },
    assignedQuantity: { type: Number, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Food Preparation Schema
const FoodPreparationSchema = new Schema(
  {
    preparationId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    foodItemId: { type: String, required: true, index: true },
    foodItemName: { type: String, required: true },
    kitchenStaffId: { type: String, required: true, index: true },
    kitchenStaffName: { type: String, required: true },
    preparedQuantity: { type: Number, required: true },
    soldQuantity: { type: Number, default: 0 },
    wastageQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number, required: true },
    expiryDate: { type: String, required: true, index: true },
    status: { type: String, enum: ['FRESH', 'EXPIRING_TODAY', 'EXPIRED'], default: 'FRESH', index: true },
  },
  { timestamps: true }
);

// Bill Schema
const BillSchema = new Schema(
  {
    billId: { type: String, required: true, unique: true, index: true },
    billNumber: { type: String, required: true, unique: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    saleType: { type: String, enum: ['CUSTOMER', 'STAFF'], required: true, index: true },
    employeeId: { type: String, index: true },
    employeeName: { type: String },
    items: [
      {
        foodItemId: { type: String, required: true },
        foodItemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        kitchenStaffId: { type: String },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'ONLINE'], required: true },
    bankAccountId: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    status: { type: String, enum: ['COMPLETED', 'VOIDED'], default: 'COMPLETED', index: true },
    voidReason: { type: String },
    voidedBy: { type: String },
    voidedAt: { type: Date },
  },
  { timestamps: true }
);

// Sale item schema
const SaleSchema = new Schema(
  {
    saleId: { type: String, required: true, unique: true },
    billId: { type: String, required: true, index: true },
    foodItemId: { type: String, required: true, index: true },
    foodItemName: { type: String, required: true },
    kitchenStaffId: { type: String, index: true },
    quantity: { type: Number, required: true },
    saleType: { type: String, enum: ['CUSTOMER', 'STAFF'], required: true, index: true },
    employeeId: { type: String, index: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    cashierId: { type: String, required: true },
    date: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Daily Settlement Schema
const DailySettlementSchema = new Schema(
  {
    settlementId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    kitchenStaffId: { type: String, required: true, index: true },
    kitchenStaffName: { type: String, required: true },
    commissionRate: { type: Number, required: true },
    customerSalesValue: { type: Number, default: 0 },
    staffSalesValue: { type: Number, default: 0 },
    totalEligibleSales: { type: Number, default: 0 },
    grossCommission: { type: Number, default: 0 },
    advanceDeduction: { type: Number, default: 0 },
    staffPurchaseDeduction: { type: Number, default: 0 },
    netPayment: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'], default: 'PENDING', index: true },
    approvedBy: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Employee Advance Schema
const AdvanceSchema = new Schema(
  {
    advanceId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeRole: { type: String, default: 'STAFF' },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    disbursementSource: { type: String, enum: ['CASH_DRAWER', 'BANK_ACCOUNT'], default: 'CASH_DRAWER' },
    sourceAccountId: { type: String, default: '' },
    approvedBy: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DEDUCTED', 'REJECTED', 'CANCELLED'], default: 'APPROVED', index: true },
    remainingAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Staff Purchase Schema
const StaffPurchaseSchema = new Schema(
  {
    purchaseId: { type: String, required: true, unique: true },
    billId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    foodItemId: { type: String, required: true },
    foodItemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    date: { type: String, required: true, index: true },
    settlementId: { type: String },
    deducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Expense Schema
const ExpenseSchema = new Schema(
  {
    expenseId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    category: { type: String, enum: ['Electricity', 'Water', 'Transport', 'Maintenance', 'Packaging', 'Other'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'ONLINE'], default: 'CASH' },
    bankAccountId: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    receiptAttachment: { type: String, default: '' },
    addedBy: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// Cashier Closing Schema
const CashierClosingSchema = new Schema(
  {
    closingId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    cashierId: { type: String, required: true },
    cashierName: { type: String, required: true },
    openingCash: { type: Number, required: true },
    cashSales: { type: Number, required: true },
    otherCashReceipts: { type: Number, default: 0 },
    cashExpenses: { type: Number, default: 0 },
    expectedCash: { type: Number, required: true },
    actualCash: { type: Number, required: true },
    difference: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Audit Log Schema
const AuditLogSchema = new Schema(
  {
    auditId: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordId: { type: String, required: true },
    previousValue: { type: String },
    newValue: { type: String },
    details: { type: String },
  },
  { timestamps: true }
);

// Payroll Schema for Monthly Staff Salaries
const PayrollSchema = new Schema(
  {
    payrollId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeNic: { type: String, default: '' },
    month: { type: String, required: true, index: true }, // Format: YYYY-MM
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    advanceDeductions: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'BANK'], required: true },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    bankReference: { type: String, default: '' },
    sourceAccountId: { type: String, default: '' }, // Admin Business Bank Account used to pay
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING', index: true },
    paidAt: { type: Date },
    paidBy: { type: String },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Admin Business Bank Account Schema
const BankAccountSchema = new Schema(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    balance: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// Bank Transaction Schema to track deposits, withdrawals, transfers, and payouts
const BankTransactionSchema = new Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    accountId: { type: String, required: true, index: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'SALARY_PAYOUT', 'ADVANCE', 'CARD_SETTLEMENT', 'TRANSFER', 'EXPENSE'],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, default: '' },
    description: { type: String, required: true },
    performedBy: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export const EmployeeModel = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const FoodItemModel = mongoose.models.FoodItem || mongoose.model('FoodItem', FoodItemSchema);
export const DailyFoodAssignmentModel = mongoose.models.DailyFoodAssignment || mongoose.model('DailyFoodAssignment', DailyFoodAssignmentSchema);
export const FoodPreparationModel = mongoose.models.FoodPreparation || mongoose.model('FoodPreparation', FoodPreparationSchema);
export const BillModel = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
export const SaleModel = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export const DailySettlementModel = mongoose.models.DailySettlement || mongoose.model('DailySettlement', DailySettlementSchema);
export const AdvanceModel = mongoose.models.Advance || mongoose.model('Advance', AdvanceSchema);
export const StaffPurchaseModel = mongoose.models.StaffPurchase || mongoose.model('StaffPurchase', StaffPurchaseSchema);
export const ExpenseModel = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export const CashierClosingModel = mongoose.models.CashierClosing || mongoose.model('CashierClosing', CashierClosingSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const PayrollModel = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
export const BankAccountModel = mongoose.models.BankAccount || mongoose.model('BankAccount', BankAccountSchema);
export const BankTransactionModel = mongoose.models.BankTransaction || mongoose.model('BankTransaction', BankTransactionSchema);

// System Settings Schema (including Bill Settings)
const SystemSettingsSchema = new Schema(
  {
    settingId: { type: String, default: 'SYSTEM_SETTINGS', unique: true, index: true },
    shopName: { type: String, default: 'Hadabima Sri Lanka Food Shop' },
    tagline: { type: String, default: 'Authentic Traditional Food & Culinary Delights' },
    address: { type: String, default: 'No. 45, Kandy Road, Colombo, Sri Lanka' },
    contact: { type: String, default: '+94 11 234 5678' },
    contactSecondary: { type: String, default: '+94 81 238 8899' },
    email: { type: String, default: 'info@hadabima.gov.lk' },
    currency: { type: String, default: 'Rs.' },
    logoUrl: { type: String, default: '' },
    billSettings: {
      receiptTitle: { type: String, default: 'HADABIMA SRI LANKA' },
      receiptSubtitle: { type: String, default: 'AUTHENTIC FOOD SHOP MANAGEMENT' },
      receiptAddress: { type: String, default: 'No. 45, Kandy Road, Colombo' },
      receiptPhone: { type: String, default: 'Tel: +94 11 234 5678' },
      businessRegNumber: { type: String, default: 'BRN: HAD-GOV-2024/09' },
      showLogo: { type: Boolean, default: true },
      paperWidth: { type: String, enum: ['80mm', '58mm'], default: '80mm' },
      billPrefix: { type: String, default: 'BILL-' },
      showCashierName: { type: Boolean, default: true },
      showSaleType: { type: Boolean, default: true },
      showItemPriceBreakdown: { type: Boolean, default: true },
      showDateTime: { type: Boolean, default: true },
      enableTax: { type: Boolean, default: false },
      taxRate: { type: Number, default: 0 },
      enableServiceCharge: { type: Boolean, default: false },
      serviceChargeRate: { type: Number, default: 0 },
      footerThankYouNote: { type: String, default: '*** THANK YOU FOR VISITING ***' },
      footerNotice: { type: String, default: 'HADABIMA - TASTE OF SRI LANKA' },
      wifiDetails: { type: String, default: 'Free Wi-Fi: Hadabima_Guest' },
      showBarcode: { type: Boolean, default: true },
      autoPrint: { type: Boolean, default: false },
      printCopies: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

export const SystemSettingsModel =
  mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);



