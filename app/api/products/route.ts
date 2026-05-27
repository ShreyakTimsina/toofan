import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SEED_PRODUCTS } from '@/lib/data';
import type { Product } from '@/lib/types';
import type { Document } from 'mongodb';

const COL = 'products';

// ── GET /api/products ──────────────────────────────────────
export async function GET() {
  try {
    const db = await connectDB();
    const col = db.collection<Document>(COL);
    let docs = await col.find({}).sort({ displayOrder: 1 }).toArray();

    // Seed the collection if empty
    if (docs.length === 0) {
      await col.insertMany(SEED_PRODUCTS as unknown as Document[]);
      docs = await col.find({}).sort({ displayOrder: 1 }).toArray();
    }

    // Strip MongoDB _id from response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(docs.map(({ _id, ...p }: any) => p as Product));
  } catch (err) {
    console.error('[API] GET /products error:', err);
    return NextResponse.json(SEED_PRODUCTS);
  }
}

// ── POST /api/products ─────────────────────────────────────
export async function POST(req: Request) {
  try {
    const db = await connectDB();
    const col = db.collection<Document>(COL);
    const body = await req.json() as Omit<Product, 'id'>;
    const id = `P-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const allProds = await col.find({}).toArray();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maxOrder = allProds.reduce((m: number, p: any) => Math.max(m, p.displayOrder || 0), 0);
    const product: Product = {
      id,
      name: body.name,
      category: body.category,
      description: body.description || '',
      price: body.price,
      image: body.image || '/images/placeholder.png',
      orderCount: 0,
      active: true,
      displayOrder: maxOrder + 1,
    };
    await col.insertOne(product as unknown as Document);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error('[API] POST /products error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// ── PUT /api/products — batch reorder/update ───────────────
export async function PUT(req: Request) {
  try {
    const db = await connectDB();
    const col = db.collection<Document>(COL);
    const products = await req.json() as Product[];
    const ops = products.map((p) => ({
      updateOne: {
        filter: { id: p.id },
        update: { $set: p as unknown as Document },
        upsert: true,
      },
    }));
    await col.bulkWrite(ops);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] PUT /products error:', err);
    return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
  }
}
