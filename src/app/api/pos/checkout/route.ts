import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items, // array of { foodItemId, quantity }
      saleType, // 'CUSTOMER' | 'STAFF'
      employeeId, // optional if saleType === 'STAFF'
      cashierId,
      cashierName,
      paymentMethod, // 'CASH' | 'CARD' | 'ONLINE'
      bankAccountId,
      discount,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order cart is empty' }, { status: 400 });
    }

    let staffEmployee: any = null;
    if (saleType === 'STAFF' && employeeId) {
      staffEmployee = await Storage.getEmployeeById(employeeId);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const preparations = await Storage.getPreparations();
    const assignments = await Storage.getAssignments(todayStr);

    let calculatedSubtotal = 0;
    const processedBillItems: any[] = [];
    const salesToCreate: any[] = [];
    const staffPurchasesToCreate: any[] = [];

    // Verify all items, prices, fresh stock availability, and expiry
    for (const cartItem of items) {
      const foodItem = await Storage.getFoodItemById(cartItem.foodItemId);
      if (!foodItem) {
        return NextResponse.json(
          { error: `Food item ${cartItem.foodItemId} not found.` },
          { status: 404 }
        );
      }

      if (foodItem.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: `Item ${foodItem.name} is currently inactive.` },
          { status: 400 }
        );
      }

      const reqQty = Number(cartItem.quantity);
      if (isNaN(reqQty) || reqQty <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity specified for ${foodItem.name}.` },
          { status: 400 }
        );
      }

      // Check preparation batches for this food item
      const itemBatches = preparations.filter((p) => p.foodItemId === foodItem.foodItemId);

      // Separate fresh (sellable) batches from expired batches
      const validFreshBatches = itemBatches
        .filter((p) => (p.remainingQuantity || 0) > 0 && p.expiryDate >= todayStr)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate) || a.date.localeCompare(b.date));

      const totalFreshAvailable = validFreshBatches.reduce(
        (sum, b) => sum + (b.remainingQuantity || 0),
        0
      );

      const expiredBlockedQty = itemBatches
        .filter((p) => (p.remainingQuantity || 0) > 0 && p.expiryDate < todayStr)
        .reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

      // If this item has preparation batches recorded, enforce strict fresh stock limits & block expired stock
      if (itemBatches.length > 0) {
        if (totalFreshAvailable === 0) {
          return NextResponse.json(
            {
              error:
                expiredBlockedQty > 0
                  ? `Cannot sell ${foodItem.name}. All remaining stock (${expiredBlockedQty} units) is expired and blocked from sale.`
                  : `Item ${foodItem.name} is completely out of stock.`,
            },
            { status: 400 }
          );
        }

        if (reqQty > totalFreshAvailable) {
          return NextResponse.json(
            {
              error: `Insufficient fresh stock for ${foodItem.name}. Requested: ${reqQty}, Available fresh: ${totalFreshAvailable}${
                expiredBlockedQty > 0 ? ` (${expiredBlockedQty} expired units are blocked from sale)` : ''
              }.`,
            },
            { status: 400 }
          );
        }
      }

      // RULE 3 & 4: Automatically apply correct locked price
      const unitPrice = saleType === 'STAFF' ? foodItem.staffPrice : foodItem.sellingPrice;
      const lineTotal = unitPrice * reqQty;
      calculatedSubtotal += lineTotal;

      const dailyAsg = assignments.find((a) => a.foodItemId === foodItem.foodItemId);
      // Determine kitchen staff: primary from the fresh batch being consumed, or daily assignment
      const primaryStaffId = validFreshBatches[0]?.kitchenStaffId || dailyAsg?.kitchenStaffId || undefined;

      processedBillItems.push({
        foodItemId: foodItem.foodItemId,
        foodItemName: foodItem.name,
        quantity: reqQty,
        unitPrice, // Historical unit price stored
        total: lineTotal,
        kitchenStaffId: primaryStaffId,
      });

      // FIFO deduction strictly across unexpired fresh batches (earliest expiry first)
      if (validFreshBatches.length > 0) {
        let remainingToDeduct = reqQty;
        for (const batch of validFreshBatches) {
          if (remainingToDeduct <= 0) break;
          const deductFromThisBatch = Math.min(batch.remainingQuantity, remainingToDeduct);
          const newSold = (batch.soldQuantity || 0) + deductFromThisBatch;
          const newRemaining = Math.max(
            0,
            (batch.preparedQuantity || 0) - newSold - (batch.wastageQuantity || 0)
          );

          await Storage.updatePreparation(batch.preparationId, {
            soldQuantity: newSold,
            remainingQuantity: newRemaining,
          });

          // Update in-memory reference for this batch in case another cart item touches it
          batch.soldQuantity = newSold;
          batch.remainingQuantity = newRemaining;

          remainingToDeduct -= deductFromThisBatch;
        }
      }
    }

    const billDiscount = Number(discount) || 0;
    const finalTotal = Math.max(0, calculatedSubtotal - billDiscount);

    // Generate Bill Number
    const bills = await Storage.getBills();
    let prefix = 'BILL-';
    try {
      const settings = await Storage.getSettings();
      if (settings?.billSettings?.billPrefix) {
        prefix = settings.billSettings.billPrefix.trim();
      }
    } catch {}
    const billSeq = String(bills.length + 1).padStart(3, '0');
    const billNumber = `${prefix}${todayStr.replace(/-/g, '')}-${billSeq}`;
    const billId = `B-${Date.now()}`;

    let bankAccountName = '';
    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && bankAccountId) {
      const bankAccount = await Storage.getBankAccountById(bankAccountId);
      if (bankAccount) {
        bankAccountName = `${bankAccount.bankName} (${bankAccount.accountNumber})`;
        const updatedAcc = await Storage.adjustBankBalance(bankAccountId, finalTotal);

        await Storage.saveBankTransaction({
          transactionId: `TXN-POS-${Date.now().toString().slice(-6)}`,
          accountId: bankAccountId,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          type: 'DEPOSIT',
          amount: finalTotal,
          balanceAfter: Number(updatedAcc?.balance ?? bankAccount.balance),
          reference: billNumber,
          description: `POS ${paymentMethod} Sale: ${billNumber}`,
          performedBy: cashierName || 'Cashier',
          date: todayStr,
          createdAt: new Date(),
        });
      }
    }

    const newBill = {
      billId,
      billNumber,
      cashierId: cashierId || 'EMP-002',
      cashierName: cashierName || 'Cashier',
      saleType,
      employeeId: saleType === 'STAFF' ? employeeId : undefined,
      employeeName: saleType === 'STAFF' && staffEmployee ? staffEmployee.fullName : undefined,
      items: processedBillItems,
      subtotal: calculatedSubtotal,
      discount: billDiscount,
      total: finalTotal,
      paymentMethod: paymentMethod || 'CASH',
      bankAccountId: bankAccountId || '',
      bankAccountName,
      status: 'COMPLETED',
      createdAt: new Date(),
    };

    await Storage.saveBill(newBill);

    // Create individual Sales records & Staff Purchases
    for (const item of processedBillItems) {
      const saleId = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const saleRecord = {
        saleId,
        billId,
        foodItemId: item.foodItemId,
        foodItemName: item.foodItemName,
        kitchenStaffId: item.kitchenStaffId,
        quantity: item.quantity,
        saleType,
        employeeId: saleType === 'STAFF' ? employeeId : null,
        unitPrice: item.unitPrice,
        total: item.total,
        paymentMethod: paymentMethod || 'CASH',
        cashierId: cashierId || 'EMP-002',
        date: todayStr,
        createdAt: new Date(),
      };
      await Storage.saveSale(saleRecord);

      // RULE 6 & 23: If Staff Sale, record staff purchase for automatic deduction in daily settlement
      if (saleType === 'STAFF' && employeeId) {
        const purchaseRecord = {
          purchaseId: `SP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          billId,
          employeeId,
          employeeName: staffEmployee.fullName,
          foodItemId: item.foodItemId,
          foodItemName: item.foodItemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          date: todayStr,
          deducted: false,
        };
        await Storage.saveStaffPurchase(purchaseRecord);
      }
    }

    // Audit log for staff sale
    if (saleType === 'STAFF') {
      await Storage.logAudit({
        user: cashierName || 'Cashier',
        role: 'CASHIER',
        action: 'STAFF_SALE_COMPLETED',
        module: 'POS',
        recordId: billNumber,
        previousValue: '',
        newValue: `Staff Sale: Rs.${finalTotal} for ${staffEmployee?.fullName}`,
        details: `Purchased at staff rates. Recorded for automatic settlement deduction.`,
      });
    }

    return NextResponse.json({
      success: true,
      bill: newBill,
      message: 'Bill created and recorded successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
