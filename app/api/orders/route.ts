import { NextResponse } from 'next/server';
import getSupabaseClient from '../../../lib/supabase';

async function fetchOrderItems(supabase: ReturnType<typeof getSupabaseClient>, sheetId: string) {
  return supabase
    .from('order_items')
    .select('*')
    .eq('orderSheetId', sheetId)
    .order('createdAt', { ascending: true });
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(request.url);
    const sheetId = url.searchParams.get('sheetId');
    if (!sheetId) return NextResponse.json({ success: false, error: 'Missing sheetId' }, { status: 400 });
    const { data, error } = await fetchOrderItems(supabase, sheetId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, items: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    if (!body || !body.orderSheetId || !body.userName) return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    const payload = {
      ...body,
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('order_items').upsert(payload, { onConflict: 'id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: items, error: fetchError } = await fetchOrderItems(supabase, body.orderSheetId);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, items: items ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id, orderSheetId } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('order_items').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!orderSheetId) return NextResponse.json({ success: true });
    const { data: items, error: fetchError } = await fetchOrderItems(supabase, orderSheetId);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, items: items ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
