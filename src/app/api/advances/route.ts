import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const [advances, employees] = await Promise.all([
      Storage.getAdvances(employeeId),
      Storage.getEmployees(),
    ]);

    const empMap = new Map<string, any>(employees.map((e: any) => [e.employeeId, e]));

    const enrichedAdvances = advances
      .filter((a: any) => (status ? a.status === status : true))
      .map((a: any) => {
        const emp = empMap.get(a.employeeId);
        return {
          ...a,
          employeeRole: emp?.employeeType || a.employeeRole || 'STAFF',
          employeeNic: emp?.nic || '',
          contactNumber: emp?.contactNumber1 || emp?.contactNumber || '',
        };
      })
      .reverse();

    // Summary metrics
    const totalGranted = enrichedAdvances.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
    const pendingRecovery = enrichedAdvances
      .filter((a: any) => a.status === 'APPROVED' || a.status === 'PENDING')
      .reduce((sum: number, a: any) => sum + Number(a.remainingAmount ?? a.amount ?? 0), 0);
    const totalDeducted = enrichedAdvances
      .filter((a: any) => a.status === 'DEDUCTED')
      .reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);

    return NextResponse.json({
      success: true,
      advances: enrichedAdvances,
      summary: {
        totalGranted,
        pendingRecovery,
        totalDeducted,
        activeCount: enrichedAdvances.filter((a: any) => a.status === 'APPROVED').length,
        settledCount: enrichedAdvances.filter((a: any) => a.status === 'DEDUCTED').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      amount,
      reason,
      approvedBy,
      date,
      disbursementSource = 'CASH_DRAWER',
      sourceAccountId = '',
    } = body;

    if (!employeeId || !amount || !reason) {
      return NextResponse.json({ error: 'Employee, amount, and reason are required' }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Advance amount must be greater than 0' }, { status: 400 });
    }

    const employee = await Storage.getEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const count = (await Storage.getAdvances()).length + 1;
    const advanceId = `ADV-${String(count).padStart(3, '0')}`;
    const numAmount = Number(amount);

    const newAdvance = {
      advanceId,
      employeeId,
      employeeName: employee.fullName,
      employeeRole: employee.employeeType,
      date: date || new Date().toISOString().split('T')[0],
      amount: numAmount,
      reason,
      disbursementSource,
      sourceAccountId,
      approvedBy: approvedBy || 'Admin',
      status: 'APPROVED',
      remainingAmount: numAmount,
    };

    await Storage.saveAdvance(newAdvance);

    // If disbursed through a Business Bank Account, deduct bank balance
    if (disbursementSource === 'BANK_ACCOUNT' && sourceAccountId) {
      const bankAccount = await Storage.getBankAccountById(sourceAccountId);
      if (bankAccount) {
        const updatedAcc = await Storage.adjustBankBalance(sourceAccountId, -numAmount);
        await Storage.saveBankTransaction({
          transactionId: `TXN-ADV-${Date.now().toString().slice(-6)}`,
          accountId: sourceAccountId,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          type: 'ADVANCE',
          amount: numAmount,
          balanceAfter: Number(updatedAcc?.balance ?? bankAccount.balance),
          reference: advanceId,
          description: `Salary Advance: ${employee.fullName} (${employee.employeeType})`,
          performedBy: approvedBy || 'Admin',
          date: date || new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        });
      }
    }

    await Storage.logAudit({
      user: approvedBy || 'Admin',
      role: 'ADMIN',
      action: 'ADVANCE_GRANTED',
      module: 'Employee Advances',
      recordId: advanceId,
      previousValue: '',
      newValue: `Rs.${amount} for ${employee.fullName} (${employee.employeeType})`,
      details: `Reason: ${reason}`,
    });

    return NextResponse.json({ success: true, advance: newAdvance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const advanceId = searchParams.get('advanceId');

    if (!advanceId) {
      return NextResponse.json({ error: 'Advance ID is required' }, { status: 400 });
    }

    const advance = await Storage.updateAdvance(advanceId, { status: 'CANCELLED', remainingAmount: 0 });
    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    await Storage.logAudit({
      user: 'Admin',
      role: 'ADMIN',
      action: 'ADVANCE_CANCELLED',
      module: 'Employee Advances',
      recordId: advanceId,
      previousValue: `Rs.${advance.amount}`,
      newValue: 'Status: CANCELLED',
      details: `Cancelled advance record ${advanceId}`,
    });

    return NextResponse.json({ success: true, advance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
