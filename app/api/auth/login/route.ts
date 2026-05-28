import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSettings, generateId } from '@/lib/data';
import type { AdminUser, AdminRole } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const db = await connectDB();
    const usersCol = db.collection<AdminUser>('users');
    
    // Check if any users exist, if not, create default owner from settings or 'admin'
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      const settings = getSettings();
      const defaultPw = settings.adminPassword || 'admin';
      await usersCol.insertOne({
        id: generateId(),
        username: 'admin',
        password: defaultPw,
        role: 'owner',
        name: 'Super Admin',
        createdAt: new Date().toISOString()
      } as AdminUser);
    }
    
    // Authenticate
    const user = await usersCol.findOne({ username, password });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Return user info (no password)
    const { password: _, ...userInfo } = user;
    return NextResponse.json({ ok: true, user: userInfo });
  } catch (err) {
    console.error('[API] Auth Login Error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
