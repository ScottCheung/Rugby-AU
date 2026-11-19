import { NextResponse } from 'next/server';
import { getSites } from '@/lib/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getSites());
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not connect to MongoDB. Start the local stack with docker compose up.',
      },
      { status: 503 },
    );
  }
}
