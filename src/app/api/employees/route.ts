import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET() {
  try {
    const employees = await Storage.getEmployees();
    // Exclude plain password from standard listings
    const sanitized = employees.map((e: any) => ({
      employeeId: e.employeeId,
      fullName: e.fullName,
      nic: e.nic,
      contactNumber: e.contactNumber,
      contactNumber1: e.contactNumber1 || e.contactNumber || '',
      contactNumber2: e.contactNumber2 || '',
      emergencyContact: e.emergencyContact || '',
      address: e.address,
      employeeType: e.employeeType,
      joinDate: e.joinDate,
      basicSalary: e.basicSalary,
      salaryPaymentMethod: e.salaryPaymentMethod || 'CASH',
      bankName: e.bankName || '',
      bankBranch: e.bankBranch || '',
      bankAccountNumber: e.bankAccountNumber || '',
      bankAccountName: e.bankAccountName || '',
      username: e.username,
      commissionRate: e.commissionRate,
      status: e.status,
    }));
    return NextResponse.json({ success: true, employees: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      nic,
      contactNumber,
      contactNumber1,
      contactNumber2,
      emergencyContact,
      address,
      employeeType,
      joinDate,
      basicSalary,
      salaryPaymentMethod,
      bankName,
      bankBranch,
      bankAccountNumber,
      bankAccountName,
      username,
      password,
      actorUser,
    } = body;

    if (!fullName || !username || !password || !employeeType) {
      return NextResponse.json({ error: 'Full name, username, password and role are required' }, { status: 400 });
    }

    const existing = await Storage.getEmployeeByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already in use' }, { status: 400 });
    }

    // Auto-generate sequential Employee ID: EMP0001, EMP0002, etc.
    const allEmployees = await Storage.getEmployees();
    let maxNum = 0;
    allEmployees.forEach((e: any) => {
      const match = (e.employeeId || '').match(/EMP-?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const generatedId = `EMP${String(nextNum).padStart(4, '0')}`;
    const employeeId = body.employeeId || generatedId;

    const primaryPhone = contactNumber1 || contactNumber || 'N/A';
    const isCashier = employeeType === 'CASHIER';
    const paymentMode = isCashier ? (salaryPaymentMethod || 'CASH') : 'CASH';

    const newEmp = {
      employeeId,
      fullName,
      nic: nic || 'N/A',
      contactNumber: primaryPhone,
      contactNumber1: primaryPhone,
      contactNumber2: contactNumber2 || '',
      emergencyContact: emergencyContact || '',
      address: address || 'N/A',
      employeeType,
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      // Basic salary & Bank details are applied only for Cashier role
      basicSalary: isCashier ? (Number(basicSalary) || 0) : 0,
      salaryPaymentMethod: paymentMode,
      bankName: isCashier && paymentMode === 'BANK' ? (bankName || '') : '',
      bankBranch: isCashier && paymentMode === 'BANK' ? (bankBranch || '') : '',
      bankAccountNumber: isCashier && paymentMode === 'BANK' ? (bankAccountNumber || '') : '',
      bankAccountName: isCashier && paymentMode === 'BANK' ? (bankAccountName || '') : '',
      username,
      password,
      // Commission field removed from modal, defaults to 10% for Kitchen
      commissionRate: employeeType === 'KITCHEN' ? 10 : 0,
      status: 'ACTIVE',
    };

    await Storage.saveEmployee(newEmp);

    await Storage.logAudit({
      user: actorUser || 'Admin',
      role: 'ADMIN',
      action: 'EMPLOYEE_CREATED',
      module: 'Employees',
      recordId: employeeId,
      previousValue: '',
      newValue: `${fullName} (${employeeType})`,
      details: `Registered employee with commission ${newEmp.commissionRate}%`,
    });

    return NextResponse.json({ success: true, employee: newEmp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, updates, actorUser } = body;

    if (!employeeId || !updates) {
      return NextResponse.json({ error: 'Employee ID and updates required' }, { status: 400 });
    }

    const existing = await Storage.getEmployeeById(employeeId);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const prevComm = existing.commissionRate;
    const prevStatus = existing.status;

    const updated = await Storage.updateEmployee(employeeId, updates);

    // Audit changes
    if (updates.commissionRate !== undefined && updates.commissionRate !== prevComm) {
      await Storage.logAudit({
        user: actorUser || 'Admin',
        role: 'ADMIN',
        action: 'COMMISSION_CHANGE',
        module: 'Employees',
        recordId: employeeId,
        previousValue: `Commission: ${prevComm}%`,
        newValue: `Commission: ${updates.commissionRate}%`,
        details: `Updated commission rate for ${existing.fullName}`,
      });
    }

    if (updates.status !== undefined && updates.status !== prevStatus) {
      await Storage.logAudit({
        user: actorUser || 'Admin',
        role: 'ADMIN',
        action: updates.status === 'ACTIVE' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
        module: 'Employees',
        recordId: employeeId,
        previousValue: `Status: ${prevStatus}`,
        newValue: `Status: ${updates.status}`,
        details: `Toggled active status for ${existing.fullName} without hard deleting history`,
      });
    }

    if (updates.fullName || updates.contactNumber1 || updates.emergencyContact || updates.address || updates.basicSalary !== undefined) {
      await Storage.logAudit({
        user: actorUser || 'Admin',
        role: 'ADMIN',
        action: 'EMPLOYEE_PROFILE_UPDATED',
        module: 'Employees',
        recordId: employeeId,
        previousValue: existing.fullName,
        newValue: updates.fullName || existing.fullName,
        details: `Updated profile details for employee ${employeeId}`,
      });
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
