import { NextRequest, NextResponse } from 'next/server';
import { getDirectMessages } from '@/lib/actions';

// Dynamic route short-polling synchronization endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'Target user coordinate parameter missing.' }, { status: 400 });
    }

    const messages = await getDirectMessages(otherUserId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Signal packet extraction failure.' }, { status: 500 });
  }
}
