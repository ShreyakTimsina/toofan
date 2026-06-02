import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DEFAULT_SETTINGS } from '@/lib/data';

export async function GET() {
  try {
    const db = await connectDB();
    const settings = await db.collection('settings').findOne({ _id: 'global' as unknown as import('mongodb').ObjectId });
    
    if (!settings) {
      // Return default if not initialized
      return NextResponse.json(DEFAULT_SETTINGS);
    }
    
    // Merge with defaults to ensure new fields are present
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const db = await connectDB();
    const updates = await req.json();
    
    // Remove _id if it exists in updates to prevent Mongo error
    delete updates._id;

    await db.collection('settings').updateOne(
      { _id: 'global' as unknown as import('mongodb').ObjectId },
      { $set: updates },
      { upsert: true }
    );
    
    const settings = await db.collection('settings').findOne({ _id: 'global' as unknown as import('mongodb').ObjectId });
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (err) {
    console.error('Settings PUT error:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
