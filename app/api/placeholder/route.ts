// app/api/placeholder/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ imageUrl: '/default-profile.jpg' });
}