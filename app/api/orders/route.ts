import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { Document } from 'mongodb';
import type { Order } from '@/lib/types';

const COL = 'orders';

// ── GET /api/orders ────────────────────────────────────────
export async function GET() {
  try {
    const db = await connectDB();
    const docs = await db.collection<Document>(COL).find({}).sort({ timestamp: -1 }).toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(docs.map(({ _id, ...o }: any) => o as Order));
  } catch (err) {
    console.error('[API] GET /orders error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// ── POST /api/orders ───────────────────────────────────────
export async function POST(req: Request) {
  try {
    const db = await connectDB();
    const order = await req.json() as Order;

    // Increment orderCount for each product
    const productCol = db.collection<Document>('products');
    for (const item of order.items) {
      await productCol.updateOne(
        { id: item.productId },
        { $inc: { orderCount: item.qty } }
      );
    }

    await db.collection<Document>(COL).insertOne(order as unknown as Document);
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (err) {
    console.error('[API] POST /orders error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
