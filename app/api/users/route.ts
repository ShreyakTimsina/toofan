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
    
    // Check if phone exists
    const existing = await db.collection<AdminUser>(COL).findOne({ phone: body.phone });
    if (existing) {
      return NextResponse.json({ error: 'Phone number already taken' }, { status: 400 });
    }

    const newUser: AdminUser = {
      id: generateId(),
      phone: body.phone,
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const db = await connectDB();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    // Check if new phone is taken by another user
    if (body.phone) {
      const existing = await db.collection<AdminUser>(COL).findOne({ phone: body.phone, id: { $ne: body.id } });
      if (existing) {
        return NextResponse.json({ error: 'Phone number already taken by another user' }, { status: 400 });
      }
    }
    
    const updateData: Partial<AdminUser> = {};
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.role) updateData.role = body.role;
    if (body.password) updateData.password = body.password;
    
    await db.collection<AdminUser>(COL).updateOne({ id: body.id }, { $set: updateData });
    
    const updatedUser = await db.collection<AdminUser>(COL).findOne({ id: body.id });
    if (!updatedUser) return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    
    const { password, ...safeUser } = updatedUser;
    return NextResponse.json({ ok: true, user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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
