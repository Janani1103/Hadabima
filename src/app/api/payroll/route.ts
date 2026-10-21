import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentDate = new Date().toISOString().split('T')[0];
    const currentMonth = currentDate.substring(0, 7); // e.g. "2026-10"
    const month = searchParams.get('month') || currentMonth;
    const employeeId = searchParams.get('employeeId') || undefined;

    const [allEmployees, savedPayrolls, allAdvances] = await Promise.all([
      Storage.getEmployees(),
      Storage.getPayrolls(month, employeeId),
      Storage.getAdvances(),
    ]);

    // Filter cashiers
    const cashiers = allEmployees.filter(
      (e: any) => e.employeeType === 'CASHIER' && (employeeId ? e.employeeId === employeeId : true)
    );

    // Map each cashier to a payroll record or computed draft
    const payrollItems = cashiers.map((cashier: any) => {
      const existing = savedPayrolls.find((p: any) => p.employeeId === cashier.employeeId);

      // Get pending advances for this cashier
      const cashierAdvances = allAdvances.filter(
        (a: any) => a.employeeId === cashier.employeeId
      );

      const approvedAdvances = cashierAdvances.filter((a: any) => a.status === 'APPROVED');
      const totalPendingAdvances = approvedAdvances.reduce(
        (sum: number, a: any) => sum + Number(a.remainingAmount || a.amount || 0),
        0
      );

      if (existing) {
        return {
          ...existing,
          isDraft: false,
          fullName: cashier.fullName,
          nic: cashier.nic,
          contactNumber: cashier.contactNumber1 || cashier.contactNumber || '',
          employeeStatus: cashier.status,
          pendingAdvancesList: approvedAdvances,
        };
      }

      // Draft payroll calculation
      const basicSalary = Number(cashier.basicSalary || 0);
      const advanceDeductions = totalPendingAdvances;
      const allowances = 0;
      const otherDeductions = 0;
      const netSalary = Math.max(0, basicSalary + allowances - advanceDeductions - otherDeductions);

      return {
        payrollId: `DRAFT-${cashier.employeeId}-${month}`,
        employeeId: cashier.employeeId,
        employeeName: cashier.fullName,
        fullName: cashier.fullName,
        employeeNic: cashier.nic,
        nic: cashier.nic,
        contactNumber: cashier.contactNumber1 || cashier.contactNumber || '',
        employeeStatus: cashier.status,
        month,
        basicSalary,
        allowances,
        advanceDeductions,
        otherDeductions,
        netSalary,
        paymentMethod: cashier.salaryPaymentMethod || 'CASH',
        bankName: cashier.bankName || '',
        bankBranch: cashier.bankBranch || '',
        bankAccountNumber: cashier.bankAccountNumber || '',
        bankAccountName: cashier.bankAccountName || cashier.fullName,
        bankReference: '',
        status: 'PENDING',
        paidAt: null,
        paidBy: '',
        notes: '',
        isDraft: true,
        pendingAdvancesList: approvedAdvances,
      };
    });

    // Summary calculations
    const totalBasic = payrollItems.reduce((sum: number, p: any) => sum + Number(p.basicSalary || 0), 0);
    const totalNet = payrollItems.reduce((sum: number, p: any) => sum + Number(p.netSalary || 0), 0);
    const totalAdvances = payrollItems.reduce((sum: number, p: any) => sum + Number(p.advanceDeductions || 0), 0);
    const paidItems = payrollItems.filter((p: any) => p.status === 'PAID');
    const totalPaid = paidItems.reduce((sum: number, p: any) => sum + Number(p.netSalary || 0), 0);
    const pendingCount = payrollItems.filter((p: any) => p.status !== 'PAID').length;
    const paidCount = paidItems.length;

    return NextResponse.json({
      success: true,
      month,
      items: payrollItems,
      summary: {
        totalBasic,
        totalNet,
        totalPaid,
        totalAdvances,
        paidCount,
        pendingCount,
        cashierCount: cashiers.length,
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
      month,
      basicSalary,
      allowances = 0,
      advanceDeductions = 0,
      otherDeductions = 0,
      paymentMethod,
      bankName,
      bankBranch,
      bankAccountNumber,
      bankAccountName,
      bankReference = '',
      notes = '',
      paidBy = 'Admin',
    } = body;

    if (!employeeId || !month) {
      return NextResponse.json({ error: 'Employee and month are required' }, { status: 400 });
    }

    const employee = await Storage.getEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if already paid
    const existingList = await Storage.getPayrolls(month, employeeId);
    const alreadyPaid = existingList.find((p: any) => p.status === 'PAID');
    if (alreadyPaid) {
      return NextResponse.json(
        { error: `Salary for ${employee.fullName} for ${month} is already paid (Ref: ${alreadyPaid.payrollId})` },
        { status: 400 }
      );
    }

    const calcNetSalary = Math.max(
      0,
      Number(basicSalary) + Number(allowances) - Number(advanceDeductions) - Number(otherDeductions)
    );

    const monthTag = month.replace('-', '');
    const count = (await Storage.getPayrolls()).length + 1;
    const payrollId = `PAY-${monthTag}-${String(count).padStart(3, '0')}`;

    const newPayroll = {
      payrollId,
      employeeId,
      employeeName: employee.fullName,
      employeeNic: employee.nic,
      month,
      basicSalary: Number(basicSalary),
      allowances: Number(allowances),
      advanceDeductions: Number(advanceDeductions),
      otherDeductions: Number(otherDeductions),
      netSalary: calcNetSalary,
      paymentMethod: paymentMethod || employee.salaryPaymentMethod || 'CASH',
      bankName: bankName || employee.bankName || '',
      bankBranch: bankBranch || employee.bankBranch || '',
      bankAccountNumber: bankAccountNumber || employee.bankAccountNumber || '',
      bankAccountName: bankAccountName || employee.bankAccountName || employee.fullName,
      bankReference,
      sourceAccountId: body.sourceAccountId || '',
      status: 'PAID',
      paidAt: new Date(),
      paidBy,
      notes,
    };

    await Storage.savePayroll(newPayroll);

    // If paid via BANK, deduct from the Admin's Business Bank Account
    if ((paymentMethod || employee.salaryPaymentMethod) === 'BANK') {
      const bankAccounts = await Storage.getBankAccounts();
      const targetAccount = body.sourceAccountId
        ? await Storage.getBankAccountById(body.sourceAccountId)
        : (bankAccounts.find((a: any) => a.isDefault) || bankAccounts[0]);

      if (targetAccount && calcNetSalary > 0) {
        const updatedAcc = await Storage.adjustBankBalance(targetAccount.accountId, -calcNetSalary);
        await Storage.saveBankTransaction({
          transactionId: `TXN-PAY-${monthTag}-${Date.now().toString().slice(-4)}`,
          accountId: targetAccount.accountId,
          bankName: targetAccount.bankName,
          accountNumber: targetAccount.accountNumber,
          type: 'SALARY_PAYOUT',
          amount: calcNetSalary,
          balanceAfter: Number(updatedAcc?.balance ?? targetAccount.balance),
          reference: bankReference || payrollId,
          description: `Month-End Salary: ${employee.fullName} (${month})`,
          performedBy: paidBy,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        });
      }
    }

    // If advance deductions were applied, mark employee's approved advances as deducted
    if (Number(advanceDeductions) > 0) {
      const allAdvances = await Storage.getAdvances(employeeId);
      const approvedAdvances = allAdvances.filter((a: any) => a.status === 'APPROVED');
      let remainingDeduction = Number(advanceDeductions);

      for (const adv of approvedAdvances) {
        if (remainingDeduction <= 0) break;
        const advRem = Number(adv.remainingAmount || adv.amount);
        if (advRem <= remainingDeduction) {
          remainingDeduction -= advRem;
          await Storage.updateAdvance(adv.advanceId, {
            status: 'DEDUCTED',
            remainingAmount: 0,
          });
        } else {
          await Storage.updateAdvance(adv.advanceId, {
            remainingAmount: advRem - remainingDeduction,
          });
          remainingDeduction = 0;
        }
      }
    }

    // Record an Expense entry for Financial Reporting
    const expenseId = `EXP-PAY-${monthTag}-${String(count).padStart(3, '0')}`;
    const payMethod = paymentMethod === 'BANK' ? 'ONLINE' : 'CASH';
    await Storage.saveExpense({
      expenseId,
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      description: `Cashier Salary: ${employee.fullName} (${month}) [${paymentMethod}]`,
      amount: calcNetSalary,
      paymentMethod: payMethod,
      addedBy: paidBy,
      status: 'ACTIVE',
    });

    // Audit Log
    await Storage.logAudit({
      user: paidBy,
      role: 'ADMIN',
      action: 'CASHIER_SALARY_PAID',
      module: 'Cashier Payroll',
      recordId: payrollId,
      previousValue: 'Status: PENDING',
      newValue: `Rs.${calcNetSalary} (${paymentMethod})`,
      details: `Paid month-end salary for ${employee.fullName} for ${month}. Basic: Rs.${basicSalary}, Deductions: Rs.${advanceDeductions + otherDeductions}, Net: Rs.${calcNetSalary}`,
    });

    return NextResponse.json({ success: true, payroll: newPayroll }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
