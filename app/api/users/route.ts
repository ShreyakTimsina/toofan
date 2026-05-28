import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { generateId } from '@/lib/data';
import type { AdminUser } from '@/lib/types';

const COL = 'users';

export async function GET() {
  try {
    const db = await connectDB();
    const users = await db.collection<AdminUser>(COL).find().toArray();
    // omit passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json({ ok: true, users: safeUsers });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await connectDB();
    
    // Check if username exists
    const existing = await db.collection<AdminUser>(COL).findOne({ username: body.username });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const newUser: AdminUser = {
      id: generateId(),
      username: body.username,
      password: body.password,
      role: body.role,
      name: body.name,
      createdAt: new Date().toISOString()
    };

    await db.collection<AdminUser>(COL).insertOne(newUser);
    const { password, ...safeUser } = newUser;
    return NextResponse.json({ ok: true, user: safeUser }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const db = await connectDB();
    await db.collection<AdminUser>(COL).deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
