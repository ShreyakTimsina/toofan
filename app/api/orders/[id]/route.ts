import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { Order, OrderStatus } from '@/lib/types';

const COL = 'orders';

// ── PATCH /api/orders/[id] — update status ─────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await connectDB();
    const { status } = await req.json() as { status: OrderStatus };
    await db.collection<Order>(COL).updateOne({ id }, { $set: { status } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] PATCH /orders/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
