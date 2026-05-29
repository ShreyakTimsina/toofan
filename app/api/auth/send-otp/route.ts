import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const db = await connectDB();
    
    // Check if user exists (fallback to default 'admin' if empty handled separately, but we'll just check)
    const usersCol = db.collection<AdminUser>('users');
    const userCount = await usersCol.countDocuments();
    
    // Auto-create default admin and developer if empty
    if (userCount === 0) {
      await usersCol.insertMany([
        {
          id: 'default-owner',
          phone: '9800000000',
          role: 'owner',
          name: 'Super Admin',
          createdAt: new Date().toISOString()
        } as AdminUser,
        {
          id: 'default-developer',
          phone: '9800000001',
          role: 'developer',
          name: 'Developer',
          createdAt: new Date().toISOString()
        } as AdminUser
      ]);
    }
    
    const user = await usersCol.findOne({ phone });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // SIMULATED OTP - In production, send via Twilio/SendGrid
    const otp = '123456';
    console.log(`[OTP] Sending OTP ${otp} to ${phone}`);
    
    // We could store the OTP in the DB with an expiration, but for MVP/simulation, we'll hardcode verification
    return NextResponse.json({ ok: true, message: 'OTP sent (use 123456 for testing)' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
