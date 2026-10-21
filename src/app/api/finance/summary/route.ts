import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const bills = await Storage.getBills();
    const sales = await Storage.getSales(date);
    const expenses = await Storage.getExpenses(date);
    const settlements = await Storage.getSettlements(date);

    // Filter bills if date specified
    const activeBills = bills.filter((b) => {
      if (b.status === 'VOIDED') return false;
      if (date) {
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bDate === date;
      }
      return true;
    });

    let totalRevenue = 0;
    let customerSalesValue = 0;
    let staffSalesValue = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let onlineTotal = 0;

    for (const b of activeBills) {
      totalRevenue += Number(b.total);
      if (b.paymentMethod === 'CASH') cashTotal += Number(b.total);
      else if (b.paymentMethod === 'CARD') cardTotal += Number(b.total);
      else if (b.paymentMethod === 'ONLINE') onlineTotal += Number(b.total);

      if (b.saleType === 'STAFF') {
        staffSalesValue += Number(b.total);
      } else {
        customerSalesValue += Number(b.total);
      }
    }

    const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');
    const totalExpenses = activeExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const paidSettlements = settlements.filter((s) => s.status === 'PAID');
    const totalSettlementsPaid = paidSettlements.reduce((sum, s) => sum + Number(s.netPayment), 0);

    // Net Result = Total Revenue - Operational Expenses - Kitchen Staff Settlements
    const netProfit = totalRevenue - totalExpenses - totalSettlementsPaid;

    // Item popularity breakdown
    const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const s of sales) {
      if (!itemStats[s.foodItemId]) {
        itemStats[s.foodItemId] = { name: s.foodItemName, quantity: 0, revenue: 0 };
      }
      itemStats[s.foodItemId].quantity += Number(s.quantity);
      itemStats[s.foodItemId].revenue += Number(s.total);
    }

    const bankAccounts = await Storage.getBankAccounts();
    const totalBankBalance = bankAccounts.reduce((sum: number, b: any) => sum + Number(b.balance || 0), 0);

    const closings = await Storage.getCashierClosings();
    const latestClosing = closings.length > 0 ? closings[closings.length - 1] : null;
    const estimatedCashInDrawer = latestClosing ? Number(latestClosing.actualCash || 0) : cashTotal;

    const totalLiquidAssets = totalBankBalance + estimatedCashInDrawer;

    const topItems = Object.values(itemStats).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        customerSalesValue,
        staffSalesValue,
        totalExpenses,
        totalSettlementsPaid,
        netProfit,
        reconciliation: {
          cash: cashTotal,
          card: cardTotal,
          online: onlineTotal,
          total: totalRevenue,
        },
        treasury: {
          bankAccounts,
          totalBankBalance,
          estimatedCashInDrawer,
          totalLiquidAssets,
        },
        topItems,
        totalBillsCount: activeBills.length,
      },
    });
  } catch (error: any) {
    console.error('FINANCE SUMMARY ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
