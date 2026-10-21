import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function POST() {
  try {
    await Storage.resetDatabase();
    return NextResponse.json({ success: true, message: 'Database reset and seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
