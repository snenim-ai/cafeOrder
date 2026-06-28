import { NextResponse } from 'next/server';
import getSupabaseClient from '../../../lib/supabase';

async function fetchOrderSheets(supabase: ReturnType<typeof getSupabaseClient>) {
  return supabase.from('order_sheets').select('*').order('createdAt', { ascending: false });
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await fetchOrderSheets(supabase);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, sheets: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    if (!body || !body.title) return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    const payload = {
      id: body.id ?? undefined,
      title: body.title,
      status: body.status ?? 'OPEN',
      createdAt: body.createdAt ?? new Date().toISOString(),
      closedAt: body.closedAt ?? null,
      cafeId: body.cafeId,
      cafeName: body.cafeName,
      cafeFloor: body.cafeFloor,
      naverOrderUrl: body.naverOrderUrl,
    };
    const { error } = await supabase.from('order_sheets').upsert(payload, { onConflict: 'id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: sheets, error: fetchError } = await fetchOrderSheets(supabase);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, sheets: sheets ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('order_sheets').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: sheets, error: fetchError } = await fetchOrderSheets(supabase);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, sheets: sheets ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
