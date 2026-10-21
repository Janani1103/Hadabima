import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET() {
  try {
    const closings = await Storage.getCashierClosings();
    return NextResponse.json({ success: true, closings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { openingCash, actualCash, notes, cashierId, cashierName, date } = body;

    const closingDate = date || new Date().toISOString().split('T')[0];

    // Compute cash sales for today
    const bills = await Storage.getBills();
    const todayCashBills = bills.filter((b) => {
      const bDate = new Date(b.createdAt).toISOString().split('T')[0];
      return bDate === closingDate && b.status === 'COMPLETED' && b.paymentMethod === 'CASH';
    });
    const cashSales = todayCashBills.reduce((sum, b) => sum + Number(b.total), 0);

    // Compute cash expenses for today
    const expenses = await Storage.getExpenses(closingDate);
    const todayCashExpenses = expenses.filter((e) => e.paymentMethod === 'CASH' && e.status === 'ACTIVE');
    const cashExpenses = todayCashExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Compute cash advances disbursed from drawer for today
    const advances = await Storage.getAdvances();
    const todayCashAdvances = advances.filter(
      (a: any) =>
        a.date === closingDate &&
        (a.disbursementSource === 'CASH_DRAWER' || !a.disbursementSource) &&
        a.status !== 'CANCELLED'
    );
    const cashAdvances = todayCashAdvances.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);

    const otherCashReceipts = 0;
    const opening = Number(openingCash) || 0;
    const actual = Number(actualCash) || 0;

    // Expected Cash = Opening + Cash Sales - Cash Expenses - Cash Advances Given
    const expectedCash = opening + cashSales + otherCashReceipts - cashExpenses - cashAdvances;
    const difference = actual - expectedCash;

    const closingId = `CLS-${closingDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const closingRecord = {
      closingId,
      date: closingDate,
      cashierId: cashierId || 'EMP-002',
      cashierName: cashierName || 'Cashier',
      openingCash: opening,
      cashSales,
      otherCashReceipts,
      cashExpenses,
      cashAdvances,
      expectedCash,
      actualCash: actual,
      difference,
      notes: notes || '',
      createdAt: new Date(),
    };

    await Storage.saveCashierClosing(closingRecord);

    // If Cashier/Admin chose to deposit surplus cash into a Business Bank Account
    if (body.depositToBank && body.depositAccountId && Number(body.depositAmount) > 0) {
      const depAmt = Number(body.depositAmount);
      const targetAcc = await Storage.getBankAccountById(body.depositAccountId);
      if (targetAcc) {
        const updatedAcc = await Storage.adjustBankBalance(targetAcc.accountId, depAmt);
        await Storage.saveBankTransaction({
          transactionId: `TXN-CLS-${Date.now().toString().slice(-6)}`,
          accountId: targetAcc.accountId,
          bankName: targetAcc.bankName,
          accountNumber: targetAcc.accountNumber,
          type: 'DEPOSIT',
          amount: depAmt,
          balanceAfter: Number(updatedAcc?.balance ?? targetAcc.balance),
          reference: closingId,
          description: `Daily Cash Closing surplus deposit by ${cashierName || 'Cashier'}`,
          performedBy: cashierName || 'Cashier',
          date: closingDate,
          createdAt: new Date(),
        });
      }
    }

    await Storage.logAudit({
      user: cashierName || 'Cashier',
      role: 'CASHIER',
      action: 'DAILY_CASH_CLOSING',
      module: 'Cashier Closing',
      recordId: closingId,
      previousValue: '',
      newValue: `Actual: Rs.${actual}, Expected: Rs.${expectedCash}, Diff: Rs.${difference}`,
      details: notes || `Cashier end of day closing performed for ${closingDate}`,
    });

    return NextResponse.json({ success: true, closing: closingRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
