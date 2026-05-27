import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { Document } from 'mongodb';

const COL = 'products';

// ── PATCH /api/products/[id] ───────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await connectDB();
    const col = db.collection<Document>(COL);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await req.json() as Record<string, any>;
    delete body._id;
    await col.updateOne({ id }, { $set: body });
    const updated = await col.findOne({ id });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { _id, ...safe } = (updated || {}) as any;
    void _id;
    return NextResponse.json(safe);
  } catch (err) {
    console.error('[API] PATCH /products/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// ── DELETE /api/products/[id] ──────────────────────────────
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await connectDB();
    await db.collection<Document>(COL).deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] DELETE /products/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
