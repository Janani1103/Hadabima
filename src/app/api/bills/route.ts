import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const saleType = searchParams.get('saleType');

    let bills = await Storage.getBills();

    if (date) {
      bills = bills.filter((b) => {
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bDate === date;
      });
    } else if (month) {
      bills = bills.filter((b) => {
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bDate.startsWith(month);
      });
    } else if (startDate && endDate) {
      bills = bills.filter((b) => {
        const bDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bDate >= startDate && bDate <= endDate;
      });
    }

    if (status && status !== 'ALL') {
      bills = bills.filter((b) => b.status === status);
    }

    if (saleType && saleType !== 'ALL') {
      bills = bills.filter((b) => b.saleType === saleType);
    }

    return NextResponse.json({ success: true, bills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
