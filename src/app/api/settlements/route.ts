import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const kitchenStaffId = searchParams.get('kitchenStaffId') || undefined;
    const preview = searchParams.get('preview') === 'true';

    const settlements = await Storage.getSettlements(date, kitchenStaffId);

    if (preview && date && kitchenStaffId) {
      const staff = await Storage.getEmployeeById(kitchenStaffId);
      const defaultCommissionRate = staff?.commissionRate ?? 10;

      // 1. Assignments & Preparations on this date
      const assignments = await Storage.getAssignments(date);
      const staffAssignments = assignments.filter((a) => a.kitchenStaffId === kitchenStaffId);
      const assignedFoodIds = new Set<string>(staffAssignments.map((a) => a.foodItemId));

      const preparations = await Storage.getPreparations(date, kitchenStaffId);
      preparations.forEach((p) => assignedFoodIds.add(p.foodItemId));

      // 2. Bills and Sales on this date
      const allBills = await Storage.getBills();
      const validBills = allBills.filter((b) => {
        if (b.status === 'VOIDED') return false;
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bDate === date;
      });

      const allSales = await Storage.getSales(date);
      const eligibleSales = allSales.filter(
        (s) => s.kitchenStaffId === kitchenStaffId || assignedFoodIds.has(s.foodItemId)
      );

      // 3. Food Items list
      const foodItems = await Storage.getFoodItems();
      const foodMap = new Map<string, any>();
      foodItems.forEach((f) => foodMap.set(f.foodItemId, f));

      // 4. Build prepared items list
      const preparedItems = Array.from(assignedFoodIds).map((foodId) => {
        const asg = assignments.find((a) => a.foodItemId === foodId && a.kitchenStaffId === kitchenStaffId);
        const prep = preparations.find((p) => p.foodItemId === foodId);
        const meta = foodMap.get(foodId);

        const name = asg?.foodItemName || prep?.foodItemName || meta?.name || 'Unknown Item';
        const unit = meta?.unit || 'Piece';
        const sellingPrice = meta?.sellingPrice || 0;
        const staffPrice = meta?.staffPrice || 0;

        const preparedQuantity = asg?.assignedQuantity ?? prep?.preparedQuantity ?? 0;

        // Sales for this item: break down into Customer and Staff sales
        let customerSoldQty = 0;
        let customerTotalSales = 0;
        let staffSoldQty = 0;
        let staffTotalSales = 0;

        for (const s of eligibleSales) {
          if (s.foodItemId === foodId) {
            const qty = Number(s.quantity) || 0;
            const tot = Number(s.total) || 0;
            if (s.saleType === 'STAFF') {
              staffSoldQty += qty;
              staffTotalSales += tot;
            } else {
              customerSoldQty += qty;
              customerTotalSales += tot;
            }
          }
        }

        // If no sale records directly matched, check bills
        if (customerSoldQty === 0 && staffSoldQty === 0) {
          for (const b of validBills) {
            for (const it of b.items || []) {
              if (it.foodItemId === foodId && (!it.kitchenStaffId || it.kitchenStaffId === kitchenStaffId)) {
                const qty = Number(it.quantity) || 0;
                const tot = Number(it.total) || 0;
                if (b.saleType === 'STAFF') {
                  staffSoldQty += qty;
                  staffTotalSales += tot;
                } else {
                  customerSoldQty += qty;
                  customerTotalSales += tot;
                }
              }
            }
          }
        }

        // Fallbacks if total was 0 but quantity was recorded
        if (customerTotalSales === 0 && customerSoldQty > 0) {
          customerTotalSales = customerSoldQty * sellingPrice;
        }
        if (staffTotalSales === 0 && staffSoldQty > 0) {
          staffTotalSales = staffSoldQty * (staffPrice > 0 ? staffPrice : sellingPrice);
        }

        const itemSoldQty = customerSoldQty + staffSoldQty;
        const itemTotalSales = customerTotalSales + staffTotalSales;
        const remainingQuantity = Math.max(0, preparedQuantity - itemSoldQty - (prep?.wastageQuantity || 0));

        return {
          foodItemId: foodId,
          name,
          unit,
          sellingPrice,
          staffPrice,
          preparedQuantity,
          soldQuantity: itemSoldQty,
          customerSoldQty,
          customerTotalSales,
          staffSoldQty,
          staffTotalSales,
          remainingQuantity,
          totalSales: itemTotalSales,
        };
      });

      const customerSalesValue = preparedItems.reduce((sum, p) => sum + p.customerTotalSales, 0);
      const staffSalesValue = preparedItems.reduce((sum, p) => sum + p.staffTotalSales, 0);
      const totalEligibleSales = customerSalesValue + staffSalesValue;

      // Advances
      const advances = await Storage.getAdvances(kitchenStaffId);
      const activeAdvances = advances.filter((a) => a.status === 'APPROVED' && a.remainingAmount > 0);
      const totalRemainingAdvance = activeAdvances.reduce((sum, a) => sum + Number(a.remainingAmount || 0), 0);

      // Staff Purchases
      const purchases = await Storage.getStaffPurchases(kitchenStaffId);
      const datePurchases = purchases.filter((p) => p.date === date && !p.deducted);
      const totalStaffPurchases = datePurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

      const existingSettlement = settlements.find(
        (s) => s.kitchenStaffId === kitchenStaffId && s.date === date
      ) || null;

      return NextResponse.json({
        success: true,
        settlements,
        preview: {
          kitchenStaffId,
          kitchenStaffName: staff?.fullName || 'Staff Member',
          date,
          defaultCommissionRate,
          preparedItems,
          totalEligibleSales,
          customerSalesValue,
          staffSalesValue,
          activeAdvances,
          totalRemainingAdvance,
          staffPurchases: datePurchases,
          totalStaffPurchases,
          existingSettlement,
        },
      });
    }

    return NextResponse.json({ success: true, settlements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Calculate or re-calculate daily settlement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      kitchenStaffId,
      date,
      commissionRate: customRate,
      customAdvanceDeduction,
      actorUser,
    } = body;

    if (!kitchenStaffId || !date) {
      return NextResponse.json({ error: 'Kitchen staff ID and date are required' }, { status: 400 });
    }

    const staff = await Storage.getEmployeeById(kitchenStaffId);
    if (!staff) {
      return NextResponse.json({ error: 'Kitchen staff member not found' }, { status: 404 });
    }

    // Manual Commission Rate or Staff Default
    const commissionRate =
      customRate !== undefined && !isNaN(Number(customRate))
        ? Number(customRate)
        : (staff.commissionRate ?? 10);

    // Get assignments and preparations for this staff on this date
    const assignments = await Storage.getAssignments(date);
    const staffAssignments = assignments.filter((a) => a.kitchenStaffId === kitchenStaffId);
    const assignedFoodIds = new Set(staffAssignments.map((a) => a.foodItemId));

    // Also include items prepared by this staff
    const preparations = await Storage.getPreparations(date, kitchenStaffId);
    preparations.forEach((p) => assignedFoodIds.add(p.foodItemId));

    // Fetch all sales for this date
    const allSales = await Storage.getSales(date);
    const eligibleSales = allSales.filter(
      (s) => s.kitchenStaffId === kitchenStaffId || assignedFoodIds.has(s.foodItemId)
    );

    const foodItems = await Storage.getFoodItems();
    const foodMap = new Map<string, any>();
    foodItems.forEach((f) => foodMap.set(f.foodItemId, f));

    const allBills = await Storage.getBills();
    const validBills = allBills.filter((b) => {
      if (b.status === 'VOIDED') return false;
      const bDate = new Date(b.createdAt).toISOString().split('T')[0];
      return bDate === date;
    });

    let customerSalesValue = 0;
    let staffSalesValue = 0;

    for (const foodId of assignedFoodIds) {
      const meta = foodMap.get(foodId);
      const sellingPrice = meta?.sellingPrice || 0;
      const staffPrice = meta?.staffPrice || 0;

      let itemCustQty = 0;
      let itemCustTot = 0;
      let itemStfQty = 0;
      let itemStfTot = 0;

      for (const s of eligibleSales) {
        if (s.foodItemId === foodId) {
          const qty = Number(s.quantity) || 0;
          const tot = Number(s.total) || 0;
          if (s.saleType === 'STAFF') {
            itemStfQty += qty;
            itemStfTot += tot;
          } else {
            itemCustQty += qty;
            itemCustTot += tot;
          }
        }
      }

      if (itemCustQty === 0 && itemStfQty === 0) {
        for (const b of validBills) {
          for (const it of b.items || []) {
            if (it.foodItemId === foodId && (!it.kitchenStaffId || it.kitchenStaffId === kitchenStaffId)) {
              const qty = Number(it.quantity) || 0;
              const tot = Number(it.total) || 0;
              if (b.saleType === 'STAFF') {
                itemStfQty += qty;
                itemStfTot += tot;
              } else {
                itemCustQty += qty;
                itemCustTot += tot;
              }
            }
          }
        }
      }

      if (itemCustTot === 0 && itemCustQty > 0) itemCustTot = itemCustQty * sellingPrice;
      if (itemStfTot === 0 && itemStfQty > 0) itemStfTot = itemStfQty * (staffPrice > 0 ? staffPrice : sellingPrice);

      customerSalesValue += itemCustTot;
      staffSalesValue += itemStfTot;
    }

    const totalEligibleSales = customerSalesValue + staffSalesValue;
    const grossCommission = Math.round((totalEligibleSales * commissionRate) / 100);

    // Fetch employee advances
    const advances = await Storage.getAdvances(kitchenStaffId);
    const activeAdvance = advances.find((a) => a.status === 'APPROVED' && a.remainingAmount > 0);

    let advanceDeduction = 0;
    if (activeAdvance) {
      if (customAdvanceDeduction !== undefined && !isNaN(Number(customAdvanceDeduction))) {
        advanceDeduction = Math.min(Number(customAdvanceDeduction), activeAdvance.remainingAmount, grossCommission);
      } else {
        // default deduction: up to full advance remaining or capped at gross commission
        advanceDeduction = Math.min(activeAdvance.remainingAmount, grossCommission);
      }
    }

    // Fetch staff purchases for this employee on this date
    const purchases = await Storage.getStaffPurchases(kitchenStaffId);
    const datePurchases = purchases.filter((p) => p.date === date && !p.deducted);
    const staffPurchaseDeduction = datePurchases.reduce((sum, p) => sum + Number(p.total), 0);

    const netPayment = Math.max(0, grossCommission - advanceDeduction - staffPurchaseDeduction);

    const existingSettlements = await Storage.getSettlements(date, kitchenStaffId);
    const existing = existingSettlements[0];

    const settlementId = existing ? existing.settlementId : `SETTLE-${date.replace(/-/g, '')}-${kitchenStaffId.slice(-3)}`;

    const settlementData = {
      settlementId,
      date,
      kitchenStaffId,
      kitchenStaffName: staff.fullName,
      commissionRate,
      customerSalesValue,
      staffSalesValue,
      totalEligibleSales,
      grossCommission,
      advanceDeduction,
      staffPurchaseDeduction,
      netPayment,
      status: existing?.status === 'PAID' ? 'PAID' : 'CALCULATED',
      approvedBy: existing?.approvedBy || '',
      notes: `Sales: Rs.${totalEligibleSales} @ ${commissionRate}% | Adv Ded: Rs.${advanceDeduction} | Purch Ded: Rs.${staffPurchaseDeduction}`,
      createdAt: new Date(),
    };

    if (existing) {
      await Storage.updateSettlement(settlementId, settlementData);
    } else {
      await Storage.saveSettlement(settlementData);
    }

    await Storage.logAudit({
      user: actorUser || 'Admin',
      role: 'ADMIN',
      action: 'SETTLEMENT_CALCULATED',
      module: 'Daily Settlements',
      recordId: settlementId,
      previousValue: '',
      newValue: `Net: Rs.${netPayment} (Gross: Rs.${grossCommission} @ ${commissionRate}%)`,
      details: `Calculated daily settlement for ${staff.fullName} for date ${date}`,
    });

    return NextResponse.json({ success: true, settlement: settlementData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update settlement status (APPROVE, PAY, CANCEL)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      settlementId,
      status,
      actorUser,
      actorRole,
      paymentMethod,
      bankAccountId,
    } = body;

    if (!settlementId || !status) {
      return NextResponse.json({ error: 'Settlement ID and target status are required' }, { status: 400 });
    }

    const settlements = await Storage.getSettlements();
    const existing = settlements.find((s) => s.settlementId === settlementId);

    if (!existing) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }

    if (existing.status === 'PAID') {
      return NextResponse.json({ error: 'Paid settlements cannot be altered' }, { status: 400 });
    }

    const updates: any = { status };

    if (status === 'APPROVED') {
      updates.approvedBy = actorUser || 'Admin';
    }

    if (status === 'PAID') {
      updates.paidAt = new Date();
      updates.approvedBy = updates.approvedBy || actorUser || 'Admin';
      updates.paymentMethod = paymentMethod || 'CASH';

      // 1. Deduct advance if any
      if (existing.advanceDeduction > 0) {
        const advances = await Storage.getAdvances(existing.kitchenStaffId);
        const activeAdv = advances.find((a) => a.status === 'APPROVED' && a.remainingAmount > 0);
        if (activeAdv) {
          const newRemaining = Math.max(0, activeAdv.remainingAmount - existing.advanceDeduction);
          await Storage.updateAdvance(activeAdv.advanceId, {
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? 'DEDUCTED' : 'APPROVED',
          });
        }
      }

      // 2. Mark staff purchases as deducted
      const purchases = await Storage.getStaffPurchases(existing.kitchenStaffId);
      for (const p of purchases) {
        if (p.date === existing.date && !p.deducted) {
          p.deducted = true;
          p.settlementId = settlementId;
        }
      }

      // 3. Bank balance deduction if paid via BANK
      if (paymentMethod === 'BANK' && bankAccountId) {
        const bankAccount = await Storage.getBankAccountById(bankAccountId);
        if (bankAccount) {
          const updatedAcc = await Storage.adjustBankBalance(bankAccountId, -existing.netPayment);
          await Storage.saveBankTransaction({
            transactionId: `TXN-SETTLE-${Date.now().toString().slice(-6)}`,
            accountId: bankAccountId,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            type: 'WITHDRAWAL',
            amount: existing.netPayment,
            balanceAfter: Number(updatedAcc?.balance ?? (bankAccount.balance - existing.netPayment)),
            reference: settlementId,
            description: `Settlement Payout to ${existing.kitchenStaffName} for ${existing.date}`,
            performedBy: actorUser || 'Admin',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
          });
        }
      }
    }

    const updated = await Storage.updateSettlement(settlementId, updates);

    await Storage.logAudit({
      user: actorUser || 'Admin',
      role: actorRole || 'ADMIN',
      action: `SETTLEMENT_${status}`,
      module: 'Daily Settlements',
      recordId: settlementId,
      previousValue: `Status: ${existing.status}`,
      newValue: `Status: ${status}`,
      details: `Settlement updated to ${status} for ${existing.kitchenStaffName} (Net Payment: Rs.${existing.netPayment})`,
    });

    return NextResponse.json({ success: true, settlement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
