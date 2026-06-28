import { NextResponse } from 'next/server';
import getSupabaseClient from '../../../lib/supabase';

async function fetchMenus(supabase: ReturnType<typeof getSupabaseClient>) {
  return supabase
    .from('menus')
    .select('*')
    .order('order', { ascending: true })
    .order('createdAt', { ascending: true });
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await fetchMenus(supabase);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, menus: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    if (!body || !body.menuName) return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    const payload = {
      id: body.id ?? undefined,
      cafeId: body.cafeId,
      cafeName: body.cafeName,
      menuName: body.menuName,
      price: body.price ?? 0,
      soldOutYn: !!body.soldOutYn,
      order: body.order ?? 9999,
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('menus').upsert(payload, { onConflict: 'id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: menus, error: fetchError } = await fetchMenus(supabase);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, menus: menus ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('menus').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: menus, error: fetchError } = await fetchMenus(supabase);
    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    return NextResponse.json({ success: true, menus: menus ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
