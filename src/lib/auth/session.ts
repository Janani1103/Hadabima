export interface AuthUser {
  employeeId: string;
  fullName: string;
  username: string;
  employeeType: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  commissionRate: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const DEMO_CREDENTIALS = [
  {
    role: 'ADMIN',
    username: 'admin',
    password: 'admin123',
    name: 'Janani Nethma (Admin)',
    description: 'Full business overview, commission setup, settlements, finance, audit',
  },
  {
    role: 'CASHIER',
    username: 'cashier',
    password: 'cashier123',
    name: 'Kasun Perera (Cashier)',
    description: 'POS sales, staff sales, food item pricing, daily food assignments, closing',
  },
  {
    role: 'KITCHEN',
    username: 'amal',
    password: 'amal123',
    name: 'Amal Silva (Kitchen Staff)',
    description: 'Assigned items, preparation, expiry monitoring, personal earnings & settlements',
  },
];
