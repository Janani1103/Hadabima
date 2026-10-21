import fs from 'fs';
import path from 'path';
import { initialSeedData } from './seedData';
import { connectToDatabase } from './mongodb';
import {
  EmployeeModel,
  FoodItemModel,
  DailyFoodAssignmentModel,
  FoodPreparationModel,
  BillModel,
  SaleModel,
  DailySettlementModel,
  AdvanceModel,
  StaffPurchaseModel,
  ExpenseModel,
  CashierClosingModel,
  AuditLogModel,
  PayrollModel,
  BankAccountModel,
  BankTransactionModel,
  SystemSettingsModel,
} from './models';
import { SystemSettings } from '../types/settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hadabima_db.json');

// In-memory / file cache
type DatabaseStore = typeof initialSeedData;
let memoryStore: DatabaseStore | null = null;

function ensureDataFile(): DatabaseStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf-8');
    memoryStore = JSON.parse(JSON.stringify(initialSeedData));
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryStore = JSON.parse(content);
    } catch {
      memoryStore = JSON.parse(JSON.stringify(initialSeedData));
    }
  }

  return memoryStore!;
}

function persistFileStore() {
  if (memoryStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting file store:', e);
    }
  }
}

export const Storage = {
  // Reset / Seed Data
  async resetDatabase() {
    memoryStore = JSON.parse(JSON.stringify(initialSeedData));
    persistFileStore();

    const mongoose = await connectToDatabase();
    if (mongoose) {
      await EmployeeModel.deleteMany({});
      await FoodItemModel.deleteMany({});
      await DailyFoodAssignmentModel.deleteMany({});
      await FoodPreparationModel.deleteMany({});
      await BillModel.deleteMany({});
      await SaleModel.deleteMany({});
      await DailySettlementModel.deleteMany({});
      await AdvanceModel.deleteMany({});
      await StaffPurchaseModel.deleteMany({});
      await ExpenseModel.deleteMany({});
      await CashierClosingModel.deleteMany({});
      await AuditLogModel.deleteMany({});
      await PayrollModel.deleteMany({});
      await BankAccountModel.deleteMany({});
      await BankTransactionModel.deleteMany({});
      await SystemSettingsModel.deleteMany({});

      await EmployeeModel.insertMany(initialSeedData.employees);
      await FoodItemModel.insertMany(initialSeedData.foodItems);
      await DailyFoodAssignmentModel.insertMany(initialSeedData.dailyAssignments);
      await FoodPreparationModel.insertMany(initialSeedData.foodPreparations);
      await BillModel.insertMany(initialSeedData.bills);
      await SaleModel.insertMany(initialSeedData.sales);
      await DailySettlementModel.insertMany(initialSeedData.dailySettlements);
      await AdvanceModel.insertMany(initialSeedData.advances);
      await StaffPurchaseModel.insertMany(initialSeedData.staffPurchases);
      await ExpenseModel.insertMany(initialSeedData.expenses);
      await CashierClosingModel.insertMany(initialSeedData.cashierClosings);
      await AuditLogModel.insertMany(initialSeedData.auditLogs);
      await PayrollModel.insertMany(initialSeedData.payrolls);
      await BankAccountModel.insertMany(initialSeedData.bankAccounts);
      await BankTransactionModel.insertMany(initialSeedData.bankTransactions);
      await SystemSettingsModel.create({
        settingId: 'SYSTEM_SETTINGS',
        ...initialSeedData.settings,
      });
    }
    return true;
  },

  // EMPLOYEES
  async getEmployees() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const count = await EmployeeModel.countDocuments();
      if (count === 0) {
        await EmployeeModel.insertMany(initialSeedData.employees);
      }
      return await EmployeeModel.find().lean();
    }
    const store = ensureDataFile();
    return store.employees;
  },

  async getEmployeeById(id: string) {
    const list = await this.getEmployees();
    return list.find((e: any) => e.employeeId === id) || null;
  },

  async getEmployeeByUsername(username: string) {
    const list = await this.getEmployees();
    return list.find((e: any) => e.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async saveEmployee(employee: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await EmployeeModel.create(employee);
    }
    const store = ensureDataFile();
    store.employees.push(employee);
    persistFileStore();
    return employee;
  },

  async updateEmployee(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await EmployeeModel.updateOne({ employeeId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.employees.findIndex((e) => e.employeeId === id);
    if (index !== -1) {
      store.employees[index] = { ...store.employees[index], ...updates };
      persistFileStore();
      return store.employees[index];
    }
    return null;
  },

  // FOOD ITEMS
  async getFoodItems() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const count = await FoodItemModel.countDocuments();
      if (count === 0) {
        await FoodItemModel.insertMany(initialSeedData.foodItems);
      }
      return await FoodItemModel.find().lean();
    }
    const store = ensureDataFile();
    return store.foodItems;
  },

  async getFoodItemById(id: string) {
    const list = await this.getFoodItems();
    return list.find((f: any) => f.foodItemId === id) || null;
  },

  async saveFoodItem(item: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await FoodItemModel.create(item);
    }
    const store = ensureDataFile();
    store.foodItems.push(item);
    persistFileStore();
    return item;
  },

  async updateFoodItem(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await FoodItemModel.updateOne({ foodItemId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.foodItems.findIndex((f) => f.foodItemId === id);
    if (index !== -1) {
      store.foodItems[index] = { ...store.foodItems[index], ...updates };
      persistFileStore();
      return store.foodItems[index];
    }
    return null;
  },

  // DAILY FOOD ASSIGNMENTS
  async getAssignments(date?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query = date ? { date } : {};
      return await DailyFoodAssignmentModel.find(query).lean();
    }
    const store = ensureDataFile();
    if (date) {
      return store.dailyAssignments.filter((a) => a.date === date);
    }
    return store.dailyAssignments;
  },

  async saveAssignment(assignment: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await DailyFoodAssignmentModel.create(assignment);
    }
    const store = ensureDataFile();
    store.dailyAssignments.push(assignment);
    persistFileStore();
    return assignment;
  },

  async updateAssignment(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await DailyFoodAssignmentModel.updateOne({ assignmentId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.dailyAssignments.findIndex((a) => a.assignmentId === id);
    if (index !== -1) {
      store.dailyAssignments[index] = { ...store.dailyAssignments[index], ...updates };
      persistFileStore();
      return store.dailyAssignments[index];
    }
    return null;
  },

  async deleteAssignment(id: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await DailyFoodAssignmentModel.deleteOne({ assignmentId: id });
    }
    const store = ensureDataFile();
    const index = store.dailyAssignments.findIndex((a) => a.assignmentId === id);
    if (index !== -1) {
      const removed = store.dailyAssignments.splice(index, 1)[0];
      persistFileStore();
      return removed;
    }
    return null;
  },

  // FOOD PREPARATIONS
  async getPreparations(date?: string, kitchenStaffId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query: any = {};
      if (date) query.date = date;
      if (kitchenStaffId) query.kitchenStaffId = kitchenStaffId;
      return await FoodPreparationModel.find(query).lean();
    }
    const store = ensureDataFile();
    return store.foodPreparations.filter((p) => {
      let matches = true;
      if (date && p.date !== date) matches = false;
      if (kitchenStaffId && p.kitchenStaffId !== kitchenStaffId) matches = false;
      return matches;
    });
  },

  async savePreparation(prep: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await FoodPreparationModel.create(prep);
    }
    const store = ensureDataFile();
    store.foodPreparations.push(prep);
    persistFileStore();
    return prep;
  },

  async updatePreparation(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await FoodPreparationModel.updateOne({ preparationId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.foodPreparations.findIndex((p) => p.preparationId === id);
    if (index !== -1) {
      store.foodPreparations[index] = { ...store.foodPreparations[index], ...updates };
      persistFileStore();
      return store.foodPreparations[index];
    }
    return null;
  },

  // BILLS
  async getBills() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      return await BillModel.find().sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    return [...store.bills].reverse();
  },

  async saveBill(bill: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BillModel.create(bill);
    }
    const store = ensureDataFile();
    store.bills.push(bill);
    persistFileStore();
    return bill;
  },

  async voidBill(billId: string, voidReason: string, voidedBy: string) {
    const updates = {
      status: 'VOIDED',
      voidReason,
      voidedBy,
      voidedAt: new Date(),
    };
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BillModel.updateOne({ billId }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.bills.findIndex((b) => b.billId === billId);
    if (index !== -1) {
      store.bills[index] = { ...store.bills[index], ...updates };
      persistFileStore();
      return store.bills[index];
    }
    return null;
  },

  // SALES
  async getSales(date?: string, kitchenStaffId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query: any = {};
      if (date) query.date = date;
      if (kitchenStaffId) query.kitchenStaffId = kitchenStaffId;
      return await SaleModel.find(query).lean();
    }
    const store = ensureDataFile();
    return store.sales.filter((s) => {
      let matches = true;
      if (date && s.date !== date) matches = false;
      if (kitchenStaffId && s.kitchenStaffId !== kitchenStaffId) matches = false;
      return matches;
    });
  },

  async saveSale(sale: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await SaleModel.create(sale);
    }
    const store = ensureDataFile();
    store.sales.push(sale);
    persistFileStore();
    return sale;
  },

  async removeSalesByBillId(billId: string, billNumber?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await SaleModel.deleteMany({
        $or: [{ billId }, { billId: billNumber }],
      });
    }
    const store = ensureDataFile();
    store.sales = store.sales.filter(
      (s: any) => s.billId !== billId && s.billId !== billNumber
    );
    persistFileStore();
  },

  // DAILY SETTLEMENTS
  async getSettlements(date?: string, kitchenStaffId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query: any = {};
      if (date) query.date = date;
      if (kitchenStaffId) query.kitchenStaffId = kitchenStaffId;
      return await DailySettlementModel.find(query).sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    return store.dailySettlements.filter((s) => {
      let matches = true;
      if (date && s.date !== date) matches = false;
      if (kitchenStaffId && s.kitchenStaffId !== kitchenStaffId) matches = false;
      return matches;
    });
  },

  async saveSettlement(settlement: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await DailySettlementModel.create(settlement);
    }
    const store = ensureDataFile();
    store.dailySettlements.push(settlement);
    persistFileStore();
    return settlement;
  },

  async updateSettlement(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await DailySettlementModel.updateOne({ settlementId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.dailySettlements.findIndex((s) => s.settlementId === id);
    if (index !== -1) {
      store.dailySettlements[index] = { ...store.dailySettlements[index], ...updates };
      persistFileStore();
      return store.dailySettlements[index];
    }
    return null;
  },

  // ADVANCES
  async getAdvances(employeeId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query = employeeId ? { employeeId } : {};
      return await AdvanceModel.find(query).lean();
    }
    const store = ensureDataFile();
    if (employeeId) {
      return store.advances.filter((a) => a.employeeId === employeeId);
    }
    return store.advances;
  },

  async saveAdvance(advance: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await AdvanceModel.create(advance);
    }
    const store = ensureDataFile();
    store.advances.push(advance);
    persistFileStore();
    return advance;
  },

  async updateAdvance(id: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await AdvanceModel.updateOne({ advanceId: id }, { $set: updates });
    }
    const store = ensureDataFile();
    const index = store.advances.findIndex((a) => a.advanceId === id);
    if (index !== -1) {
      store.advances[index] = { ...store.advances[index], ...updates };
      persistFileStore();
      return store.advances[index];
    }
    return null;
  },

  // STAFF PURCHASES
  async getStaffPurchases(employeeId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query = employeeId ? { employeeId } : {};
      return await StaffPurchaseModel.find(query).lean();
    }
    const store = ensureDataFile();
    if (employeeId) {
      return store.staffPurchases.filter((p) => p.employeeId === employeeId);
    }
    return store.staffPurchases;
  },

  async saveStaffPurchase(purchase: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await StaffPurchaseModel.create(purchase);
    }
    const store = ensureDataFile();
    store.staffPurchases.push(purchase);
    persistFileStore();
    return purchase;
  },

  async removeStaffPurchasesByBillId(billId: string, billNumber?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await StaffPurchaseModel.deleteMany({
        $or: [{ billId }, { billId: billNumber }],
      });
    }
    const store = ensureDataFile();
    store.staffPurchases = (store.staffPurchases || []).filter(
      (p: any) => p.billId !== billId && p.billId !== billNumber
    );
    persistFileStore();
  },

  // EXPENSES
  async getExpenses(date?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query = date ? { date } : {};
      return await ExpenseModel.find(query).sort({ date: -1, createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    store.expenses = store.expenses || [];
    if (date) {
      return store.expenses.filter((e: any) => e.date === date).reverse();
    }
    return [...store.expenses].reverse();
  },

  async saveExpense(expense: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await ExpenseModel.create(expense);
    }
    const store = ensureDataFile();
    store.expenses = store.expenses || [];
    store.expenses.push(expense);
    persistFileStore();
    return expense;
  },

  async updateExpense(expenseId: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await ExpenseModel.updateOne({ expenseId }, { $set: updates });
    }
    const store = ensureDataFile();
    store.expenses = store.expenses || [];
    const index = store.expenses.findIndex((e: any) => e.expenseId === expenseId);
    if (index !== -1) {
      store.expenses[index] = { ...store.expenses[index], ...updates };
      persistFileStore();
      return store.expenses[index];
    }
    return null;
  },

  async deleteExpense(expenseId: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await ExpenseModel.deleteOne({ expenseId });
    }
    const store = ensureDataFile();
    store.expenses = store.expenses || [];
    const index = store.expenses.findIndex((e: any) => e.expenseId === expenseId);
    if (index !== -1) {
      const removed = store.expenses.splice(index, 1)[0];
      persistFileStore();
      return removed;
    }
    return null;
  },

  // CASHIER CLOSINGS
  async getCashierClosings() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      return await CashierClosingModel.find().sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    store.cashierClosings = store.cashierClosings || [];
    return [...store.cashierClosings].reverse();
  },

  async saveCashierClosing(closing: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await CashierClosingModel.create(closing);
    }
    const store = ensureDataFile();
    store.cashierClosings = store.cashierClosings || [];
    store.cashierClosings.push(closing);
    persistFileStore();
    return closing;
  },

  // AUDIT LOGS
  async getAuditLogs() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      return await AuditLogModel.find().sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    return [...store.auditLogs].reverse();
  },

  async logAudit(entry: {
    user: string;
    role: string;
    action: string;
    module: string;
    recordId: string;
    previousValue?: string;
    newValue?: string;
    details?: string;
  }) {
    const auditRecord = {
      auditId: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...entry,
      createdAt: new Date(),
    };

    const mongoose = await connectToDatabase();
    if (mongoose) {
      await AuditLogModel.create(auditRecord);
    }
    const store = ensureDataFile();
    store.auditLogs.push(auditRecord as any);
    persistFileStore();
    return auditRecord;
  },

  // PAYROLL (CASHIER & MONTHLY SALARIES)
  async getPayrolls(month?: string, employeeId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query: any = {};
      if (month) query.month = month;
      if (employeeId) query.employeeId = employeeId;
      return await PayrollModel.find(query).sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    store.payrolls = store.payrolls || [];
    return store.payrolls.filter((p: any) => {
      let matches = true;
      if (month && p.month !== month) matches = false;
      if (employeeId && p.employeeId !== employeeId) matches = false;
      return matches;
    });
  },

  async savePayroll(payroll: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await PayrollModel.create(payroll);
    }
    const store = ensureDataFile();
    store.payrolls = store.payrolls || [];
    store.payrolls.push(payroll);
    persistFileStore();
    return payroll;
  },

  async updatePayroll(payrollId: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await PayrollModel.updateOne({ payrollId }, { $set: updates });
    }
    const store = ensureDataFile();
    store.payrolls = store.payrolls || [];
    const index = store.payrolls.findIndex((p: any) => p.payrollId === payrollId);
    if (index !== -1) {
      store.payrolls[index] = { ...store.payrolls[index], ...updates };
      persistFileStore();
      return store.payrolls[index];
    }
    return null;
  },

  // BUSINESS BANK ACCOUNTS
  async getBankAccounts() {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      return await BankAccountModel.find().sort({ createdAt: 1 }).lean();
    }
    const store = ensureDataFile();
    return store.bankAccounts || [];
  },

  async getBankAccountById(accountId: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      return await BankAccountModel.findOne({ accountId }).lean();
    }
    const store = ensureDataFile();
    return (store.bankAccounts || []).find((a: any) => a.accountId === accountId) || null;
  },

  async saveBankAccount(account: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BankAccountModel.create(account);
    }
    const store = ensureDataFile();
    store.bankAccounts = store.bankAccounts || [];
    store.bankAccounts.push(account);
    persistFileStore();
    return account;
  },

  async updateBankAccount(accountId: string, updates: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BankAccountModel.updateOne({ accountId }, { $set: updates });
    }
    const store = ensureDataFile();
    store.bankAccounts = store.bankAccounts || [];
    const index = store.bankAccounts.findIndex((a: any) => a.accountId === accountId);
    if (index !== -1) {
      store.bankAccounts[index] = { ...store.bankAccounts[index], ...updates };
      persistFileStore();
      return store.bankAccounts[index];
    }
    return null;
  },

  async adjustBankBalance(accountId: string, delta: number) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BankAccountModel.updateOne({ accountId }, { $inc: { balance: delta } });
    }
    const store = ensureDataFile();
    store.bankAccounts = store.bankAccounts || [];
    const index = store.bankAccounts.findIndex((a: any) => a.accountId === accountId);
    if (index !== -1) {
      store.bankAccounts[index].balance = Number(store.bankAccounts[index].balance || 0) + delta;
      persistFileStore();
      return store.bankAccounts[index];
    }
    return null;
  },

  // BANK TRANSACTIONS
  async getBankTransactions(accountId?: string) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const query = accountId ? { accountId } : {};
      return await BankTransactionModel.find(query).sort({ createdAt: -1 }).lean();
    }
    const store = ensureDataFile();
    store.bankTransactions = store.bankTransactions || [];
    if (accountId) {
      return store.bankTransactions.filter((t: any) => t.accountId === accountId).reverse();
    }
    return [...store.bankTransactions].reverse();
  },

  async saveBankTransaction(transaction: any) {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      await BankTransactionModel.create(transaction);
    }
    const store = ensureDataFile();
    store.bankTransactions = store.bankTransactions || [];
    store.bankTransactions.push(transaction);
    persistFileStore();
    return transaction;
  },

  // SYSTEM & BILL SETTINGS
  async getSettings(): Promise<SystemSettings> {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      let settings = await SystemSettingsModel.findOne({ settingId: 'SYSTEM_SETTINGS' }).lean();
      if (!settings) {
        settings = await SystemSettingsModel.create({
          settingId: 'SYSTEM_SETTINGS',
          ...initialSeedData.settings,
        });
        return JSON.parse(JSON.stringify(settings));
      }
      return settings as any;
    }
    const store = ensureDataFile() as any;
    if (!store.settings) {
      store.settings = JSON.parse(JSON.stringify(initialSeedData.settings));
      persistFileStore();
    }
    return store.settings;
  },

  async updateSettings(updatedData: Partial<SystemSettings>): Promise<SystemSettings> {
    const mongoose = await connectToDatabase();
    if (mongoose) {
      const existing = await SystemSettingsModel.findOne({ settingId: 'SYSTEM_SETTINGS' }).lean();
      const merged = {
        ...(existing || initialSeedData.settings),
        ...updatedData,
        billSettings: {
          ...((existing && (existing as any).billSettings) || initialSeedData.settings.billSettings),
          ...(updatedData.billSettings || {}),
        },
      };

      const saved = await SystemSettingsModel.findOneAndUpdate(
        { settingId: 'SYSTEM_SETTINGS' },
        { $set: merged },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      return saved as any;
    }
    const store = ensureDataFile() as any;
    store.settings = {
      ...(store.settings || initialSeedData.settings),
      ...updatedData,
      billSettings: {
        ...((store.settings && store.settings.billSettings) || initialSeedData.settings.billSettings),
        ...(updatedData.billSettings || {}),
      },
    };
    persistFileStore();
    return store.settings;
  },
};
