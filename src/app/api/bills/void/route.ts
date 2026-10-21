import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { billId, reason, voidedBy, userRole } = body;

    if (!billId || !reason) {
      return NextResponse.json({ error: 'Bill ID and void reason are required' }, { status: 400 });
    }

    const bills = await Storage.getBills();
    const existing = bills.find((b) => b.billId === billId);

    if (!existing) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (existing.status === 'VOIDED') {
      return NextResponse.json({ error: 'Bill is already voided' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const billDate = existing.createdAt
      ? new Date(existing.createdAt).toISOString().split('T')[0]
      : todayStr;

    // 1. Mark bill as VOIDED in store
    const updated = await Storage.voidBill(billId, reason, voidedBy || 'Cashier');

    // 2. RESTORE FOOD ITEM QUANTITIES (Reverse Sold Qty, Increase Remaining Qty)
    let preparations = await Storage.getPreparations(billDate);
    if (preparations.length === 0 && billDate !== todayStr) {
      preparations = await Storage.getPreparations(todayStr);
    }

    const restoredItemsSummary: string[] = [];
    if (existing.items && Array.isArray(existing.items)) {
      for (const item of existing.items) {
        const prepBatch =
          preparations.find(
            (p) =>
              p.foodItemId === item.foodItemId &&
              (item.kitchenStaffId ? p.kitchenStaffId === item.kitchenStaffId : true)
          ) || preparations.find((p) => p.foodItemId === item.foodItemId);

        if (prepBatch) {
          const qty = Number(item.quantity) || 0;
          const newSold = Math.max(0, (prepBatch.soldQuantity || 0) - qty);
          const newRemaining = Math.max(
            0,
            (prepBatch.preparedQuantity || 0) - newSold - (prepBatch.wastageQuantity || 0)
          );
          await Storage.updatePreparation(prepBatch.preparationId, {
            soldQuantity: newSold,
            remainingQuantity: newRemaining,
          });
          restoredItemsSummary.push(`${item.foodItemName} (+${qty})`);
        }
      }
    }

    // 3. ADJUST CASH OR BANK BALANCE ACCORDING TO PAYMENT METHOD
    let financialAdjustmentNote = '';
    const totalAmount = Number(existing.total) || 0;

    if (
      (existing.paymentMethod === 'CARD' || existing.paymentMethod === 'ONLINE') &&
      existing.bankAccountId
    ) {
      const bankAccount = await Storage.getBankAccountById(existing.bankAccountId);
      if (bankAccount) {
        // Deduct from company bank balance (reverting previous credit)
        const updatedAcc = await Storage.adjustBankBalance(existing.bankAccountId, -totalAmount);

        // Record Bank Reversal Transaction
        await Storage.saveBankTransaction({
          transactionId: `TXN-VOID-${Date.now().toString().slice(-6)}`,
          accountId: existing.bankAccountId,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          type: 'WITHDRAWAL',
          amount: totalAmount,
          balanceAfter: Number(updatedAcc?.balance ?? (bankAccount.balance - totalAmount)),
          reference: existing.billNumber,
          description: `Void Reversal for Bill ${existing.billNumber} (${reason})`,
          performedBy: voidedBy || 'Cashier',
          date: todayStr,
          createdAt: new Date(),
        });
        financialAdjustmentNote = `Bank balance in ${bankAccount.bankName} reduced by Rs. ${totalAmount}`;
      }
    } else if (existing.paymentMethod === 'CASH') {
      financialAdjustmentNote = `Cash drawer revenue reduced by Rs. ${totalAmount} (excluded from closing cash sales)`;
    }

    // 4. REVERT SALES & STAFF PURCHASES ASSOCIATED WITH THIS BILL
    await Storage.removeSalesByBillId(existing.billId, existing.billNumber);
    if (existing.saleType === 'STAFF') {
      await Storage.removeStaffPurchasesByBillId(existing.billId, existing.billNumber);
    }

    // 5. DETAILED AUDIT LOG
    await Storage.logAudit({
      user: voidedBy || 'Cashier',
      role: userRole || 'CASHIER',
      action: 'BILL_VOIDED',
      module: 'POS / Bills',
      recordId: existing.billNumber,
      previousValue: `Amount: Rs.${existing.total} (${existing.paymentMethod}), Status: COMPLETED`,
      newValue: `Status: VOIDED, Balance & Inventory Restored`,
      details: `Reason: ${reason}. ${financialAdjustmentNote}. Restored items: ${
        restoredItemsSummary.join(', ') || 'None'
      }`,
    });

    return NextResponse.json({
      success: true,
      bill: updated,
      message: `Bill ${existing.billNumber} voided. Balance and stock restored successfully.`,
      restoredItems: restoredItemsSummary,
      financialAdjustment: financialAdjustmentNote,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
