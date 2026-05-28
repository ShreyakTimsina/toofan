import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { Order, OrderStatus } from '@/lib/types';

const COL = 'orders';

// ── PATCH /api/orders/[id] — update status or soft-delete ────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await connectDB();
    const body = await req.json();
    
    const updatePayload: Partial<Order> = {};
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.isDeleted !== undefined) updatePayload.isDeleted = body.isDeleted;

    await db.collection<Order>(COL).updateOne({ id }, { $set: updatePayload });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] PATCH /orders/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// ── DELETE /api/orders/[id] — permanent delete ──────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await connectDB();
    await db.collection<Order>(COL).deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] DELETE /orders/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
