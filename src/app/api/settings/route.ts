import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET() {
  try {
    const settings = await Storage.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { updatedBy = 'Admin', userRole = 'ADMIN', ...settingsData } = body;

    const updatedSettings = await Storage.updateSettings(settingsData);

    try {
      await Storage.logAudit({
        user: updatedBy,
        role: userRole,
        action: 'UPDATE_SETTINGS',
        module: 'Settings',
        recordId: 'SYSTEM_SETTINGS',
        previousValue: '',
        newValue: 'Updated System and Bill Settings',
        details: 'Admin updated shop info and receipt / bill configuration',
      });
    } catch (e) {
      console.warn('Failed to record audit log for settings update:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'System and Bill settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
