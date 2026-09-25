import { NextResponse } from 'next/server';
import { getSystemInfo } from '@/lib/admin/system-info';

export async function GET() {
  try {
    const result = await getSystemInfo();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
