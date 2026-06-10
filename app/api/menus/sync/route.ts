import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: false, message: 'Menu sync endpoint removed. Menu data is managed manually in admin.' }, { status: 404 });
}
