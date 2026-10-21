import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET() {
  try {
    const logs = await Storage.getAuditLogs();
    return NextResponse.json({ success: true, auditLogs: logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
