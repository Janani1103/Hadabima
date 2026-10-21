import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET() {
  try {
    const items = await Storage.getFoodItems();
    return NextResponse.json({ success: true, foodItems: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sellingPrice, staffPrice, unit, shelfLifeDays, imageUrl, actorUser, actorRole } = body;

    if (!name || sellingPrice === undefined || staffPrice === undefined) {
      return NextResponse.json({ error: 'Name, selling price and staff price are required' }, { status: 400 });
    }

    const count = (await Storage.getFoodItems()).length + 1;
    const foodItemId = `FOOD-${String(count).padStart(3, '0')}`;

    const newItem = {
      foodItemId,
      name,
      sellingPrice: Number(sellingPrice),
      staffPrice: Number(staffPrice),
      unit: unit || 'Piece',
      shelfLifeDays: Number(shelfLifeDays) || 1,
      imageUrl: imageUrl || '',
      priceHistory: [
        {
          sellingPrice: Number(sellingPrice),
          staffPrice: Number(staffPrice),
          effectiveDate: new Date().toISOString(),
          changedBy: actorUser || 'Cashier',
        },
      ],
      status: 'ACTIVE',
    };

    await Storage.saveFoodItem(newItem);

    await Storage.logAudit({
      user: actorUser || 'Cashier',
      role: actorRole || 'CASHIER',
      action: 'FOOD_ITEM_CREATED',
      module: 'Food Items',
      recordId: foodItemId,
      previousValue: '',
      newValue: `${name} - Sell: Rs.${sellingPrice}, Staff: Rs.${staffPrice}`,
      details: `Added new food item with shelf life ${newItem.shelfLifeDays} day(s)`,
    });

    return NextResponse.json({ success: true, foodItem: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { foodItemId, updates, actorUser, actorRole } = body;

    if (!foodItemId || !updates) {
      return NextResponse.json({ error: 'Food item ID and updates are required' }, { status: 400 });
    }

    const existing = await Storage.getFoodItemById(foodItemId);
    if (!existing) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    // Maintain historical price changes tracking
    const isSellingPriceChanged =
      updates.sellingPrice !== undefined && Number(updates.sellingPrice) !== existing.sellingPrice;
    const isStaffPriceChanged =
      updates.staffPrice !== undefined && Number(updates.staffPrice) !== existing.staffPrice;

    if (isSellingPriceChanged || isStaffPriceChanged) {
      const existingHistory = Array.isArray(existing.priceHistory) && existing.priceHistory.length > 0
        ? existing.priceHistory
        : [
            {
              sellingPrice: existing.sellingPrice,
              staffPrice: existing.staffPrice,
              effectiveDate: existing.createdAt ? new Date(existing.createdAt).toISOString() : new Date().toISOString(),
              changedBy: 'Initial setup',
            },
          ];

      const newSelling = isSellingPriceChanged ? Number(updates.sellingPrice) : existing.sellingPrice;
      const newStaff = isStaffPriceChanged ? Number(updates.staffPrice) : existing.staffPrice;

      updates.priceHistory = [
        ...existingHistory,
        {
          sellingPrice: newSelling,
          staffPrice: newStaff,
          effectiveDate: new Date().toISOString(),
          changedBy: actorUser || 'Cashier',
        },
      ];
    }

    const updated = await Storage.updateFoodItem(foodItemId, updates);

    // Audit price changes - Explicitly noting historical sales protection
    if (isSellingPriceChanged) {
      await Storage.logAudit({
        user: actorUser || 'Cashier',
        role: actorRole || 'CASHIER',
        action: 'FOOD_PRICE_CHANGED',
        module: 'Food Items',
        recordId: foodItemId,
        previousValue: `Selling Price: Rs.${existing.sellingPrice}`,
        newValue: `Selling Price: Rs.${updates.sellingPrice}`,
        details: `Updated normal selling price for "${existing.name}". Historical bills and sales retain their original selling price.`,
      });
    }

    if (isStaffPriceChanged) {
      await Storage.logAudit({
        user: actorUser || 'Cashier',
        role: actorRole || 'CASHIER',
        action: 'STAFF_PRICE_CHANGED',
        module: 'Food Items',
        recordId: foodItemId,
        previousValue: `Staff Price: Rs.${existing.staffPrice}`,
        newValue: `Staff Price: Rs.${updates.staffPrice}`,
        details: `Updated staff price for "${existing.name}". Historical bills and sales retain their original price.`,
      });
    }

    return NextResponse.json({ success: true, foodItem: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
