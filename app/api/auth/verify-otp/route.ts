import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    
    // Simulate OTP verification
    if (otp !== '123456') {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    const db = await connectDB();
    const user = await db.collection<AdminUser>('users').findOne({ phone });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password: _, ...userInfo } = user;
    return NextResponse.json({ ok: true, user: userInfo });
  } catch (err) {
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 });
  }
}
