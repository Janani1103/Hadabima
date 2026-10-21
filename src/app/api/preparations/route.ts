import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

function computeExpiry(dateStr: string, shelfDays: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + shelfDays);
  return d.toISOString().split('T')[0];
}

function computeStatus(expiryDate: string, todayStr: string): 'FRESH' | 'EXPIRING_TODAY' | 'EXPIRED' {
  if (expiryDate < todayStr) return 'EXPIRED';
  if (expiryDate === todayStr) return 'EXPIRING_TODAY';
  return 'FRESH';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const kitchenStaffId = searchParams.get('kitchenStaffId') || undefined;
    const todayStr = new Date().toISOString().split('T')[0];

    const preps = await Storage.getPreparations(date, kitchenStaffId);

    // Refresh status based on today's date
    const updatedPreps = preps.map((p) => {
      const status = computeStatus(p.expiryDate, todayStr);
      return { ...p, status };
    });

    return NextResponse.json({ success: true, preparations: updatedPreps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, foodItemId, kitchenStaffId, preparedQuantity } = body;

    if (!date || !foodItemId || !kitchenStaffId || !preparedQuantity) {
      return NextResponse.json({ error: 'Date, food item, staff, and prepared quantity are required' }, { status: 400 });
    }

    const food = await Storage.getFoodItemById(foodItemId);
    const staff = await Storage.getEmployeeById(kitchenStaffId);

    if (!food || !staff) {
      return NextResponse.json({ error: 'Food item or staff member not found' }, { status: 404 });
    }

    const expiryDate = computeExpiry(date, food.shelfLifeDays || 1);
    const todayStr = new Date().toISOString().split('T')[0];
    const status = computeStatus(expiryDate, todayStr);

    const preparationId = `PREP-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newPrep = {
      preparationId,
      date,
      foodItemId,
      foodItemName: food.name,
      kitchenStaffId,
      kitchenStaffName: staff.fullName,
      preparedQuantity: Number(preparedQuantity),
      soldQuantity: 0,
      wastageQuantity: 0,
      remainingQuantity: Number(preparedQuantity),
      expiryDate,
      status,
    };

    await Storage.savePreparation(newPrep);

    return NextResponse.json({ success: true, preparation: newPrep }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { preparationId, wastageQuantity, notes, actorUser } = body;

    if (!preparationId) {
      return NextResponse.json({ error: 'Preparation ID is required' }, { status: 400 });
    }

    const preps = await Storage.getPreparations();
    const existing = preps.find((p) => p.preparationId === preparationId);
    if (!existing) {
      return NextResponse.json({ error: 'Preparation batch not found' }, { status: 404 });
    }

    const additionalWastage = Number(wastageQuantity) || 0;
    const newWastage = (existing.wastageQuantity || 0) + additionalWastage;
    const newRemaining = Math.max(0, existing.preparedQuantity - existing.soldQuantity - newWastage);

    const updated = await Storage.updatePreparation(preparationId, {
      wastageQuantity: newWastage,
      remainingQuantity: newRemaining,
    });

    await Storage.logAudit({
      user: actorUser || 'Kitchen Staff',
      role: 'KITCHEN',
      action: 'WASTAGE_RECORDED',
      module: 'Food Preparation',
      recordId: preparationId,
      previousValue: `Wastage: ${existing.wastageQuantity}`,
      newValue: `Wastage: ${newWastage} (Remaining: ${newRemaining})`,
      details: notes || `Recorded ${additionalWastage} units wasted for ${existing.foodItemName}`,
    });

    return NextResponse.json({ success: true, preparation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
