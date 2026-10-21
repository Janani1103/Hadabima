import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const employee = await Storage.getEmployeeByUsername(username);

    if (!employee || employee.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (employee.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is deactivated. Contact Admin.' }, { status: 403 });
    }

    const userProfile = {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      username: employee.username,
      employeeType: employee.employeeType,
      commissionRate: employee.commissionRate,
      status: employee.status,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
