import { DEFAULT_SYSTEM_SETTINGS } from '../types/settings';

export const initialSeedData = {
  employees: [
    {
      employeeId: "EMP-001",
      fullName: "Janani Nethma",
      nic: "199512345678",
      contactNumber: "0771234567",
      address: "No. 45, Kandy Road, Colombo",
      employeeType: "ADMIN",
      joinDate: "2024-01-10",
      basicSalary: 85000,
      username: "admin",
      password: "admin123",
      commissionRate: 0,
      status: "ACTIVE",
    },
  ],

  foodItems: [] as any[],

  dailyAssignments: [] as any[],

  foodPreparations: [] as any[],

  bills: [] as any[],

  sales: [] as any[],

  advances: [] as any[],

  staffPurchases: [] as any[],

  dailySettlements: [] as any[],

  expenses: [] as any[],

  cashierClosings: [] as any[],

  auditLogs: [] as any[],

  payrolls: [] as any[],

  bankAccounts: [] as any[],

  bankTransactions: [] as any[],

  settings: DEFAULT_SYSTEM_SETTINGS,
};
