import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const assignments = await Storage.getAssignments(date);
    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, foodItemId, kitchenStaffId, assignedQuantity, createdBy } = body;

    if (!date || !foodItemId || !kitchenStaffId || !assignedQuantity) {
      return NextResponse.json({ error: 'Date, food item, kitchen staff, and quantity are required' }, { status: 400 });
    }

    const food = await Storage.getFoodItemById(foodItemId);
    const staff = await Storage.getEmployeeById(kitchenStaffId);

    if (!food || !staff) {
      return NextResponse.json({ error: 'Food item or staff member not found' }, { status: 404 });
    }

    const assignmentId = `ASG-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newAssignment = {
      assignmentId,
      date,
      foodItemId,
      foodItemName: food.name,
      kitchenStaffId,
      kitchenStaffName: staff.fullName,
      assignedQuantity: Number(assignedQuantity),
      createdBy: createdBy || 'Cashier',
    };

    await Storage.saveAssignment(newAssignment);

    // Sync or create preparation batch
    try {
      const existingPreps = await Storage.getPreparations(date, kitchenStaffId);
      const existingPrep = existingPreps.find((p) => p.foodItemId === foodItemId);
      const shelfDays = food.shelfLifeDays || 1;
      const d = new Date(date);
      d.setDate(d.getDate() + shelfDays);
      const expiryDate = d.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const status = expiryDate < todayStr ? 'EXPIRED' : (expiryDate === todayStr ? 'EXPIRING_TODAY' : 'FRESH');

      if (!existingPrep) {
        await Storage.savePreparation({
          preparationId: `PREP-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          date,
          foodItemId,
          foodItemName: food.name,
          kitchenStaffId,
          kitchenStaffName: staff.fullName,
          preparedQuantity: Number(assignedQuantity),
          soldQuantity: 0,
          wastageQuantity: 0,
          remainingQuantity: Number(assignedQuantity),
          expiryDate,
          status,
        });
      } else {
        const remaining = Math.max(0, Number(assignedQuantity) - (existingPrep.soldQuantity || 0) - (existingPrep.wastageQuantity || 0));
        await Storage.updatePreparation(existingPrep.preparationId, {
          preparedQuantity: Number(assignedQuantity),
          remainingQuantity: remaining,
        });
      }
    } catch (prepErr) {
      console.error('Failed to sync preparation batch:', prepErr);
    }

    return NextResponse.json({ success: true, assignment: newAssignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { assignmentId, date, foodItemId, kitchenStaffId, assignedQuantity } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    if (!foodItemId || !kitchenStaffId || !assignedQuantity) {
      return NextResponse.json({ error: 'Food item, kitchen staff, and quantity are required' }, { status: 400 });
    }

    const food = await Storage.getFoodItemById(foodItemId);
    const staff = await Storage.getEmployeeById(kitchenStaffId);

    if (!food || !staff) {
      return NextResponse.json({ error: 'Food item or staff member not found' }, { status: 404 });
    }

    const updates: any = {
      foodItemId,
      foodItemName: food.name,
      kitchenStaffId,
      kitchenStaffName: staff.fullName,
      assignedQuantity: Number(assignedQuantity),
    };

    if (date) updates.date = date;

    const updated = await Storage.updateAssignment(assignmentId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Sync updated preparation batch
    try {
      const targetDate = date || updated.date;
      const existingPreps = await Storage.getPreparations(targetDate, kitchenStaffId);
      const existingPrep = existingPreps.find((p) => p.foodItemId === foodItemId);
      if (existingPrep) {
        const remaining = Math.max(0, Number(assignedQuantity) - (existingPrep.soldQuantity || 0) - (existingPrep.wastageQuantity || 0));
        await Storage.updatePreparation(existingPrep.preparationId, {
          preparedQuantity: Number(assignedQuantity),
          remainingQuantity: remaining,
        });
      }
    } catch (prepErr) {
      console.error('Failed to update synced preparation:', prepErr);
    }

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const deleted = await Storage.deleteAssignment(assignmentId);
    if (!deleted) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
